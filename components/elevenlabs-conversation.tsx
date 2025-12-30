'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Loader2, PhoneOff } from 'lucide-react'

type ConversationProps = {
  agentId: string
  onError?: (error: string) => void
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'disconnected') => void
}

export function ElevenLabsConversation({ agentId, onError, onStatusChange }: ConversationProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const onStatusChangeRef = useRef(onStatusChange)
  const isReadyRef = useRef(false)
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nextPlayTimeRef = useRef<number>(0) // Track when next audio chunk should play

  // Update the ref when the callback changes
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      disconnect()
    }
  }, [])

  useEffect(() => {
    // Use the ref to avoid infinite loops
    if (onStatusChangeRef.current) {
      onStatusChangeRef.current(status)
    }
  }, [status])

  const connect = async () => {
    try {
      setStatus('connecting')

      // Validate agent ID
      if (!agentId) {
        throw new Error('No agent ID provided')
      }

      console.log('Requesting signed URL for agent:', agentId)

      // Get signed URL from our backend
      const res = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to get signed URL: ${res.status}`)
      }

      const { signedUrl } = await res.json()
      console.log('Received signed URL, connecting to WebSocket...')

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })

      // Get mic access with better constraints
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      console.log('Microphone access granted')
      mediaStreamRef.current = stream

      // Log the actual audio settings
      const audioTrack = stream.getAudioTracks()[0]
      const settings = audioTrack.getSettings()
      console.log('Microphone settings:', settings)

      // Connect WebSocket
      const ws = new WebSocket(signedUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setStatus('connected')
        // Don't start audio immediately - wait for conversation_initiation_metadata

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
        try {
          // All messages from ElevenLabs should be JSON
          const message = JSON.parse(event.data)
          console.log('Received message type:', message.type, message)

          // Check if it's an audio chunk (multiple possible formats)
          if (message.type === 'audio' || message.audio_event) {
            console.log('Received audio chunk, full event:', message.audio_event)
            const audioData = message.audio_event?.audio_base_64 || message.audio_event?.audio || message.audio || message.data
            console.log('Audio data exists:', !!audioData, 'Length:', audioData?.length)
            if (audioData) {
              try {
                const binaryString = atob(audioData)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i)
                }
                console.log('Playing audio chunk, size:', bytes.length)
                await playAudioChunk(bytes.buffer)
              } catch (audioError) {
                console.error('Error decoding/playing audio:', audioError)
              }
            } else {
              console.warn('No audio data found in audio event')
            }
          } else {
            // Control message
            handleControlMessage(message)
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error, event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (onError) onError('WebSocket connection error')
        setStatus('disconnected')
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })

        // Provide user-friendly error messages based on close code
        if (event.code === 1006) {
          if (onError) onError('Connection lost - Please check your internet connection')
        } else if (event.code === 1008) {
          if (onError) onError('Connection rejected - Policy violation')
        } else if (event.code === 1011) {
          if (onError) onError('Server error occurred')
        } else if (!event.wasClean) {
          if (onError) onError('Connection interrupted unexpectedly')
        }

        setStatus('disconnected')
        cleanup()
      }
    } catch (error: any) {
      console.error('Connection error:', error)
      if (onError) onError(error.message)
      setStatus('idle')
      cleanup()
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    cleanup()
  }

  const cleanup = () => {
    isReadyRef.current = false
    setIsSpeaking(false)
    nextPlayTimeRef.current = 0 // Reset audio playback queue

    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current)
      speakingTimeoutRef.current = null
    }

    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current)
      keepaliveIntervalRef.current = null
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

  const startAudioStream = async (stream: MediaStream) => {
    if (!audioContextRef.current) return

    const audioContext = audioContextRef.current
    const source = audioContext.createMediaStreamSource(stream)

    // Use ScriptProcessorNode for simplicity (deprecated but works)
    // In production, use AudioWorklet for better performance
    const processor = audioContext.createScriptProcessor(2048, 1, 1)
    processorRef.current = processor // Store in ref to prevent garbage collection

    // Track if we've sent audio for debugging
    let audioChunksSent = 0

    processor.onaudioprocess = (e) => {
      // Only send audio when WebSocket is open, conversation is ready, and not muted
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isMuted || !isReadyRef.current) return

      try {
        const inputData = e.inputBuffer.getChannelData(0)

        // Check if there's actual audio (not silence)
        let hasAudio = false
        for (let i = 0; i < inputData.length; i++) {
          if (Math.abs(inputData[i]) > 0.01) {
            hasAudio = true
            break
          }
        }

        if (!hasAudio) return // Don't send silence

        // Show speaking indicator
        setIsSpeaking(true)
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current)
        }
        speakingTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(false)
        }, 500)

        // Convert Float32 to Int16 PCM
        const pcm = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Convert PCM to base64
        const bytes = new Uint8Array(pcm.buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64Audio = btoa(binary)

        // Send audio in ElevenLabs expected JSON format
        const message = JSON.stringify({
          user_audio_chunk: base64Audio
        })

        // Send with error handling
        if (wsRef.current.bufferedAmount < 1024 * 1024) { // Don't overflow buffer
          wsRef.current.send(message)
          audioChunksSent++
          if (audioChunksSent === 1) {
            console.log('Started sending audio to ElevenLabs')
          }
          if (audioChunksSent % 50 === 0) {
            console.log(`Sent ${audioChunksSent} audio chunks`)
          }
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
      const audioContext = audioContextRef.current

      // ElevenLabs sends raw PCM data, not encoded audio
      // Convert Int16 PCM to Float32 for Web Audio API
      const pcmData = new Int16Array(audioData)
      const floatData = new Float32Array(pcmData.length)

      for (let i = 0; i < pcmData.length; i++) {
        // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
        floatData[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF)
      }

      // Create AudioBuffer from the PCM data
      const audioBuffer = audioContext.createBuffer(
        1, // mono
        floatData.length,
        audioContext.sampleRate // Use the context's sample rate
      )

      // Copy the data to the buffer
      audioBuffer.getChannelData(0).set(floatData)

      // Schedule this chunk to play after the previous one
      const currentTime = audioContext.currentTime
      const scheduledTime = Math.max(currentTime, nextPlayTimeRef.current)

      // Play the buffer at the scheduled time
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.start(scheduledTime)

      // Update next play time to be after this chunk finishes
      nextPlayTimeRef.current = scheduledTime + audioBuffer.duration

      console.log('Scheduled audio chunk at', scheduledTime.toFixed(2), 's, duration:', audioBuffer.duration.toFixed(2), 's')
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const handleControlMessage = (message: any) => {
    console.log('Control message:', message)

    // Handle different message types
    if (message.type === 'conversation_initiation_metadata') {
      console.log('Conversation initialized, starting audio stream')
      isReadyRef.current = true
      // Now it's safe to start sending audio
      if (mediaStreamRef.current) {
        startAudioStream(mediaStreamRef.current)
      }
    } else if (message.type === 'ping') {
      // Respond to ping with pong
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const eventId = message.ping_event?.event_id
        if (eventId) {
          wsRef.current.send(JSON.stringify({
            type: 'pong',
            event_id: eventId
          }))
          console.log('Sent pong response to ping:', eventId)
        }
      }
    } else if (message.type === 'user_transcript' || message.type === 'transcript') {
      console.log('User transcript:', message)
      if (message.user_transcript_event) {
        setTranscript(prev => [...prev, `You: ${message.user_transcript_event.user_transcript}`])
      }
    } else if (message.type === 'agent_response' || message.type === 'agent_transcript') {
      console.log('Agent transcript:', message)
      if (message.agent_response_event) {
        setTranscript(prev => [...prev, `Agent: ${message.agent_response_event.agent_response}`])
      }
    } else if (message.type === 'pong') {
      console.log('Keepalive pong received')
    } else if (message.type === 'interruption') {
      console.log('User interrupted agent')
    }
    // Add more control message handlers as needed
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-center gap-4">
            {status === 'idle' && (
              <Button onClick={connect} size="lg" className="w-full">
                <Mic className="h-5 w-5 mr-2" />
                Start Conversation
              </Button>
            )}

            {status === 'connecting' && (
              <Button disabled size="lg" className="w-full">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </Button>
            )}

            {status === 'connected' && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? 'destructive' : 'default'}
                  size="lg"
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

                <Button onClick={disconnect} variant="destructive" size="lg" className="flex-1">
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </Button>
              </div>
            )}

            {status === 'disconnected' && (
              <Button onClick={connect} variant="outline" size="lg" className="w-full">
                Reconnect
              </Button>
            )}
          </div>

          {status === 'connected' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Connected - Speak naturally
              </div>
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Microphone active - Sending audio...
                </div>
              )}
            </div>
          )}

          {transcript.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto space-y-2 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground">Transcript:</p>
              {transcript.map((text, i) => (
                <p key={i} className="text-sm">{text}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
