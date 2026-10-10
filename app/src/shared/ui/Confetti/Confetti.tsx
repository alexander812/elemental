import { useEffect, useRef } from 'react'

import classes from './Confetti.module.pcss'

const COLORS = ['#f14f5d', '#ffcc4a', '#4763f0', '#00b97a', '#53c2ff', '#ff8ad4']
const GRAVITY = 0.08

type Piece = {
  color: string
  rotation: number
  rotationSpeed: number
  size: number
  sway: number
  swayPhase: number
  vx: number
  vy: number
  x: number
  y: number
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const count = Math.round(width * 1.25)
    const pieces: Piece[] = Array.from({ length: count }, () => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.24,
      size: 6 + Math.random() * 6,
      sway: 0.4 + Math.random() * 1.1,
      swayPhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 2.6,
      vy: 1.2 + Math.random() * 2.2,
      x: Math.random() * width,
      y: -Math.random() * height * 0.6 - 20,
    }))

    let frame = 0
    let raf = 0

    const draw = () => {
      frame += 1
      context.clearRect(0, 0, width, height)

      let alive = false

      for (const piece of pieces) {
        piece.vy += GRAVITY
        piece.x += piece.vx + Math.sin(frame * 0.03 + piece.swayPhase) * piece.sway
        piece.y += piece.vy
        piece.rotation += piece.rotationSpeed

        if (piece.y < height + 40) alive = true

        context.save()
        context.translate(piece.x, piece.y)
        context.rotate(piece.rotation)
        context.fillStyle = piece.color
        context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2)
        context.restore()
      }

      if (alive) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas aria-hidden="true" className={classes.host} ref={canvasRef} />
}
