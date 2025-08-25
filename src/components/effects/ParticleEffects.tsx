/**
 * Advanced Particle Effects System
 * Rozšírený systém pre rôzne typy particles efektov
 */

import React, { useEffect, useRef, useCallback } from 'react';
import './ClickParticles.css';

export type ParticleType = 'default' | 'sparkle' | 'heart' | 'star' | 'confetti' | 'ripple';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: ParticleType;
  element: HTMLDivElement;
}

interface ParticleEffectsProps {
  enabled?: boolean;
  type?: ParticleType;
  particleCount?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  lifetime?: number;
  gravity?: number;
  resistance?: number;
}

const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  enabled = true,
  type = 'default',
  particleCount = 15,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'],
  minSize = 4,
  maxSize = 10,
  minSpeed = 3,
  maxSpeed = 8,
  lifetime = 1200,
  gravity = 0.3,
  resistance = 0.96
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const particleIdRef = useRef(0);

  // Utility funkcie
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // Vytvorenie particle elementu na základe typu
  const createParticleElement = (type: ParticleType, size: number, color: string): HTMLDivElement => {
    const element = document.createElement('div');
    element.className = `click-particle click-particle--${type}`;
    
    console.log('Creating particle element:', { type, size, color });
    
    const baseStyles = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 9999;
      will-change: transform, opacity;
    `;

    switch (type) {
      case 'sparkle':
        element.style.cssText = baseStyles + `
          background: radial-gradient(circle, ${color} 0%, transparent 70%);
          border-radius: 50%;
          box-shadow: 0 0 ${size}px ${color};
        `;
        break;
        
      case 'heart':
        element.style.cssText = baseStyles + `
          background-color: ${color};
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          transform: rotate(-45deg);
          box-shadow: 0 0 6px ${color};
        `;
        break;
        
      case 'star':
        element.style.cssText = baseStyles + `
          background-color: ${color};
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          box-shadow: 0 0 8px ${color};
        `;
        break;
        
      case 'confetti':
        element.style.cssText = baseStyles + `
          background-color: ${color};
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          box-shadow: 0 0 4px ${color};
        `;
        break;
        
      case 'ripple':
        element.style.cssText = baseStyles + `
          border: 2px solid ${color};
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 0 0 2px ${color}33;
        `;
        break;
        
      default:
        element.style.cssText = baseStyles + `
          background-color: ${color};
          border-radius: 50%;
          box-shadow: 0 0 6px ${color};
        `;
    }
    
    document.body.appendChild(element);
    console.log('Particle element added to body:', element, 'styles:', element.style.cssText);
    return element;
  };

  // Vytvorenie novej particle
  const createParticle = useCallback((x: number, y: number, particleType: ParticleType): Particle => {
    const angle = random(0, Math.PI * 2);
    const speed = random(minSpeed, maxSpeed);
    const size = random(minSize, maxSize);
    const color = randomColor();
    
    const element = createParticleElement(particleType, size, color);
    
    return {
      id: particleIdRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - random(1, 3), // Slight upward bias
      life: lifetime,
      maxLife: lifetime,
      size,
      rotation: 0,
      rotationSpeed: random(-5, 5),
      color,
      type: particleType,
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
      
      // Aplikovanie fyziky
      particle.vy += gravity; // Gravitácia
      particle.vx *= resistance; // Air resistance
      particle.vy *= resistance;
      
      // Rotácia
      particle.rotation += particle.rotationSpeed;
      
      // Update životnosti
      particle.life -= 16; // ~60fps
      
      // Vypočítanie opacity a scale na základe životnosti
      const progress = 1 - (particle.life / particle.maxLife);
      const opacity = Math.max(0, 1 - progress);
      
      let scale: number;
      if (particle.type === 'ripple') {
        // Ripple rastie a fade out
        scale = 0.5 + (progress * 2);
      } else {
        // Ostatné particles zmenšujú sa
        scale = 0.3 + (opacity * 0.7);
      }
      
      // Update DOM elementu
      const transform = `
        translate(${particle.x - particle.size / 2}px, ${particle.y - particle.size / 2}px) 
        scale(${scale}) 
        rotate(${particle.rotation}deg)
      `;
      
      particle.element.style.transform = transform;
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
  }, [gravity, resistance]);

  // Spustenie particles efektu
  const createParticlesBurst = useCallback((x: number, y: number) => {
    if (!enabled) return;
    
    const particles = particlesRef.current;
    
    console.log('Creating particle burst with', particleCount, 'particles of type', type);
    
    // Vytvorenie nových particles
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle(x, y, type);
      particles.push(particle);
      console.log('Created particle:', particle.id, 'at', { x: particle.x, y: particle.y });
    }
    
    // Pre ripple efekt pridaj aj centrálnu particle
    if (type === 'ripple') {
      const centralParticle = createParticle(x, y, 'sparkle');
      centralParticle.vx = 0;
      centralParticle.vy = 0;
      particles.push(centralParticle);
    }
    
    console.log('Total particles after burst:', particles.length);
    
    // Spustenie animácie ak nie je už spustená
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(updateParticles);
      console.log('Animation started');
    }
  }, [enabled, particleCount, type, createParticle, updateParticles]);

  // Event handler pre click
  const handleClick = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    // Získanie pozície myši
    const x = event.clientX;
    const y = event.clientY;
    
    // Debug informácie
    console.log('Particle click detected at:', { x, y });
    
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

  return null;
};

export default ParticleEffects;
