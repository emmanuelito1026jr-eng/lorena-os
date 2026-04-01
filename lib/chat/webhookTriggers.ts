interface LeadCapturedPayload {
  session_id: string;
  visitor_name: string;
  phone?: string;
  email?: string;
  score: number;
  page_url: string;
  messages_summary: string;
}

interface HotLeadPayload {
  session_id: string;
  score: number;
  reasons: string[];
  visitor_name?: string;
  latest_message: string;
}

function getWebhookBase(): string | null {
  const url = import.meta.env.VITE_WEBHOOK_URL;
  if (!url || url.includes('your-n8n-instance')) return null;
  return url.replace(/\/$/, '');
}

function fireAndForget(url: string, payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);

    // Prefer sendBeacon for reliability (works even during page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    // Fallback to fetch
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Silent fail — fire and forget
    });
  } catch {
    // Silent fail
  }
}

export function triggerLeadCaptured(data: LeadCapturedPayload): void {
  const base = getWebhookBase();
  if (!base) return;
  fireAndForget(`${base}/chat-lead-captured`, {
    ...data,
    source: 'chat-widget',
    timestamp: new Date().toISOString(),
  });
}

export function triggerHotLead(data: HotLeadPayload): void {
  const base = getWebhookBase();
  if (!base) return;
  fireAndForget(`${base}/chat-hot-lead`, {
    ...data,
    source: 'chat-widget',
    timestamp: new Date().toISOString(),
  });
}
