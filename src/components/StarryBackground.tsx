'use client'

import { useEffect, useRef } from 'react'

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resizeCanvas() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      createStars()
    }
    
    // Étoiles délicates - petites et nombreuses
    let stars: {
      x: number
      y: number
      radius: number
      alpha: number
      alphaChange: number
      twinkleSpeed: number
    }[] = []
    const numStars = 400

    function createStars() {
      stars = []
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 0.6 + 0.3,
          alpha: Math.random() * 0.7 + 0.3,
          alphaChange: Math.random() * 0.015 + 0.005,
          twinkleSpeed: Math.random() * 0.015 + 0.003
        })
      }
    }

    // Étoiles filantes
    let shootingStars: {
      x: number
      y: number
      length: number
      speed: number
      angle: number
      alpha: number
      thickness: number
    }[] = []

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let animationId: number

    function animate() {
      // Fond bleu nuit
      ctx.fillStyle = '#0B1F3A'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dégradé violet mystique
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.5
      )
      gradient.addColorStop(0, 'rgba(43, 15, 58, 0.5)')
      gradient.addColorStop(0.6, 'rgba(43, 15, 58, 0.2)')
      gradient.addColorStop(1, 'rgba(11, 31, 58, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // DESSINER LES ÉTOILES DÉLICATES
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        
        // Scintillement doux
        star.alpha += star.alphaChange
        if (star.alpha >= 1) {
          star.alpha = 1
          star.alphaChange = -star.twinkleSpeed
        } else if (star.alpha <= 0.2) {
          star.alpha = 0.2
          star.alphaChange = star.twinkleSpeed
        }

        // Petit halo doré très subtil
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(216, 177, 90, ${star.alpha * 0.08})`
        ctx.fill()

        // Étoile centrale délicate
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 250, 235, ${star.alpha})`
        ctx.fill()
      }

      // ÉTOILES FILANTES
      if (Math.random() < 0.012) {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.8,
          y: Math.random() * 100,
          length: Math.random() * 150 + 80,
          speed: Math.random() * 18 + 10,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
          alpha: 1,
          thickness: Math.random() * 2 + 1.5
        })
      }

      // DESSINER LES ÉTOILES FILANTES
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i]
        
        // Traînée lumineuse
        const trailGradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x - star.length * Math.cos(star.angle),
          star.y - star.length * Math.sin(star.angle)
        )
        trailGradient.addColorStop(0, `rgba(255, 255, 255, ${star.alpha})`)
        trailGradient.addColorStop(0.3, `rgba(216, 177, 90, ${star.alpha * 0.8})`)
        trailGradient.addColorStop(1, 'rgba(216, 177, 90, 0)')

        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(
          star.x - star.length * Math.cos(star.angle),
          star.y - star.length * Math.sin(star.angle)
        )
        ctx.strokeStyle = trailGradient
        ctx.lineWidth = star.thickness
        ctx.lineCap = 'round'
        ctx.stroke()

        // Point brillant
        ctx.beginPath()
        ctx.arc(star.x, star.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
        ctx.fill()

        // Halo
        ctx.beginPath()
        ctx.arc(star.x, star.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(216, 177, 90, ${star.alpha * 0.5})`
        ctx.fill()

        // Déplacement
        star.x += star.speed * Math.cos(star.angle)
        star.y += star.speed * Math.sin(star.angle)
        star.alpha -= 0.008

        if (star.alpha <= 0 || star.y > canvas.height + 50 || star.x > canvas.width + 50) {
          shootingStars.splice(i, 1)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
    </div>
  )
}
