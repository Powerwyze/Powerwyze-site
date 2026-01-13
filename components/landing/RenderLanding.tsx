'use client'

import { useRef, useEffect } from 'react'
import { LandingSpec } from '@/types/LandingSpec'
import AudioBall3D from '@/components/AudioBall3D'

type RenderLandingProps = {
  spec: LandingSpec
  agentName: string
  organizationName?: string
  venueName?: string
  onTalkClick?: () => void
  onScanAnotherClick?: () => void
  isPreview?: boolean
  backgroundImage?: string
  isConversationActive?: boolean
  audioLevel?: number
  isMicMuted?: boolean
  onToggleMute?: () => void
}

export default function RenderLanding({
  spec,
  agentName,
  organizationName,
  venueName,
  onTalkClick,
  onScanAnotherClick,
  isPreview = false,
  backgroundImage,
  isConversationActive = false,
  audioLevel = 0,
  isMicMuted = true,
  onToggleMute,
}: RenderLandingProps) {
  const theme = {
    primary: spec.theme?.primary ?? '#111827',
    bg: spec.theme?.background ?? '#FFFFFF',
    text: spec.theme?.text ?? '#FFFFFF',
  }

  const talkLabel = spec.buttons?.talkLabel ?? `Talk with ${agentName}`
  const scanAnotherLabel = spec.buttons?.scanAnotherLabel ?? 'Scan another QR'

  const backgroundMode = spec.background?.mode
  const resolvedBackgroundImage =
    backgroundMode === 'black'
      ? undefined
      : (spec.background?.imageUrl ?? backgroundImage)

  // Refs for animated blocks (currently not used in mobile-first design)
  const blockRefsArray = useRef<(HTMLElement | null)[]>([])

  // Initialize GSAP timeline (only if blocks exist and animations are enabled)
  useEffect(() => {
    // Skip GSAP animations for the mobile-first landing page design
    // Animations are not needed since blocks are not displayed
    return
  }, [spec])

  // Update refs array when blocks change
  useEffect(() => {
    if (spec.blocks) {
      blockRefsArray.current = blockRefsArray.current.slice(0, spec.blocks.length)
    }
  }, [spec.blocks])

  console.log('RenderLanding spec:', spec)

  return (
    <div
      className={isPreview ? 'flex flex-col h-full relative overflow-hidden' : 'h-dvh flex flex-col relative overflow-hidden'}
      style={{
        backgroundColor: backgroundMode === 'black' ? '#05060B' : theme.bg,
        color: theme.text,
      }}
    >
      {/* Background Image with Overlay */}
      {resolvedBackgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${resolvedBackgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Content - Fixed to screen, no scroll */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Organization & Agent Name */}
        <div className="pt-6 px-4 text-center space-y-1">
          {organizationName && (
            <p className="text-sm md:text-base text-white/80 font-medium tracking-wide uppercase drop-shadow-lg">
              {organizationName}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {agentName}
          </h1>
          {venueName && (
            <p className="text-xs md:text-sm text-white/70 drop-shadow-lg">
              {venueName}
            </p>
          )}
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          {/* Hero Image in Center with Round Corners */}
          {spec.hero?.imageUrl && (
            <div className="relative w-full max-w-sm mb-0">
              <img
                src={spec.hero.imageUrl}
                alt={spec.title}
                className="w-full h-auto object-contain rounded-3xl shadow-2xl"
                style={{ maxHeight: '40vh' }}
              />

              {/* Talk Button Overlapping Bottom of Image */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full px-6 z-30">
                <button
                  type="button"
                  className="w-full px-8 py-4 rounded-2xl text-black text-xl font-bold shadow-2xl hover:shadow-xl transition-all hover:scale-105 border-4 border-black cursor-pointer"
                  style={{ backgroundColor: '#3B82F6' }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Talk button clicked!')
                    onTalkClick?.()
                  }}
                >
                  {talkLabel}
                </button>
              </div>
            </div>
          )}

          {/* If no hero image, show button normally */}
          {!spec.hero?.imageUrl && (
            <button
              type="button"
              className="px-8 py-4 rounded-2xl text-black text-xl font-bold shadow-2xl hover:shadow-xl transition-all hover:scale-105 border-4 border-black cursor-pointer z-30 relative"
              style={{ backgroundColor: '#3B82F6' }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Talk button clicked (no hero)!')
                onTalkClick?.()
              }}
            >
              {talkLabel}
            </button>
          )}
        </div>

        {/* 3D Audio Ball Visualizer - Fixed at Bottom */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center">
          <AudioBall3D
            isActive={isConversationActive}
            audioLevel={audioLevel}
            color="#3B82F6"
            size={120}
          />
        </div>

        {/* Microphone Mute/Unmute Button - Shows when conversation is active */}
        {isConversationActive && onToggleMute && (
          <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleMute()
              }}
              className={`px-6 py-3 rounded-full font-bold text-white shadow-2xl hover:shadow-xl transition-all hover:scale-105 border-4 ${
                isMicMuted
                  ? 'bg-red-500 border-red-700 animate-pulse'
                  : 'bg-green-500 border-green-700'
              }`}
            >
              {isMicMuted ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  Click to Unmute
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Listening...
                </span>
              )}
            </button>
          </div>
        )}

        {/* Footer - Scan Another */}
        {!isPreview && (
          <div className="pb-6 px-4 relative z-30">
            <button
              className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 font-medium text-white hover:bg-white/30 transition-all"
              onClick={onScanAnotherClick}
            >
              {scanAnotherLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
