import { useEffect, useRef } from 'react';

interface InfinityLoaderProps {
  size?: number;
  className?: string;
}

export const InfinityLoader = ({ size = 96, className = '' }: InfinityLoaderProps) => {
  const dotRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const glow = glowRef.current;
    const path = pathRef.current;
    if (!dot || !glow || !path) return;

    const pathLength = path.getTotalLength();
    let progress = 0;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Variable speed: medium with fast peaks
      // Use sine wave to create speed variations
      const speedVariation = Math.sin(progress * Math.PI * 2) * 0.5 + 1; // Range: 0.5 to 1.5
      const baseSpeed = 0.15; // Base speed for full loop in ~6.7 seconds
      const speed = baseSpeed * speedVariation * deltaTime;

      progress += speed;
      if (progress > 1) progress = 0;

      // Get point on path
      const point = path.getPointAtLength(progress * pathLength);
      
      // Update dot and glow positions
      dot.setAttribute('cx', point.x.toString());
      dot.setAttribute('cy', point.y.toString());
      glow.setAttribute('cx', point.x.toString());
      glow.setAttribute('cy', point.y.toString());

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        {/* Glow effect */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="dotGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" stopOpacity="1" />
            <stop offset="60%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Infinity symbol path (static) */}
        <path
          ref={pathRef}
          d="M 25 50 C 25 35, 35 35, 40 45 C 45 55, 55 55, 60 45 C 65 35, 75 35, 75 50 C 75 65, 65 65, 60 55 C 55 45, 45 45, 40 55 C 35 65, 25 65, 25 50 Z"
          fill="none"
          stroke="hsl(175, 84%, 50%)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Additional glow layer for the path */}
        <path
          d="M 25 50 C 25 35, 35 35, 40 45 C 45 55, 55 55, 60 45 C 65 35, 75 35, 75 50 C 75 65, 65 65, 60 55 C 55 45, 45 45, 40 55 C 35 65, 25 65, 25 50 Z"
          fill="none"
          stroke="hsl(175, 84%, 50%)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.2"
          filter="url(#glow)"
        />

        {/* Additional glow circle behind the dot */}
        <circle
          ref={glowRef}
          cx="25"
          cy="50"
          r="8"
          fill="hsl(180, 100%, 50%)"
          opacity="0.3"
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values="6;10;6"
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Moving dot with glow */}
        <circle
          ref={dotRef}
          cx="25"
          cy="50"
          r="3"
          fill="url(#dotGradient)"
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values="3;4;3"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Outer glow effect using CSS */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div 
          className="rounded-full bg-primary/20 blur-xl animate-pulse"
          style={{ 
            width: size * 0.7, 
            height: size * 0.7 
          }}
        />
      </div>
    </div>
  );
};
