'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mic, MicOff, Volume2, MessageSquare, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ElevenLabsConversation } from '@/components/elevenlabs-conversation'

type LogEntry = {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function ExhibitTestPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Agent/Exhibit data
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [apiStatus, setApiStatus] = useState({
    elevenlabs: 'unknown',
    openai: 'unknown',
    database: 'unknown'
  })
  const [testText, setTestText] = useState('Hello! This is a test of the voice synthesis system.')

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Add log entry
  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }
    setLogs(prev => [...prev, entry])
    console.log(`[${entry.timestamp}] ${type.toUpperCase()}: ${message}`, details || '')
  }

  // Load exhibit data
  useEffect(() => {
    loadExhibit()
  }, [params.id])

  // Test APIs when agent loads
  useEffect(() => {
    if (agent) {
      testAPIKeys()
    }
  }, [agent])

  const loadExhibit = async () => {
    addLog('info', 'Loading exhibit data...', { exhibitId: params.id })

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*, venues(display_name), organizations(name)')
        .eq('id', params.id)
        .single()

      if (error) {
        addLog('error', 'Failed to load exhibit', error.message)
        setApiStatus(prev => ({ ...prev, database: 'error' }))
        setLoading(false)
        return
      }

      if (data) {
        // Load Tier 3 capabilities if applicable
        if (data.tier === 3) {
          const { data: capabilities } = await supabase
            .from('agent_capabilities')
            .select('*')
            .eq('agent_id', params.id)
            .single()

          if (capabilities) {
            data.capabilities = capabilities
            addLog('info', 'Loaded Tier 3 capabilities', {
              canSendEmail: capabilities.can_send_email,
              canSendSms: capabilities.can_send_sms,
              canTakeOrders: capabilities.can_take_orders,
              canPostSocial: capabilities.can_post_social
            })
          }
        }

        setAgent(data)
        setApiStatus(prev => ({ ...prev, database: 'connected' }))
        addLog('success', 'Exhibit loaded successfully', {
          name: data.name,
          voiceId: data.voice,
          voiceName: data.voice_name,
          status: data.status,
          tier: data.tier,
          hasPersona: !!data.persona,
          hasBio: !!data.bio,
          factsCount: data.important_facts?.length || 0,
          hasElevenLabsAgent: !!data.elevenlabs_agent_id,
          elevenLabsAgentId: data.elevenlabs_agent_id || 'Not synced'
        })
      }
    } catch (error: any) {
      addLog('error', 'Database connection failed', error.message)
      setApiStatus(prev => ({ ...prev, database: 'error' }))
    }

    setLoading(false)
  }

  const testAPIKeys = async () => {
    addLog('info', 'Testing API connectivity...')

    // Test OpenAI
    try {
      addLog('info', 'Testing OpenAI API...')
      const openAIRes = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      })

      if (openAIRes.ok) {
        setApiStatus(prev => ({ ...prev, openai: 'connected' }))
        addLog('success', 'OpenAI API connected successfully')
      } else {
        const error = await openAIRes.text()
        setApiStatus(prev => ({ ...prev, openai: 'error' }))
        addLog('error', 'OpenAI API connection failed', error)
      }
    } catch (error: any) {
      setApiStatus(prev => ({ ...prev, openai: 'error' }))
      addLog('error', 'OpenAI API test failed', error.message)
    }

    // Test ElevenLabs
    try {
      addLog('info', 'Testing ElevenLabs API...')
      const voiceId = agent?.voice || '21m00Tcm4TlvDq8ikWAM'
      const elevenlabsRes = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voiceId,
          text: 'test'
        })
      })

      if (elevenlabsRes.ok) {
        setApiStatus(prev => ({ ...prev, elevenlabs: 'connected' }))
        addLog('success', 'ElevenLabs API connected successfully')
      } else {
        const error = await elevenlabsRes.text()
        setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }))
        addLog('error', 'ElevenLabs API connection failed', error)
      }
    } catch (error: any) {
      setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }))
      addLog('error', 'ElevenLabs API test failed', error.message)
    }
  }

  const speakText = async (text: string) => {
    try {
      setIsPlaying(true)
      const voiceId = agent?.voice || '21m00Tcm4TlvDq8ikWAM'

      // Use agent's configured voice settings or defaults
      const voiceSettings = agent?.voice_settings || {
        stability: 0.55,
        similarity_boost: 0.65,
        style: 0.25,
        use_speaker_boost: true
      }

      addLog('info', 'Starting text-to-speech synthesis...', {
        text,
        voiceId,
        voiceName: agent?.voice_name || 'Default',
        settings: voiceSettings
      })

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 })
        addLog('info', 'Audio context initialized')
      }

      // Get TTS audio from ElevenLabs
      addLog('info', 'Requesting audio from ElevenLabs...')
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voiceId,
          text: text,
          settings: voiceSettings
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        addLog('error', 'ElevenLabs API request failed', { status: res.status, error: errorText })
        setIsPlaying(false)
        return
      }

      addLog('success', 'Audio data received from ElevenLabs')
      const audioData = await res.arrayBuffer()
      addLog('info', `Audio buffer size: ${audioData.byteLength} bytes`)

      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)
      addLog('success', `Audio decoded successfully - Duration: ${audioBuffer.duration.toFixed(2)}s`)

      // Play audio
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.onended = () => {
        addLog('success', 'Audio playback completed')
        setIsPlaying(false)
      }
      source.start()
      addLog('info', 'Audio playback started')
    } catch (error: any) {
      addLog('error', 'Error during speech synthesis', error.message)
      setIsPlaying(false)
    }
  }

  const testVoice = async () => {
    addLog('info', '=== Starting voice test ===')
    await speakText(testText)
  }

  const clearLogs = () => {
    setLogs([])
    addLog('info', 'Logs cleared')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Exhibit not found</p>
              <Button onClick={() => router.push('/exhibits')} className="mt-4 mx-auto block">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Exhibits
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push(`/exhibits/${params.id}`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold">Test: {agent.name}</h1>
                <p className="text-muted-foreground">Test your voice agent with full debugging</p>
              </div>
            </div>
          </div>
          <Badge variant={agent.status === 'published' ? 'default' : 'secondary'}>
            {agent.status}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  System Status
                </CardTitle>
                <CardDescription>Real-time connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Database</span>
                  {getStatusBadge(apiStatus.database)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">OpenAI</span>
                  {getStatusBadge(apiStatus.openai)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ElevenLabs</span>
                  {getStatusBadge(apiStatus.elevenlabs)}
                </div>
                <Button onClick={testAPIKeys} variant="outline" className="w-full" size="sm">
                  <Loader2 className="h-4 w-4 mr-2" />
                  Retest APIs
                </Button>
              </CardContent>
            </Card>

            {/* Exhibit Info */}
            <Card>
              <CardHeader>
                <CardTitle>Exhibit Configuration</CardTitle>
                <CardDescription>Current agent settings being used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Voice</label>
                  <p className="text-sm">{agent.voice_name || 'Default'}</p>
                  <p className="text-xs font-mono text-muted-foreground">{agent.voice || '21m00Tcm4TlvDq8ikWAM'}</p>
                </div>

                {agent.voice_settings && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Voice Settings</label>
                    <div className="text-xs space-y-1 mt-1">
                      <p>Stability: {agent.voice_settings.stability}</p>
                      <p>Similarity: {agent.voice_settings.similarity_boost}</p>
                      <p>Style: {agent.voice_settings.style}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Venue</label>
                  <p className="text-sm">{agent.venues?.display_name || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tier</label>
                  <p className="text-sm">Tier {agent.tier}</p>
                </div>

                {agent.bio && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Bio</label>
                    <p className="text-sm">{agent.bio}</p>
                  </div>
                )}

                {agent.persona && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Persona</label>
                    <p className="text-sm line-clamp-3">{agent.persona}</p>
                  </div>
                )}

                {agent.important_facts && agent.important_facts.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Important Facts ({agent.important_facts.length})</label>
                    <ul className="text-xs space-y-1 mt-1 list-disc list-inside">
                      {agent.important_facts.slice(0, 3).map((fact: string, i: number) => (
                        <li key={i} className="line-clamp-1">{fact}</li>
                      ))}
                      {agent.important_facts.length > 3 && (
                        <li className="text-muted-foreground">+ {agent.important_facts.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {agent.do_nots && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Topics to Avoid</label>
                    <p className="text-xs line-clamp-2">{agent.do_nots}</p>
                  </div>
                )}

                {agent.end_script && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">End Script</label>
                    <p className="text-xs italic">"{agent.end_script}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tier 3 Capabilities */}
            {agent.tier === 3 && agent.capabilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Tier 3 Capabilities</CardTitle>
                  <CardDescription>Advanced agent functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Send Email</span>
                    <Badge variant={agent.capabilities.can_send_email ? 'default' : 'secondary'}>
                      {agent.capabilities.can_send_email ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Send SMS</span>
                    <Badge variant={agent.capabilities.can_send_sms ? 'default' : 'secondary'}>
                      {agent.capabilities.can_send_sms ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Take Orders</span>
                    <Badge variant={agent.capabilities.can_take_orders ? 'default' : 'secondary'}>
                      {agent.capabilities.can_take_orders ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Post to Social</span>
                    <Badge variant={agent.capabilities.can_post_social ? 'default' : 'secondary'}>
                      {agent.capabilities.can_post_social ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {agent.capabilities.function_manifest && Object.keys(agent.capabilities.function_manifest).length > 0 && (
                    <div className="pt-2 mt-2 border-t">
                      <label className="text-xs font-medium text-muted-foreground">Function Manifest</label>
                      <pre className="text-xs bg-slate-950 text-slate-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(agent.capabilities.function_manifest, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Voice Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Test</CardTitle>
                <CardDescription>Test the text-to-speech synthesis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Text</label>
                  <Input
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Enter text to test"
                  />
                </div>

                <Button onClick={testVoice} disabled={isPlaying} className="w-full">
                  <Volume2 className="h-4 w-4 mr-2" />
                  {isPlaying ? 'Playing...' : 'Test Voice'}
                </Button>
              </CardContent>
            </Card>

            {/* Voice Conversation */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Conversation</CardTitle>
                <CardDescription>
                  Real-time conversation using ElevenLabs Conversational AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agent?.elevenlabs_agent_id ? (
                  <ElevenLabsConversation
                    agentId={agent.elevenlabs_agent_id}
                    onError={(error) => addLog('error', 'Conversation error', error)}
                    onStatusChange={(status) => addLog('info', `Conversation status: ${status}`)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        This agent hasn't been synced to ElevenLabs Conversational AI yet.
                      </p>
                      <p className="text-xs text-yellow-600 mt-2">
                        Publish the agent to create an ElevenLabs Conversational AI agent, or sync manually below.
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        addLog('info', 'Syncing agent to ElevenLabs...')
                        try {
                          const res = await fetch('/api/agents/sync-elevenlabs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ agentId: params.id })
                          })
                          const data = await res.json()
                          if (data.success) {
                            addLog('success', 'Agent synced to ElevenLabs successfully!', {
                              elevenLabsAgentId: data.elevenLabsAgentId
                            })
                            // Reload agent to show conversation interface
                            await loadExhibit()
                          } else {
                            addLog('error', 'Failed to sync agent', data.error)
                          }
                        } catch (error: any) {
                          addLog('error', 'Sync failed', error.message)
                        }
                      }}
                      className="w-full"
                    >
                      Sync to ElevenLabs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Debug Logs */}
          <div className="space-y-6">
            <Card className="h-[800px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Debug Console</CardTitle>
                    <CardDescription>Real-time system logs and debugging</CardDescription>
                  </div>
                  <Button onClick={clearLogs} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="h-full overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-50 p-4 font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="text-slate-400">No logs yet. Start testing to see debug output...</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-slate-500 flex-shrink-0 whitespace-nowrap">[{log.timestamp}]</span>
                          {getLogIcon(log.type)}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className={`break-words ${
                              log.type === 'error' ? 'text-red-400' :
                              log.type === 'success' ? 'text-green-400' :
                              log.type === 'warning' ? 'text-yellow-400' :
                              'text-slate-300'
                            }`}>
                              {log.message}
                            </p>
                            {log.details && (
                              <pre className="text-slate-500 mt-1 text-xs whitespace-pre-wrap break-words overflow-hidden">
                                {typeof log.details === 'string'
                                  ? log.details
                                  : JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
