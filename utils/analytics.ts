/**
 * Web Vitals tracking utility
 *
 * This module provides optional performance monitoring using the Web Vitals API.
 * Uncomment and configure with your analytics provider when ready.
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Send metrics to your analytics endpoint
 *
 * @example
 * // With Google Analytics
 * gtag('event', metric.name, {
 *   value: Math.round(metric.value),
 *   metric_id: metric.id,
 *   metric_value: metric.value,
 *   metric_delta: metric.delta,
 * });
 *
 * // With custom endpoint
 * fetch('/api/analytics', {
 *   method: 'POST',
 *   body: JSON.stringify(metric),
 * });
 */
const sendToAnalytics = (metric: WebVitalsMetric) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metric);
  }

  // Configure analytics provider integration as needed (e.g. Google Analytics, Vercel Analytics)
};

/**
 * Track Core Web Vitals
 *
 * Measures:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 */
export const trackWebVitals = async () => {
  if (typeof window === 'undefined') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await (import('web-vitals' as string) as Promise<{
      getCLS: (cb: (metric: WebVitalsMetric) => void) => void;
      getFID: (cb: (metric: WebVitalsMetric) => void) => void;
      getFCP: (cb: (metric: WebVitalsMetric) => void) => void;
      getLCP: (cb: (metric: WebVitalsMetric) => void) => void;
      getTTFB: (cb: (metric: WebVitalsMetric) => void) => void;
    }>);

    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  } catch (error) {
    console.error('Failed to load Web Vitals:', error);
  }
};

/**
 * Track custom events
 *
 * @example
 * trackEvent('form_submit', { form_type: 'contact' });
 * trackEvent('cta_click', { button_text: 'Get Started' });
 */
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.log('[Analytics Event]', eventName, properties);
  }

};

/**
 * Track page views
 *
 * Call this on route changes
 *
 * @example
 * trackPageView('/landing');
 */
export const trackPageView = (path: string) => {
  if (import.meta.env.DEV) {
    console.log('[Analytics PageView]', path);
  }

};

// Initialize tracking (uncomment when ready to use)
// if (typeof window !== 'undefined' && import.meta.env.PROD) {
//   trackWebVitals();
// }
