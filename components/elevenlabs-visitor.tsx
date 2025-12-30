'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Phone, PhoneOff, Loader2, Volume2, Mic, MicOff } from 'lucide-react'

interface ElevenLabsVisitorProps {
  config: {
    tier: number
    elevenLabsAgentId: string
    sessionToken: string
    voiceId: string
    voiceSettings: {
      stability: number
      similarity_boost: number
      style?: number
      use_speaker_boost?: boolean
    }
    config: {
      name: string
      systemPrompt: string
      firstMessage: string
    }
  }
  onEnd: () => void
}

export function ElevenLabsVisitor({ config, onEnd }: ElevenLabsVisitorProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCall()

    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current)
      keepaliveIntervalRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect()
      audioWorkletNodeRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  const startCall = async () => {
    setCallStatus('connecting')
    setError(null)

    try {
      // Validate agent ID
      if (!config.elevenLabsAgentId) {
        throw new Error('No ElevenLabs agent ID configured. Please sync the agent first.')
      }

      console.log('Requesting signed URL for agent:', config.elevenLabsAgentId)

      // Get signed URL from backend
      const res = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: config.elevenLabsAgentId })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to get signed URL: ${res.status}`)
      }

      const { signedUrl } = await res.json()
      console.log('Received signed URL, connecting to WebSocket...')

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })

      // Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      mediaStreamRef.current = stream

      // Connect WebSocket
      const ws = new WebSocket(signedUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to ElevenLabs Conversational AI')
        setCallStatus('connected')

        // Start sending audio from mic
        startAudioStream(stream)

        // Start keepalive - send ping every 15 seconds
        keepaliveIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              // Send a keepalive ping message
              wsRef.current.send(JSON.stringify({ type: 'ping' }))
              console.log('Sent keepalive ping')
            } catch (error) {
              console.error('Failed to send keepalive:', error)
            }
          }
        }, 15000) // Every 15 seconds
      }

      ws.onmessage = async (event) => {
        const isBinary = typeof event.data !== 'string'

        if (isBinary) {
          // Audio data - play it
          await playAudioChunk(event.data)
        } else {
          // Control message
          const message = JSON.parse(event.data)
          handleControlMessage(message)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
        setCallStatus('disconnected')
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })

        // Provide user-friendly error messages based on close code
        if (event.code === 1006) {
          setError('Connection lost - Please check your internet connection')
        } else if (event.code === 1008) {
          setError('Connection rejected - Policy violation')
        } else if (event.code === 1011) {
          setError('Server error occurred')
        } else if (!event.wasClean) {
          setError('Connection interrupted unexpectedly')
        }

        setCallStatus('disconnected')
        cleanup()
      }
    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start call')
      setCallStatus('idle')
      cleanup()
    }
  }

  const startAudioStream = async (stream: MediaStream) => {
    if (!audioContextRef.current) return

    const audioContext = audioContextRef.current
    const source = audioContext.createMediaStreamSource(stream)

    // Use ScriptProcessorNode for simplicity (deprecated but works)
    // In production, use AudioWorklet for better performance
    const processor = audioContext.createScriptProcessor(2048, 1, 1)
    processorRef.current = processor // Store in ref to prevent garbage collection

    processor.onaudioprocess = (e) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isMuted) return

      try {
        const inputData = e.inputBuffer.getChannelData(0)

        // Convert Float32 to Int16 PCM
        const pcm = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Send PCM data to WebSocket with error handling
        if (wsRef.current.bufferedAmount < 1024 * 1024) { // Don't overflow buffer
          wsRef.current.send(pcm.buffer)
        } else {
          console.warn('WebSocket send buffer full, dropping audio chunk')
        }
      } catch (error) {
        console.error('Error sending audio:', error)
        // Don't disconnect on individual send errors
      }
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
  }

  const playAudioChunk = async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.start()
    } catch (error) {
      console.error('Error playing audio chunk:', error)
      // Don't crash on audio decode errors, just skip the chunk
    }
  }

  const handleControlMessage = (message: any) => {
    console.log('Control message:', message)

    // Handle different message types
    if (message.type === 'transcript') {
      setTranscript(prev => [...prev, message.text])
    } else if (message.type === 'user_transcript') {
      setTranscript(prev => [...prev, `You: ${message.text}`])
    } else if (message.type === 'agent_response') {
      setTranscript(prev => [...prev, `${config.config.name}: ${message.text}`])
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const endCall = () => {
    cleanup()
    setCallStatus('idle')
    onEnd()
  }

  const reconnect = () => {
    cleanup()
    setError(null)
    startCall()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 border">
        <div className="text-center space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3">
            {callStatus === 'connecting' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-base font-medium">Connecting...</span>
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <div className="relative">
                  <Volume2 className="h-6 w-6 text-green-600" />
                  <div className="absolute -inset-1 bg-green-500/20 rounded-full animate-ping" />
                </div>
                <span className="text-base font-medium text-green-600">Call Active</span>
              </>
            )}
            {callStatus === 'idle' && (
              <span className="text-sm text-muted-foreground">Ready</span>
            )}
            {callStatus === 'disconnected' && (
              <span className="text-sm text-muted-foreground">Call ended</span>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Call Controls */}
          <div className="flex gap-2 pt-2">
            {callStatus === 'connected' && (
              <Button
                onClick={toggleMute}
                variant="outline"
                className="flex-1"
              >
                {isMuted ? (
                  <>
                    <MicOff className="h-5 w-5 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Mute
                  </>
                )}
              </Button>
            )}

            {callStatus === 'connected' ? (
              <Button
                onClick={endCall}
                variant="destructive"
                className="flex-1"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call
              </Button>
            ) : callStatus === 'connecting' ? (
              <Button disabled className="flex-1">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </Button>
            ) : callStatus === 'disconnected' ? (
              <>
                <Button onClick={reconnect} variant="default" className="flex-1">
                  <Phone className="h-5 w-5 mr-2" />
                  Reconnect
                </Button>
                <Button onClick={onEnd} variant="outline" className="flex-1">
                  Close
                </Button>
              </>
            ) : (
              <Button onClick={onEnd} variant="outline" className="w-full">
                Close
              </Button>
            )}
          </div>

          {/* Instructions */}
          {callStatus === 'connected' && (
            <p className="text-xs text-muted-foreground">
              Speak naturally. {config.config.name} is listening and will respond.
            </p>
          )}
        </div>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
          <h4 className="text-sm font-medium mb-2">Conversation</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            {transcript.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
