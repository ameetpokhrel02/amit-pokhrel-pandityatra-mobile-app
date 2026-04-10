import { useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getChatWebSocketUrl, fetchChatRoomMessages } from '@/services/chat.service';
import { ChatMessage } from '@/types/chat';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useChatSocket(roomId: string | number | undefined) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<any>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<any>(null);

    const loadHistory = useCallback(async () => {
        if (!roomId) return;
        try {
            const history = await fetchChatRoomMessages(roomId);
            setMessages(history);
        } catch (err) {
            console.error('[ChatSocket] Failed to load history:', err);
            setError('Failed to load message history');
        }
    }, [roomId]);

    const connect = useCallback(async () => {
        if (!roomId) return;
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        setStatus('connecting');
        setError(null);

        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                setError('No authentication token found');
                setStatus('disconnected');
                return;
            }

            const wsUrl = getChatWebSocketUrl(roomId, token);
            console.log('[ChatSocket] Connecting to:', wsUrl);

            const socket = new (WebSocket as any)(wsUrl, undefined, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            socket.onopen = () => {
                console.log('[ChatSocket] Connected');
                setStatus('connected');
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            socket.onmessage = (event: any) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[ChatSocket] Received:', data);

                    // Standard Django Channels message format usually has 'type' and 'message'
                    if (data.type === 'chat_message' || data.content) {
                        const newMsg: ChatMessage = {
                            id: String(data.id || Date.now()),
                            chatId: String(roomId),
                            senderId: String(data.sender || data.sender_id || ''),
                            text: data.content || data.message || '',
                            type: String(data.message_type || 'text').toLowerCase() as "text" | "system" | "ai_suggestion",
                            timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
                            isRead: false,
                            products: data.products || [], // Added
                        };

                        setMessages(prev => {
                            // Avoid duplicates if message already exists (from REST or simultaneous update)
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    } else if (data.type === 'typing') {
                        setIsTyping(true);
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                    }
                } catch (e) {
                    console.error('[ChatSocket] Error parsing message:', e);
                }
            };

            socket.onerror = (e: any) => {
                console.error('[ChatSocket] Error:', e);
                setError('Connection error');
            };

            socket.onclose = (e: any) => {
                console.log('[ChatSocket] Closed:', e.code, e.reason);
                setStatus('disconnected');
                
                // Auto-reconnect after 3 seconds if not explicitly closed
                if (e.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('[ChatSocket] Attempting reconnect...');
                        connect();
                    }, 3000);
                }
            };

            socketRef.current = socket;
        } catch (err) {
            console.error('[ChatSocket] Connection failed:', err);
            setStatus('disconnected');
            setError('Failed to establish connection');
        }
    }, [roomId]);

    useEffect(() => {
        loadHistory();
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close(1000, 'Component unmounted');
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [roomId, loadHistory, connect]);

    const manualRefresh = () => {
        loadHistory();
    };

    const sendMessage = useCallback((text: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message: text }));
            return true;
        }
        return false;
    }, []);

    return { messages, status, error, isTyping, manualRefresh, sendMessage };
}
