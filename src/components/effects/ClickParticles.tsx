/**
 * Click Particles Effect Component
 * Vytvára vizuálne particles efekty pri kliknutí myšou
 */

import React, { useEffect, useRef, useCallback } from 'react';
import './ClickParticles.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  element: HTMLDivElement;
}

interface ClickParticlesProps {
  enabled?: boolean;
  particleCount?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  lifetime?: number;
}

const ClickParticles: React.FC<ClickParticlesProps> = ({
  enabled = true,
  particleCount = 12,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  minSize = 4,
  maxSize = 8,
  minSpeed = 2,
  maxSpeed = 6,
  lifetime = 1000
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const particleIdRef = useRef(0);

  // Utility funkcie
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // Vytvorenie novej particles
  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = random(0, Math.PI * 2);
    const speed = random(minSpeed, maxSpeed);
    const size = random(minSize, maxSize);
    
    // Vytvorenie DOM elementu pre particle
    const element = document.createElement('div');
    element.className = 'click-particle';
    element.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background-color: ${randomColor()};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      box-shadow: 0 0 6px currentColor;
    `;
    
    document.body.appendChild(element);

    return {
      id: particleIdRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: lifetime,
      maxLife: lifetime,
      size,
      color: element.style.backgroundColor,
      element
    };
  }, [colors, minSize, maxSize, minSpeed, maxSpeed, lifetime]);

  // Update particles animácie
  const updateParticles = useCallback(() => {
    const particles = particlesRef.current;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update pozície
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Gravitácia a spomalenie
      particle.vy += 0.2; // Gravitácia
      particle.vx *= 0.98; // Air resistance
      particle.vy *= 0.98;
      
      // Update životnosti
      particle.life -= 16; // ~60fps
      
      // Update opacity na základe životnosti
      const opacity = particle.life / particle.maxLife;
      const scale = 0.2 + (opacity * 0.8);
      
      // Update DOM elementu
      particle.element.style.transform = `translate(${particle.x - particle.size / 2}px, ${particle.y - particle.size / 2}px) scale(${scale})`;
      particle.element.style.opacity = opacity.toString();
      
      // Odstránenie "mŕtvych" particles
      if (particle.life <= 0) {
        particle.element.remove();
        particles.splice(i, 1);
      }
    }
    
    // Pokračovanie animácie ak sú particles
    if (particles.length > 0) {
      animationRef.current = requestAnimationFrame(updateParticles);
    }
  }, []);

  // Spustenie particles efektu
  const createParticlesBurst = useCallback((x: number, y: number) => {
    if (!enabled) return;
    
    const particles = particlesRef.current;
    
    // Vytvorenie nových particles
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle(x, y);
      particles.push(particle);
    }
    
    // Spustenie animácie ak nie je už spustená
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(updateParticles);
    }
  }, [enabled, particleCount, createParticle, updateParticles]);

  // Event handler pre click
  const handleClick = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    // Získanie pozície myši
    const x = event.clientX;
    const y = event.clientY;
    
    createParticlesBurst(x, y);
  }, [enabled, createParticlesBurst]);

  // Event listeners setup
  useEffect(() => {
    if (!enabled) return;
    
    // Pridanie global click listener
    document.addEventListener('click', handleClick, { passive: true });
    
    return () => {
      document.removeEventListener('click', handleClick);
      
      // Cleanup animácie
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      
      // Cleanup všetkých particles
      particlesRef.current.forEach(particle => {
        particle.element.remove();
      });
      particlesRef.current = [];
    };
  }, [enabled, handleClick]);

  // Cleanup pri unmount
  useEffect(() => {
    return () => {
      // Cleanup všetkých particles pri unmount
      particlesRef.current.forEach(particle => {
        particle.element.remove();
      });
      particlesRef.current = [];
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Komponent nevykresluje žiadny UI - particles sú pridané priamo do body
  return null;
};

export default ClickParticles;
