/**
 * MatrixBackground Component
 *
 * A Matrix-style falling character background effect for the admin login page.
 *
 * CONFIGURATION:
 * - Color: Dark yellow (#C9A000) on black background
 * - Speed: Adjustable via `speed` prop (default: 0.4)
 * - Density: Adjustable via `density` prop (default: 0.85)
 * - Character set: Customizable via `characters` prop
 *
 * USAGE:
 * <MatrixBackground speed={0.4} density={0.85} />
 *
 * TO DISABLE: Simply remove the component from AdminLogin.tsx
 *
 * PERFORMANCE:
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - Automatically cleans up on unmount (no memory leaks)
 * - Optimized for desktop/laptop performance
 */

import React, { useEffect, useRef } from 'react';
import './MatrixBackground.css';

interface MatrixBackgroundProps {
  /**
   * Speed multiplier for falling characters (0.1 - 2.0)
   * Default: 0.4 (slower = more cinematic)
   */
  speed?: number;

  /**
   * Density of the character rain (0.1 - 1.5)
   * Lower = fewer columns, Higher = more intense
   * Default: 0.85
   */
  density?: number;

  /**
   * Custom character set for the falling text
   * Default: Mix of uppercase, numbers, and symbols
   */
  characters?: string;

  /**
   * Primary color for falling characters
   * Default: #C9A000 (dark yellow)
   */
  color?: string;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({
  speed = 0.4,
  density = 0.85,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-=<>[]{}|',
  color = '#C9A000',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const charArray = characters.split('');
    const fontSize = 14;
    const columnSpacing = fontSize; // Tight spacing for full width coverage
    const columns = Math.floor((canvas.width / columnSpacing) * density);

    // Initialize drop positions and start times
    const drops: number[] = [];
    const dropStartTimes: number[] = [];
    const dropActive: boolean[] = []; // Track if drop is active
    const currentTime = Date.now();

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -150; // Random starting position (off-screen)
      dropStartTimes[i] = currentTime + (Math.random() * 5000); // Stagger start times
      dropActive[i] = false; // Initially inactive
    }

    // Color variations for depth effect (lighter chars appear closer)
    const getColorVariant = (baseOpacity: number) => {
      const colors = [
        `${color}${Math.floor(baseOpacity * 0.3 * 255).toString(16).padStart(2, '0')}`, // Far
        `${color}${Math.floor(baseOpacity * 0.5 * 255).toString(16).padStart(2, '0')}`, // Mid
        `${color}${Math.floor(baseOpacity * 0.7 * 255).toString(16).padStart(2, '0')}`, // Near
        `${color}${Math.floor(baseOpacity * 255).toString(16).padStart(2, '0')}`,       // Closest
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Main animation loop
    const draw = () => {
      // Balanced clearing - long trail but chars eventually disappear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'Courier New', monospace`;

      const now = Date.now();
      const maxLifetime = 5000; // 5 seconds lifetime per drop
      const fadeOutDuration = 500; // 0.5 second fade-out at the end (faster)

      // Draw falling characters
      for (let i = 0; i < drops.length; i++) {
        const timeSinceStart = now - dropStartTimes[i];
        const x = i * columnSpacing;

        // Check if drop just became active
        if (timeSinceStart >= 0 && timeSinceStart < maxLifetime) {
          if (!dropActive[i]) {
            dropActive[i] = true;
          }

          const char = charArray[Math.floor(Math.random() * charArray.length)];
          const y = drops[i] * fontSize;

          // Only draw if character is on screen
          if (y > 0 && y < canvas.height) {
            let baseOpacity = 1;

            // Fade out in the last second of lifetime (smooth disappearance)
            const fadeStartTime = maxLifetime - fadeOutDuration;
            if (timeSinceStart > fadeStartTime) {
              const fadeProgress = (timeSinceStart - fadeStartTime) / fadeOutDuration;
              baseOpacity = 1 - fadeProgress; // Gradually reduce opacity to 0
            }

            // Fade out near bottom for smooth disappearance
            const fadeZone = canvas.height - 120;
            if (y > fadeZone) {
              const fadeProgress = (y - fadeZone) / 120;
              baseOpacity *= (1 - fadeProgress);
            }

            // Apply opacity to color
            const alpha = Math.floor(baseOpacity * 255);
            ctx.fillStyle = `${color}${alpha.toString(16).padStart(2, '0')}`;

            ctx.fillText(char, x, y);
          }

          // Move drop down
          drops[i] += speed;
        }

        // Reset drop after 5 seconds or when it reaches bottom
        if (timeSinceStart >= maxLifetime || drops[i] * fontSize > canvas.height + 30) {
          if (dropActive[i]) {
            dropActive[i] = false;
          }

          drops[i] = Math.random() * -80 - 20; // Random delay before restart
          dropStartTimes[i] = now + (Math.random() * 2000); // New start time with random delay
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [speed, density, characters, color]);

  return <canvas ref={canvasRef} className="matrix-background-canvas" />;
};

export default MatrixBackground;
