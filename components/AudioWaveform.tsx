'use client'

import { useEffect, useRef } from 'react'

interface AudioWaveformProps {
  isActive?: boolean
  color?: string
  barCount?: number
  className?: string
}

export default function AudioWaveform({
  isActive = false,
  color = '#3B82F6',
  barCount = 40,
  className = '',
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const barsRef = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize bars array with random heights
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1)
    }

    const bars = barsRef.current

    const animate = () => {
      if (!canvas || !ctx) return

      const width = canvas.width
      const height = canvas.height
      const barWidth = width / barCount
      const gap = 2

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        if (isActive) {
          // Active: animate bars with smooth wave motion
          const targetHeight = Math.random() * 0.7 + 0.3
          bars[i] += (targetHeight - bars[i]) * 0.15
        } else {
          // Inactive: slowly return to minimal height
          bars[i] += (0.15 - bars[i]) * 0.05
        }

        const barHeight = bars[i] * height
        const x = i * barWidth
        const y = (height - barHeight) / 2

        // Draw bar with rounded corners
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, barWidth / 4)
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Set canvas size
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    animate()

    return () => {
      window.removeEventListener('resize', updateSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, color, barCount])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: '80px' }}
    />
  )
}
