'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Conversation } from '@elevenlabs/client'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff } from 'lucide-react'

type ConversationProps = {
  agentId: string
  onError?: (error: string) => void
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'disconnected') => void
  onAudioLevel?: (level: number) => void
  onMuteChange?: (isMuted: boolean) => void
  autoStart?: boolean
}

export function ElevenLabsConversation({ agentId, onError, onStatusChange, onAudioLevel, onMuteChange, autoStart = false }: ConversationProps) {
  const [transcript, setTranscript] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(true) // Start muted by default
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const conversationRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()

  // Auto-start if requested
  const hasAutoStartedRef = useRef(false)

  useEffect(() => {
    if (autoStart && status === 'idle' && !hasAutoStartedRef.current) {
      console.log('Auto-starting conversation...')
      hasAutoStartedRef.current = true
      startConversation()
    }
  }, [autoStart, status])

  // Audio analysis loop
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || status !== 'connected') {
      return
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate average audio level (0-1)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255

    onAudioLevel?.(average)

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [status, onAudioLevel])

  // Start audio analysis when connected
  useEffect(() => {
    if (status === 'connected' && !analyserRef.current) {
      try {
        // Create audio context and analyser
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Connect to audio destination (speaker output)
        const destination = audioContext.createMediaStreamDestination()
        analyser.connect(audioContext.destination)

        console.log('Audio analysis started')
        analyzeAudio()
      } catch (error) {
        console.error('Failed to setup audio analysis:', error)
      }
    } else if (status === 'disconnected' && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      analyserRef.current = null
      audioContextRef.current?.close()
      audioContextRef.current = null
      onAudioLevel?.(0)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [status, analyzeAudio])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startConversation = useCallback(async () => {
    try {
      setStatus('connecting')
      onStatusChange?.('connecting')
      setTranscript([])

      // Request microphone permission
      console.log('Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone permission granted, stream:', stream.id)

      // Close the stream - SDK will handle its own
      stream.getTracks().forEach(track => track.stop())

      // Start conversation directly with agentId (public agent)
      console.log('Starting ElevenLabs session with agentId:', agentId)
      
      const conversation = await Conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
        onConnect: () => {
          console.log('✓ ElevenLabs SDK: Connected!')
          setStatus('connected')
          onStatusChange?.('connected')
          // Start muted by default
          if (conversationRef.current) {
            conversationRef.current.setInputMuted?.(true)
          }
          setIsMuted(true)
          onMuteChange?.(true)
        },
        onDisconnect: () => {
          console.log('✓ ElevenLabs SDK: Disconnected')
          setStatus('disconnected')
          onStatusChange?.('disconnected')
          conversationRef.current = null
        },
        onMessage: (message: any) => {
          console.log('ElevenLabs SDK Message:', message)
          if (message.source === 'user') {
            setTranscript(prev => [...prev, `You: ${message.message}`])
          } else if (message.source === 'ai') {
            setTranscript(prev => [...prev, `Agent: ${message.message}`])
          }
        },
        onError: (error: any) => {
          console.error('ElevenLabs SDK Error:', error)
          const errorMsg = typeof error === 'string' ? error : error?.message || 'Unknown error'
          onError?.(errorMsg)
          setStatus('idle')
          onStatusChange?.('idle')
        },
        onModeChange: (mode: any) => {
          console.log('ElevenLabs SDK Mode change:', mode)
          setIsSpeaking(mode?.mode === 'speaking')
        },
      })

      conversationRef.current = conversation
      console.log('✓ Conversation session created, ID:', conversation.getId?.())
    } catch (error: any) {
      console.error('Failed to start conversation:', error)
      onError?.(error.message || 'Failed to start conversation')
      setStatus('idle')
      onStatusChange?.('idle')
    }
  }, [agentId, onError, onStatusChange])

  const stopConversation = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession()
        conversationRef.current = null
      }
      setStatus('disconnected')
      onStatusChange?.('disconnected')
    } catch (error: any) {
      console.error('Failed to stop conversation:', error)
    }
  }, [onStatusChange])

  const toggleMute = useCallback(() => {
    if (conversationRef.current) {
      const newMutedState = !isMuted
      conversationRef.current.setInputMuted?.(newMutedState)
      setIsMuted(newMutedState)
      onMuteChange?.(newMutedState)
      console.log(`Microphone ${newMutedState ? 'muted' : 'unmuted'}`)
    }
  }, [isMuted, onMuteChange])

  // Expose toggleMute function
  useEffect(() => {
    if (onMuteChange) {
      (window as any).__elevenLabsToggleMute = toggleMute
    }
    return () => {
      delete (window as any).__elevenLabsToggleMute
    }
  }, [toggleMute, onMuteChange])

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <div className="space-y-4">
      {/* Connection Controls */}
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={stopConversation}
              variant="destructive"
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Conversation
            </Button>
            <Button
              onClick={toggleMute}
              variant="outline"
              size="icon"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 
          isConnecting ? 'bg-yellow-500 animate-pulse' : 
          'bg-gray-400'
        }`} />
        <span className="text-muted-foreground">
          {isConnected ? 'Connected - Speak now' : 
           isConnecting ? 'Connecting...' : 
           'Not connected'}
        </span>
        {isConnected && isSpeaking && (
          <div className="flex items-center gap-1 text-blue-500">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Agent speaking...</span>
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-muted/50">
          <div className="text-xs font-medium mb-2 text-muted-foreground">Transcript</div>
          <div className="space-y-1 text-sm">
            {transcript.map((line, i) => (
              <p key={i} className={line.startsWith('You:') ? 'text-blue-600' : 'text-green-600'}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Agent ID: {agentId}
      </div>
    </div>
  )
}
