/**
 * Performance monitoring utilities
 * Helps track and optimize application performance
 */

export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric);
  }
};

/**
 * Monitor image loading performance
 */
export const optimizeImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          imageObserver.unobserve(img);
        }
      });
    });

    // Observe all lazy-loadable images
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

/**
 * Preload critical resources
 */
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

/**
 * Measure component render time
 */
export const measurePerformance = (componentName: string, startTime: number) => {
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (process.env.NODE_ENV === 'development' && renderTime > 16.67) {
    console.warn(
      `🐢 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
    );
  }
};

/**
 * Get Core Web Vitals
 */
export const getCoreWebVitals = async () => {
  if (typeof window === 'undefined') return null;

  const vitals = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  };

  // First Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Performance API not available
    }
  }

  return vitals;
};
