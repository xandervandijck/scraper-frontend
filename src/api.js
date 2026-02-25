/**
 * API client — wraps all backend calls and WebSocket connection.
 */

const BASE = '/api';
const WS_URL = `ws://${window.location.hostname}:3001`;

// ─── REST ─────────────────────────────────────────────────────────────────────

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  start: (config) => request('POST', '/start', config),
  stop: () => request('POST', '/stop'),
  status: () => request('GET', '/status'),
  leads: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request('GET', `/leads${qs ? '?' + qs : ''}`);
  },
  downloadCSV: () => { window.open(`${BASE}/download/csv`, '_blank'); },
  downloadXLSX: () => { window.open(`${BASE}/download/xlsx`, '_blank'); },

  // Sector config
  getSectors: () => request('GET', '/config/sectors'),
  saveSectors: (sectors) => request('POST', '/config/sectors', sectors),
};

// ─── WebSocket ────────────────────────────────────────────────────────────────

export class RealtimeClient {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.ws = null;
    this.reconnectTimer = null;
    this.shouldReconnect = true;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.handlers.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        switch (type) {
          case 'status':
            this.handlers.onStatus?.(payload);
            break;
          case 'lead':
            this.handlers.onLead?.(payload);
            break;
          case 'leads':
            this.handlers.onLeads?.(payload);
            break;
          case 'log':
            this.handlers.onLog?.(payload);
            break;
          case 'search_progress':
            this.handlers.onSearchProgress?.(payload);
            break;
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('[WS] Error:', err);
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.handlers.onDisconnect?.();
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}

export default api;
