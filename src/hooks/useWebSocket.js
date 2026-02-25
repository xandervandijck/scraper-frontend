import { useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 3000;

/**
 * useWebSocket — connects to backend WS, authenticates, and dispatches events.
 *
 * @param {string|null} token  JWT token (from AuthContext)
 * @param {object}      handlers  { onEvent(type, payload) }
 */
export function useWebSocket(token, handlers) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      handlersRef.current?.onConnect?.();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handlersRef.current?.onEvent?.(msg.type, msg.payload ?? msg);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      handlersRef.current?.onDisconnect?.();
      if (mountedRef.current && token) {
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
