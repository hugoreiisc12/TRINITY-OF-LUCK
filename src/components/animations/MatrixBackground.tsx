import { useEffect, useRef } from 'react';
import { useIsMobile, useNetworkStatus } from '@/hooks/useMobileOptimization';

interface MatrixBackgroundProps {
  opacity?: number;
  speed?: number;
  fontSize?: number;
  disabled?: boolean;
}

export const MatrixBackground = ({ 
  opacity = 0.15, 
  speed = 1,
  fontSize = 14,
  disabled = false,
}: MatrixBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const { isSlowNetwork } = useNetworkStatus();

  // Skip animation on mobile or slow networks
  const shouldDisable = disabled || isMobile || isSlowNetwork;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shouldDisable) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Matrix characters - binary digits
    const binary = '01';
    const chars = binary.split('');

    // Calculate columns - fewer on mobile
    const columnWidth = isMobile ? fontSize * 2 : fontSize;
    const columns = Math.floor(canvas.width / columnWidth);
    
    // Array to store y-position of each column
    const drops: number[] = Array(columns).fill(1);

    // Create gradient color (Aurora cyan/teal)
    const createGradient = (y: number) => {
      const gradient = ctx.createLinearGradient(0, y - 20, 0, y);
      gradient.addColorStop(0, `hsla(180, 100%, 50%, ${opacity * 1.5})`);
      gradient.addColorStop(0.5, `hsla(175, 84%, 50%, ${opacity})`);
      gradient.addColorStop(1, `hsla(160, 84%, 45%, ${opacity * 0.3})`);
      return gradient;
    };

    // Animation function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(8, 12, 16, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Position
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Use gradient color
        ctx.fillStyle = createGradient(y);
        ctx.fillText(char, x, y);

        // Reset drop randomly and add some randomness to speed
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Increment y with variable speed
        drops[i] += speed * (Math.random() * 0.5 + 0.5);
      }
    };

    // Animation loop
    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [opacity, speed, fontSize]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};
export default MatrixBackground;
