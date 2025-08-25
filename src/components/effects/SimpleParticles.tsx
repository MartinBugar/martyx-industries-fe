/**
 * Jednoduchý particles test komponent
 * Pre rýchle testovanie základnej funkcionality
 */

import React, { useEffect } from 'react';

const SimpleParticles: React.FC = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      console.log('Click burst at:', event.clientX, event.clientY);
      
      // Farebná paleta
      const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', 
        '#f0932b', '#eb4d4b', '#6c5ce7', '#a55eea',
        '#26de81', '#fd79a8', '#fdcb6e', '#e17055'
      ];
      
      // Vytvorenie viacerých particles v rôznych smeroch
      const particleCount = 12;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        
        // Náhodné vlastnosti
        const size = Math.random() * 8 + 4; // 4-12px
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const velocity = Math.random() * 150 + 50; // 50-200px
        const duration = Math.random() * 800 + 600; // 600-1400ms
        
        // Výpočet cieľovej pozície
        const targetX = Math.cos(angle) * velocity;
        const targetY = Math.sin(angle) * velocity - Math.random() * 50; // Bias nahor
        
        particle.style.cssText = `
          position: fixed;
          left: ${event.clientX - size/2}px;
          top: ${event.clientY - size/2}px;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          pointer-events: none;
          z-index: 10000;
          box-shadow: 0 0 6px ${color};
          animation: particleBurst${i} ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        `;
        
        // Vytvorenie unikátnej animácie pre každú particle
        const animationName = `particleBurst${i}`;
        const keyframes = `
          @keyframes ${animationName} {
            0% { 
              opacity: 1; 
              transform: translate(0, 0) scale(1) rotate(0deg); 
            }
            50% { 
              opacity: 0.8; 
              transform: translate(${targetX * 0.7}px, ${targetY * 0.7}px) scale(1.1) rotate(180deg); 
            }
            100% { 
              opacity: 0; 
              transform: translate(${targetX}px, ${targetY}px) scale(0.2) rotate(360deg); 
            }
          }
        `;
        
        // Pridanie keyframes do DOM
        const style = document.createElement('style');
        style.textContent = keyframes;
        document.head.appendChild(style);
        
        document.body.appendChild(particle);
        
        // Cleanup po animácii
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
          if (style.parentNode) {
            style.parentNode.removeChild(style);
          }
        }, duration);
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  return null;
};

export default SimpleParticles;
