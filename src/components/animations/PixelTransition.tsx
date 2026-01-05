import { ReactNode, useEffect, useRef, useState } from 'react';

interface PixelTransitionProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const PixelTransition = ({ 
  children, 
  delay = 0, 
  duration = 1000,
  className = '' 
}: PixelTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={elementRef}
      className={`pixel-transition ${isVisible ? 'pixel-visible' : ''} ${className}`}
      style={{
        '--pixel-duration': `${duration}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
export default PixelTransition;
