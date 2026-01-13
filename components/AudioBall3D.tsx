'use client'

import { useEffect, useRef, useState } from 'react'

interface AudioBall3DProps {
  isActive?: boolean
  audioLevel?: number // 0-1 representing audio intensity
  color?: string
  size?: number
  className?: string
}

export default function AudioBall3D({
  isActive = false,
  audioLevel = 0,
  color = '#3B82F6',
  size = 120,
  className = '',
}: AudioBall3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Array<{ angle: number; radius: number; speed: number; size: number }>>([])
  const pulseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const displaySize = size * 2.5

    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 30 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 40 + 10,
        speed: Math.random() * 0.02 + 0.01,
        size: Math.random() * 3 + 1,
      }))
    }

    const particles = particlesRef.current

    const animate = () => {
      if (!canvas || !ctx) return

      const width = displaySize
      const height = displaySize
      const centerX = width / 2
      const centerY = height / 2

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Update pulse
      pulseRef.current += 0.08

      // Calculate pulse size based on audio level
      const basePulse = isActive && audioLevel > 0 ? audioLevel * 30 : 5
      const pulse = Math.sin(pulseRef.current) * basePulse + audioLevel * 10

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        size / 2 + 40 + pulse
      )
      glowGradient.addColorStop(0, `${color}40`)
      glowGradient.addColorStop(0.5, `${color}20`)
      glowGradient.addColorStop(1, `${color}00`)
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, width, height)

      // Draw main sphere with 3D gradient
      const sphereGradient = ctx.createRadialGradient(
        centerX - size / 6,
        centerY - size / 6,
        0,
        centerX,
        centerY,
        size / 2 + pulse
      )
      sphereGradient.addColorStop(0, '#FFFFFF')
      sphereGradient.addColorStop(0.3, color)
      sphereGradient.addColorStop(0.7, color)
      sphereGradient.addColorStop(1, '#000030')

      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 2 + pulse, 0, Math.PI * 2)
      ctx.fillStyle = sphereGradient
      ctx.fill()

      // Draw particles orbiting the sphere (more active with audio)
      if (isActive && audioLevel > 0.05) {
        particles.forEach((particle) => {
          // Speed up particles based on audio level
          particle.angle += particle.speed * (1 + audioLevel * 2)

          const x = centerX + Math.cos(particle.angle) * (particle.radius + audioLevel * 20)
          const y = centerY + Math.sin(particle.angle) * (particle.radius + audioLevel * 20)

          const particleSize = particle.size * (1 + audioLevel * 2)
          ctx.beginPath()
          ctx.arc(x, y, particleSize, 0, Math.PI * 2)
          ctx.fillStyle = `${color}${Math.floor((0.5 + audioLevel * 0.5) * 255).toString(16).padStart(2, '0')}`
          ctx.fill()
        })
      }

      // Draw rotating energy rings when active (speed based on audio)
      if (isActive && audioLevel > 0.05) {
        ctx.save()
        ctx.translate(centerX, centerY)

        for (let i = 0; i < 2; i++) {
          ctx.rotate((pulseRef.current * (i + 1) * (1 + audioLevel)) / 10)
          const ringOpacity = Math.floor((0.25 + audioLevel * 0.5) * 255).toString(16).padStart(2, '0')
          ctx.strokeStyle = `${color}${ringOpacity}`
          ctx.lineWidth = 2 + audioLevel * 3
          ctx.beginPath()
          ctx.ellipse(0, 0, size / 2 + 20 + i * 10, size / 4 + i * 5, 0, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Set canvas size
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = displaySize * dpr
      canvas.height = displaySize * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      canvas.style.width = `${displaySize}px`
      canvas.style.height = `${displaySize}px`
    }

    updateSize()
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, audioLevel, color, size])

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  )
}
