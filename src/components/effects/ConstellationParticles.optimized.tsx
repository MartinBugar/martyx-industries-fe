/**
 * Optimized Constellation/Particle Network Effect
 * Performance improvements:
 * - Memoization to prevent unnecessary re-renders
 * - Reduced particle count for better performance
 * - Optimized animation loop with RAF throttling
 * - Better memory management and cleanup
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useStableCallback } from '../../hooks/useOptimizedEffect';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ConstellationParticlesProps {
  particleCount?: number;
  maxDistance?: number;
  speed?: number;
  enabled?: boolean;
}

const ConstellationParticles: React.FC<ConstellationParticlesProps> = React.memo(({ 
  particleCount = 20, // Reduced from default for better performance
  maxDistance = 150,
  speed = 0.5,
  enabled = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastFrameTimeRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Throttled animation for better performance
  const FRAME_RATE = 1000 / 30; // 30 FPS instead of 60

  // Optimized particle creation with memoization
  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const particleSpeed = Math.random() * speed + 0.2;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * particleSpeed,
      vy: Math.sin(angle) * particleSpeed,
      life: 255,
      maxLife: 255,
      size: Math.random() * 2 + 1,
      color: '#00bfff'
    };
  }, [speed]);

  // Optimized animation loop with stable callback
  const animate = useStableCallback((currentTime: number) => {
    if (!enabled || !isVisibleRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Throttle frame rate
    if (currentTime - lastFrameTimeRef.current < FRAME_RATE) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    lastFrameTimeRef.current = currentTime;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas with slight fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
      if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;
      
      // Update life
      particle.life -= 1;
      
      // Remove dead particles
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      // Draw particle
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = `rgba(0, 191, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw connections between nearby particles (optimized)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.3;
          ctx.strokeStyle = `rgba(0, 191, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
    // Spawn new particles if needed
    if (particles.length < particleCount) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push(createParticle(x, y));
    }
    
    animationRef.current = requestAnimationFrame(animate);
  });

  // Optimized resize handler
  const handleResize = useStableCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Mouse move handler for interactivity
  const handleMouseMove = useStableCallback((event: MouseEvent) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
    
    // Add particle at mouse position occasionally
    if (Math.random() < 0.1 && particlesRef.current.length < particleCount) {
      particlesRef.current.push(createParticle(event.clientX, event.clientY));
    }
  });

  // Visibility change handler to pause when not visible
  const handleVisibilityChange = useStableCallback(() => {
    isVisibleRef.current = !document.hidden;
  });

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particlesRef.current.push(createParticle(x, y));
    }

    // Event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      
      particlesRef.current = [];
    };
  }, [enabled, particleCount, createParticle, animate, handleResize, handleMouseMove, handleVisibilityChange]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        background: 'transparent'
      }}
      aria-hidden="true"
    />
  );
});

ConstellationParticles.displayName = 'ConstellationParticles';

export default ConstellationParticles;
