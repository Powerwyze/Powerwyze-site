'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Play, Pause, Loader2, Search } from 'lucide-react'

interface Voice {
  id: string
  name: string
  previewUrl?: string
  category: string
  description?: string
  labels?: Record<string, string>
  settings: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

interface ElevenLabsVoicePickerProps {
  selectedVoiceId: string
  onVoiceSelect: (voiceId: string, voiceName: string, settings: any) => void
}

export function ElevenLabsVoicePicker({ selectedVoiceId, onVoiceSelect }: ElevenLabsVoicePickerProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/voices/elevenlabs')
      const data = await response.json()

      if (data.success) {
        setVoices(data.voices)
      } else {
        console.error('Failed to fetch voices:', data.error)
      }
    } catch (error) {
      console.error('Error fetching voices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPreview = async (voice: Voice) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingVoiceId === voice.id) {
      setPlayingVoiceId(null)
      return
    }

    // If preview URL exists, use it
    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl)
      audio.play()
      audioRef.current = audio
      setPlayingVoiceId(voice.id)

      audio.onended = () => {
        setPlayingVoiceId(null)
        audioRef.current = null
      }
    }
  }

  const handleVoiceSelect = (voice: Voice) => {
    onVoiceSelect(voice.id, voice.name, voice.settings)
  }

  const filteredVoices = voices.filter(voice =>
    voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredVoices.map((voice) => (
          <Card
            key={voice.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedVoiceId === voice.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => handleVoiceSelect(voice)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{voice.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {voice.category}
                    </Badge>
                    {voice.labels?.gender && (
                      <Badge variant="outline" className="text-xs">
                        {voice.labels.gender}
                      </Badge>
                    )}
                  </div>
                  {voice.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {voice.description}
                    </p>
                  )}
                </div>

                {voice.previewUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayPreview(voice)
                    }}
                  >
                    {playingVoiceId === voice.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {selectedVoiceId === voice.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Stability:</span>
                      <span className="ml-1 font-medium">{voice.settings.stability}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Similarity:</span>
                      <span className="ml-1 font-medium">{voice.settings.similarity_boost}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No voices found matching "{searchTerm}"
        </p>
      )}
    </div>
  )
}
