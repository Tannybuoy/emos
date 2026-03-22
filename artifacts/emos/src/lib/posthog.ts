import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

if (key) {
  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'never',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!key) return;
  posthog.capture(event, properties);
}

export function capturePageView(path: string) {
  if (!key) return;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  posthog.capture('$pageview', { $current_url: `${origin}${path}` });
}
