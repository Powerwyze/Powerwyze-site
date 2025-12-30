'use client'

import { LandingSpec } from '@/types/LandingSpec'

type RenderLandingProps = {
  spec: LandingSpec
  agentName: string
  onTalkClick?: () => void
  onScanAnotherClick?: () => void
  isPreview?: boolean
}

export default function RenderLanding({
  spec,
  agentName,
  onTalkClick,
  onScanAnotherClick,
  isPreview = false,
}: RenderLandingProps) {
  const theme = {
    primary: spec.theme?.primary ?? '#111827',
    bg: spec.theme?.background ?? '#FFFFFF',
    text: spec.theme?.text ?? '#111827',
  }

  const talkLabel = spec.buttons?.talkLabel ?? `Talk with ${agentName}`
  const scanAnotherLabel = spec.buttons?.scanAnotherLabel ?? 'Scan another QR'

  console.log('RenderLanding spec:', spec)

  return (
    <div
      style={{ backgroundColor: theme.bg, color: theme.text }}
      className={isPreview ? 'flex flex-col' : 'min-h-dvh flex flex-col'}
    >
      {/* Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8" style={{ color: theme.text }}>
          {spec.title}
        </h1>

        {/* Image in the middle */}
        {spec.hero?.imageUrl && (
          <div className="relative w-full max-w-md mb-8 overflow-hidden rounded-2xl shadow-xl">
            <img
              src={spec.hero.imageUrl}
              alt={spec.title}
              className="w-full h-auto aspect-video object-cover"
            />
          </div>
        )}

        {/* Simple "Talk with" line */}
        <p className="text-2xl md:text-3xl font-medium mb-8" style={{ color: theme.text }}>
          Talk with {agentName}
        </p>

        {/* Big Talk Button */}
        <button
          className="px-8 py-4 rounded-2xl text-white text-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: theme.primary }}
          onClick={onTalkClick}
        >
          Start Conversation
        </button>
      </div>

      {/* Footer - Scan Another */}
      {!isPreview && (
        <div className="p-4">
          <button
            className="w-full px-4 py-3 rounded-xl border-2 font-medium"
            style={{ borderColor: theme.primary, color: theme.primary }}
            onClick={onScanAnotherClick}
          >
            {scanAnotherLabel}
          </button>
        </div>
      )}
    </div>
  )
}
