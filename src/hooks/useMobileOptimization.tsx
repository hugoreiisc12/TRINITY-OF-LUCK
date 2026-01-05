// Mobile Performance Optimization
// Adaptive rendering, lazy loading, and resource management

import { useEffect, useState, useRef, useCallback } from 'react';

// ============================================================
// 1. DEVICE DETECTION & RESPONSIVE HOOKS
// ============================================================

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  const [hasWindow, setHasWindow] = useState(false);

  useEffect(() => {
    setHasWindow(true);
    if (!hasWindow) return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [hasWindow, matches, query]);

  return matches;
};

export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)');
};

export const useIsTablet = (): boolean => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery('(min-width: 1025px)');
};

// ============================================================
// 2. NETWORK DETECTION & ADAPTIVE LOADING
// ============================================================

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  saveData?: boolean;
  onchange?: EventListener;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export const useNetworkStatus = () => {
  const [connection, setConnection] = useState({
    effectiveType: '4g' as string,
    downlink: 10,
    rtt: 50,
    saveData: false,
  });

  useEffect(() => {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!conn) return;

    const updateConnection = () => {
      setConnection({
        effectiveType: conn.effectiveType || '4g',
        downlink: conn.downlink || 10,
        rtt: conn.rtt || 50,
        saveData: conn.saveData || false,
      });
    };

    updateConnection();
    conn.addEventListener?.('change', updateConnection);

    return () => {
      conn.removeEventListener?.('change', updateConnection);
    };
  }, []);

  const isSlowNetwork = 
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g' ||
    connection.saveData;

  return { ...connection, isSlowNetwork };
};

// ============================================================
// 3. IMAGE OPTIMIZATION
// ============================================================

export const useImageLazyLoad = (ref: React.RefObject<HTMLImageElement>) => {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target instanceof HTMLImageElement) {
            const img = entry.target;
            img.src = img.dataset.src || '';
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
};

// ============================================================
// 4. SCROLL PERFORMANCE
// ============================================================

export const useThrottledScroll = (callback: () => void, delay: number = 100) => {
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback();
        lastRun.current = now;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, delay]);
};

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ============================================================
// 5. RENDERING OPTIMIZATION
// ============================================================

export const useMobileOptimization = () => {
  const isMobile = useIsMobile();
  const network = useNetworkStatus();

  const shouldReduceAnimations = isMobile || network.isSlowNetwork;
  const shouldReduceEffects = network.isSlowNetwork;
  const shouldDisableCharts = isMobile && network.effectiveType !== '4g';

  return {
    isMobile,
    network,
    shouldReduceAnimations,
    shouldReduceEffects,
    shouldDisableCharts,
    renderOption: isMobile ? 'mobile' : 'desktop',
  };
};

// ============================================================
// 6. BATTERY & PERFORMANCE
// ============================================================

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  onlevelchange?: EventListener;
  onchargingchange?: EventListener;
}

export const useBatteryStatus = () => {
  const [battery, setBattery] = useState({
    level: 1,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
  });

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;

    nav.getBattery().then((bm: BatteryManager) => {
      const update = () => {
        setBattery({
          level: bm.level,
          charging: bm.charging,
          chargingTime: bm.chargingTime,
          dischargingTime: bm.dischargingTime,
        });
      };

      update();
      bm.addEventListener('levelchange', update);
      bm.addEventListener('chargingchange', update);

      return () => {
        bm.removeEventListener('levelchange', update);
        bm.removeEventListener('chargingchange', update);
      };
    });
  }, []);

  const isLowBattery = battery.level < 0.2;
  const shouldOptimizeForBattery = isLowBattery && !battery.charging;

  return { ...battery, isLowBattery, shouldOptimizeForBattery };
};

// ============================================================
// 7. VIRTUAL SCROLLING HELPER
// ============================================================

export const useVirtualScroll = (items: any[], itemHeight: number, visibleCount: number) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    offsetY,
    containerRef,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
};

// ============================================================
// 8. MEMORY & PERFORMANCE MONITORING
// ============================================================

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    renderTime: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: frameCount,
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrame);
    };

    const animationId = requestAnimationFrame(countFrame);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return metrics;
};

// ============================================================
// 9. PREFETCH & PRELOAD
// ============================================================

export const usePrefetchData = (urls: string[]) => {
  useEffect(() => {
    const nav = navigator as any;
    if (!nav.connection || nav.connection.saveData) return;

    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, [urls]);
};

// ============================================================
// 10. TOUCH OPTIMIZATION
// ============================================================

export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) => {
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEnd.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return { handleTouchStart, handleTouchEnd };
};

export default {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useNetworkStatus,
  useImageLazyLoad,
  useThrottledScroll,
  useDebounce,
  useMobileOptimization,
  useBatteryStatus,
  useVirtualScroll,
  usePerformanceMonitor,
  usePrefetchData,
  useSwipeGesture,
};
