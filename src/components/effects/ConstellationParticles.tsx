/**
 * Constellation/Particle Network Effect
 * Particles spojené čiarami vytvárajúce sieť ako konštelácie
 */

import React, { useEffect, useRef } from 'react';

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

const ConstellationParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nastavenie canvas veľkosti
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Neonová modrá farba pre všetky particles
    const particleColor = '#00bfff'; // Neonová modrá

    // Vytvorenie particle
    const createParticle = (x: number, y: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5; // Pomalšie particles
      
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2000, // 2 sekundy - kratšia životnosť
        maxLife: 2000,
        size: Math.random() * 1 + 0.3, // Veľmi malé particles: 0.3-1.3px
        color: particleColor
      };
    };

    // Click handler - vytvorí nové particles (globálne kliknutie)
    const handleClick = (event: MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      
      // Click efekt na pozícii myši
      
      // Vytvorenie 5-8 particles okolo click pozície
      const particleCount = Math.floor(Math.random() * 4) + 5;
      
      for (let i = 0; i < particleCount; i++) {
        const offsetX = (Math.random() - 0.5) * 8; // Minimálny rozptyl: ±4px
        const offsetY = (Math.random() - 0.5) * 8; // Minimálny rozptyl: ±4px
        const particle = createParticle(x + offsetX, y + offsetY);
        particlesRef.current.push(particle);
      }
    };

    // Mouse move handler (globálny)
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    // Animačná slučka
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const particles = particlesRef.current;
      
      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update pozície
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Spomalenie
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Update životnosti
        particle.life -= 16;
        
        // Odstránenie mŕtvych particles
        if (particle.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        // Opacity na základe životnosti - ešte jemnejšie
        const opacity = (particle.life / particle.maxLife) * 0.7;
        
        // Kreslenie particle
        ctx.globalAlpha = opacity;
        ctx.fillStyle = particle.color;
        // Kreslenie modrej particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Jemný glow efekt
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Kreslenie spojení medzi particles
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Spájanie iba ak sú blízko
          if (distance < 120) {
            const opacity = (120 - distance) / 120;
            const minLife = Math.min(p1.life / p1.maxLife, p2.life / p2.maxLife);
            
            ctx.globalAlpha = opacity * minLife * 0.3;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        
        // Spojenie s myšou ak je blízko
        const mouseDistance = Math.sqrt(
          (particles[i].x - mouseRef.current.x) ** 2 + 
          (particles[i].y - mouseRef.current.y) ** 2
        );
        
        if (mouseDistance < 150) {
          const opacity = (150 - mouseDistance) / 150;
          const lifeOpacity = particles[i].life / particles[i].maxLife;
          
          ctx.globalAlpha = opacity * lifeOpacity * 0.2;
          ctx.strokeStyle = particles[i].color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Spustenie animácie
    animate();

    // Event listeners (globálne na document)
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
        zIndex: 1000,
        background: 'transparent'
      }}
    />
  );
};

export default ConstellationParticles;
