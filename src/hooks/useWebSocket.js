import { useEffect, useRef, useCallback } from 'react';

const WS_URL = (import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:1337');
const RECONNECT_DELAY = 3000;

/**
 * useWebSocket — connects to Strapi WS, authenticates, subscribes to a
 * workspace room, and dispatches events.
 *
 * @param {string|null} token        JWT token (from AuthContext)
 * @param {string|null} workspaceId  Workspace to subscribe to
 * @param {object}      handlers     { onEvent(type, payload), onConnect, onDisconnect }
 */
export function useWebSocket(token, workspaceId, handlers) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!token || !workspaceId || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'auth_ok') {
          ws.send(JSON.stringify({ type: 'subscribe', workspaceId }));
          handlersRef.current?.onConnect?.();
        } else if (msg.type === 'subscribed') {
          // ready to receive events
        } else {
          handlersRef.current?.onEvent?.(msg.type, msg.payload ?? msg);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      handlersRef.current?.onDisconnect?.();
      if (mountedRef.current && token && workspaceId) {
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = () => ws.close();
  }, [token, workspaceId]);

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
