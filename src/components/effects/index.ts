/**
 * Export všetkých particles efektov
 */

export { default as ParticleEffects } from './ParticleEffects';
export { default as ClickParticles } from './ClickParticles';
export type { ParticleType } from './ParticleEffects';

// Predefinované konfigurácie pre rôzne typy efektov
export const particleConfigs = {
  sparkle: {
    type: 'sparkle' as const,
    particleCount: 12,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    minSize: 4,
    maxSize: 8,
    lifetime: 1000,
    gravity: 0.1,
    resistance: 0.98
  },
  
  confetti: {
    type: 'confetti' as const,
    particleCount: 20,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'],
    minSize: 3,
    maxSize: 6,
    lifetime: 1500,
    gravity: 0.3,
    resistance: 0.95
  },
  
  hearts: {
    type: 'heart' as const,
    particleCount: 8,
    colors: ['#ff6b6b', '#ff8a80', '#f48fb1', '#ce93d8'],
    minSize: 6,
    maxSize: 12,
    lifetime: 1200,
    gravity: 0.2,
    resistance: 0.97
  },
  
  stars: {
    type: 'star' as const,
    particleCount: 10,
    colors: ['#ffd700', '#ffed4e', '#f39c12', '#e67e22'],
    minSize: 5,
    maxSize: 10,
    lifetime: 1300,
    gravity: 0.15,
    resistance: 0.96
  },
  
  ripple: {
    type: 'ripple' as const,
    particleCount: 5,
    colors: ['#3b82f6', '#06b6d4', '#8b5cf6'],
    minSize: 20,
    maxSize: 40,
    lifetime: 800,
    gravity: 0,
    resistance: 1
  }
};
