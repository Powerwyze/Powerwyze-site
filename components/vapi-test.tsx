'use client'

import { useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import { Button } from './ui/button'
import { Phone, PhoneOff, Loader2 } from 'lucide-react'

interface VapiTestProps {
  agentConfig: {
    voice: string
    personality: string
    systemPrompt: string
    firstMessage?: string
    name: string
  }
  tier?: number
  vapiAssistantId?: string
}

export function VapiTest({ agentConfig, tier = 1, vapiAssistantId }: VapiTestProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [error, setError] = useState<string | null>(null)
  const vapiRef = useRef<Vapi | null>(null)

  useEffect(() => {
    // Initialize Vapi instance
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPI_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY

    if (!publicKey) {
      setError('Vapi public key not configured')
      return
    }

    vapiRef.current = new Vapi(publicKey)

    // Set up event listeners
    vapiRef.current.on('call-start', () => {
      console.log('Call started')
      setCallStatus('connected')
      setError(null)
    })

    vapiRef.current.on('call-end', () => {
      console.log('Call ended')
      setCallStatus('disconnected')
    })

    vapiRef.current.on('error', (error: any) => {
      console.error('Vapi error:', error)
      setError(error.message || 'Call failed')
      setCallStatus('idle')
    })

    vapiRef.current.on('speech-start', () => {
      console.log('User started speaking')
    })

    vapiRef.current.on('speech-end', () => {
      console.log('User stopped speaking')
    })

    vapiRef.current.on('message', (message: any) => {
      console.log('Message:', message)
    })

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  const startCall = async () => {
    if (!vapiRef.current) return

    setCallStatus('connecting')
    setError(null)

    try {
      // Use assistant ID if available (preferred method)
      if (vapiAssistantId) {
        await vapiRef.current.start(vapiAssistantId)
      } else {
        // Fallback: build assistant config inline
        const assistant: any = {
          name: agentConfig.name,
          firstMessage: agentConfig.firstMessage || `Hello! I'm ${agentConfig.name}. How can I help you today?`,
        }

        // Model configuration based on tier
        if (tier === 1) {
          // Tier 1: GPT-3.5 Turbo
          assistant.model = {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: agentConfig.systemPrompt || agentConfig.personality || 'You are a helpful assistant.'
              }
            ]
          }
          assistant.voice = {
            provider: '11labs',
            voiceId: '21m00Tcm4TlvDq8ikWAM' // 11Labs Rachel voice
          }
          assistant.transcriber = {
            provider: 'deepgram' as const,
            model: 'nova-2',
            language: 'en-US'
          }
        } else if (tier === 2 || tier === 3) {
          // Tier 2 & 3: GPT-4o Realtime
          assistant.model = {
            provider: 'openai',
            model: 'gpt-4o-realtime-preview',
            messages: [
              {
                role: 'system',
                content: agentConfig.systemPrompt || agentConfig.personality || 'You are a helpful assistant.'
              }
            ]
          }
          // No separate voice/transcriber needed for realtime model
        }

        await vapiRef.current.start(assistant)
      }
    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start call')
      setCallStatus('idle')
    }
  }

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
      setCallStatus('idle')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {callStatus === 'connecting' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Connecting...</span>
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-600">Call in progress</span>
              </>
            )}
            {callStatus === 'idle' && (
              <span className="text-sm text-muted-foreground">Ready to test</span>
            )}
            {callStatus === 'disconnected' && (
              <span className="text-sm text-muted-foreground">Call ended</span>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="pt-2">
            {callStatus === 'idle' || callStatus === 'disconnected' ? (
              <Button
                onClick={startCall}
                size="lg"
                className="w-full"
              >
                <Phone className="h-5 w-5 mr-2" />
                Start Test Call
              </Button>
            ) : (
              <Button
                onClick={endCall}
                size="lg"
                variant="destructive"
                className="w-full"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Click the button to start a voice conversation with your agent
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium">Test Configuration</h4>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p><strong>Tier:</strong> {tier} ({tier === 1 ? 'GPT-3.5 Turbo' : 'GPT-4o Realtime'})</p>
          <p><strong>Voice:</strong> {agentConfig.voice}</p>
          <p><strong>Personality:</strong> {agentConfig.personality?.substring(0, 100)}...</p>
        </div>
      </div>
    </div>
  )
}
