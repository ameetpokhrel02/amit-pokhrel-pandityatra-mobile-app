import { useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/services/api-client';

export function usePujaRealtime(bookingId: number | undefined, onUpdate?: (data: any) => void) {
  const [status, setStatus] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    if (!bookingId) return;

    // Close existing if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        console.warn('[WS] No access token found');
        return;
      }

      // Construct WS URL: replace /api/ with /ws/ and protocol http with ws
      let wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws');
      
      // Cleanup base
      if (wsBase.endsWith('/')) wsBase = wsBase.slice(0, -1);
      
      /**
       * ⚠️ PATH NOTE: 
       * If /ws/puja/ is failing with 404/Handshake error, it might be /ws/booking/ (singular) 
       * or /ws/bookings/ (plural) to match REST endpoints.
       */
      const fullWsUrl = `${wsBase}/puja/${bookingId}/?token=${token}`;
      
      console.log(`[WS] Connecting to: ${fullWsUrl}`);
      const socket = new WebSocket(fullWsUrl);

      socket.onopen = () => {
        console.log('[WS] Connected to puja updates');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socket.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Received:', data);
          
          if (data.status) setStatus(data.status);
          if (onUpdate) onUpdate(data);
          
        } catch (e) {
          console.error('[WS] Message parse error:', e);
        }
      };

      socket.onerror = (e: any) => {
        console.error('[WS] Error Event:', JSON.stringify(e));
      };

      socket.onclose = (e: any) => {
        console.log(`[WS] Disconnected (code: ${e.code})`);
        setIsConnected(false);
        socketRef.current = null;

        // Auto-reconnect with exponential backoff if not closed cleanly
        if (e.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const nextAttempt = reconnectAttemptsRef.current + 1;
          const delay = Math.min(1000 * Math.pow(2, nextAttempt), 10000); // Max 10s
          
          console.log(`[WS] Reconnecting in ${delay}ms (Attempt ${nextAttempt}/${maxReconnectAttempts})...`);
          reconnectAttemptsRef.current = nextAttempt;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      socketRef.current = socket;
    } catch (err) {
      console.error('[WS] setup failed:', err);
    }
  }, [bookingId, onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Cleanup');
        socketRef.current = null;
      }
    };
  }, [connect]);

  const manualReconnect = () => {
    reconnectAttemptsRef.current = 0;
    connect();
  };

  return { status, isConnected, manualReconnect };
}

