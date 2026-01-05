import { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
    }
  }, [location, displayLocation]);

  const handleTransitionEnd = () => {
    if (isTransitioning) {
      setIsTransitioning(false);
      setDisplayLocation(location);
    }
  };

  return (
    <>
      {/* Light beam transition overlay */}
      <div 
        className={`page-transition-overlay ${isTransitioning ? 'active' : ''}`}
        onAnimationEnd={handleTransitionEnd}
      >
        <div className="light-beam" />
        <div className="light-beam-glow" />
      </div>

      {/* Page content */}
      <div className={isTransitioning ? 'page-content-exit' : 'page-content-enter'}>
        {children}
      </div>
    </>
  );
};
export default PageTransition;
