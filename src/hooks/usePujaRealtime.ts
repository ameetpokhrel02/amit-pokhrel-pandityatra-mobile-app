import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/services/api-client';

export function usePujaRealtime(bookingId: number | undefined, onUpdate?: (data: any) => void) {
  const [status, setStatus] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    let socket: WebSocket;

    const connect = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (!token) return;

        // Construct WS URL: replace /api with /ws and protocol http with ws
        // API_BASE_URL is usually something like http://192.168.1.83:8000/api
        const wsBase = API_BASE_URL.replace('http', 'ws').replace('/api', '/ws');
        const wsUrl = `${wsBase}/puja/${bookingId}/?token=${token}`;
        
        console.log('[WS] Connecting to:', wsUrl);
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[WS] Connected to puja updates');
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS] Received update:', data);
            if (data.status) {
              setStatus(data.status);
            }
            if (onUpdate) {
              onUpdate(data);
            }
          } catch (e) {
            console.error('[WS] Error parsing message:', e);
          }
        };

        socket.onerror = (e) => {
          console.error('[WS] Error:', e);
        };

        socket.onclose = () => {
          console.log('[WS] Disconnected');
          setIsConnected(false);
          // Optional: Reconnect logic
        };

        socketRef.current = socket;
      } catch (err) {
        console.error('[WS] Connection failed:', err);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [bookingId]);

  return { status, isConnected };
}
