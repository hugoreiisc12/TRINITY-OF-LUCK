/**
 * Network and caching optimizations
 */

// Service Worker registration for offline support and caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
};

/**
 * Prefetch DNS for critical external resources
 */
export const setupDNSPrefetch = () => {
  const dnsPrefetches = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  dnsPrefetches.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Setup connection preloading
 */
export const setupPreconnect = () => {
  const preconnects = [
    { href: 'https://fonts.googleapis.com', crossorigin: 'anonymous' },
    { href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
  ];

  preconnects.forEach(({ href, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossorigin) {
      link.setAttribute('crossorigin', crossorigin);
    }
    document.head.appendChild(link);
  });
};

/**
 * Request idling callback for non-critical tasks
 */
export const scheduleIdleTask = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 0);
  }
};

/**
 * Debounce utility for event handlers
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

/**
 * Throttle utility for event handlers
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
