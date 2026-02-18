import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { quickChat, getChatWebSocketUrl } from '@/services/chat.service';
import { ChatMessage } from '@/types/chat';
import { MotiView, AnimatePresence } from 'moti';

interface ChatModalProps {
    visible: boolean;
    onClose: () => void;
    bookingId?: number;
    panditName?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
    visible,
    onClose,
    bookingId,
    panditName,
}) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const mode = bookingId ? 'real-time' : 'guide';
    const ws = useRef<WebSocket | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            if (mode === 'guide' && messages.length === 0) {
                // Initial bot greeting
                setMessages([
                    {
                        id: 'welcome',
                        chatId: 'guide',
                        senderId: 'bot',
                        text: 'Namaste! I am your PanditYatra AI guide. How can I help you today?',
                        type: 'text',
                        timestamp: Date.now(),
                        isRead: true,
                    },
                ]);
            } else if (mode === 'real-time' && bookingId) {
                // In a real app, you'd fetch initial messages from HTTP first
                // then connect WebSocket for new ones.
                connectWebSocket();
            }
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [visible, mode, bookingId]);

    const connectWebSocket = () => {
        // Note: In a real app, you'd get the token from your AuthStore
        const token = 'placeholder_token';
        const url = getChatWebSocketUrl(bookingId!, token);

        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('Chat WebSocket connected');
        };

        ws.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.message) {
                const newMessage: ChatMessage = {
                    id: data.id || Math.random().toString(),
                    chatId: bookingId!.toString(),
                    senderId: data.sender_type === 'customer' ? 'me' : 'pandit',
                    text: data.message,
                    type: 'text',
                    timestamp: Date.now(),
                    isRead: true,
                };
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        ws.current.onerror = (e) => {
            console.error('Chat WebSocket error', e);
        };

        ws.current.onclose = () => {
            console.log('Chat WebSocket disconnected');
        };
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessage = {
            id: Math.random().toString(),
            chatId: mode === 'guide' ? 'guide' : bookingId!.toString(),
            senderId: 'me',
            text: inputText,
            type: 'text',
            timestamp: Date.now(),
            isRead: true,
        };

        setMessages((prev) => [...prev, userMessage]);
        const textToSend = inputText;
        setInputText('');

        if (mode === 'guide') {
            try {
                setLoading(true);
                const reply = await quickChat(textToSend);
                const botMessage: ChatMessage = {
                    id: Math.random().toString(),
                    chatId: 'guide',
                    senderId: 'bot',
                    text: reply,
                    type: 'text',
                    timestamp: Date.now(),
                    isRead: true,
                };
                setMessages((prev) => [...prev, botMessage]);
            } catch (error) {
                console.error('AI Chat Error:', error);
            } finally {
                setLoading(false);
            }
        } else if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ message: textToSend }));
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.senderId === 'me';
        return (
            <View
                style={[
                    styles.messageRow,
                    isMe ? styles.myMessageRow : styles.theirMessageRow,
                ]}
            >
                <View
                    style={[
                        styles.bubble,
                        isMe
                            ? { backgroundColor: colors.primary }
                            : { backgroundColor: isDark ? '#333' : '#F0F0F0' },
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            { color: isMe ? 'white' : colors.text },
                        ]}
                    >
                        {item.text}
                    </Text>
                    <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.7)' : '#999' }]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {mode === 'guide' ? 'PanditYatra AI Guide' : `Chat with ${panditName || 'Pandit'}`}
                        </Text>
                        <View style={styles.onlineBadge}>
                            <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.onlineText}>Online</Text>
                        </View>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messageList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.text }]}>AI is thinking...</Text>
                        </View>
                    )}

                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5', color: colors.text },
                            ]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Ask anything about pujas..."
                            placeholderTextColor="#999"
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            style={[
                                styles.sendButton,
                                { backgroundColor: colors.primary, opacity: inputText.trim() ? 1 : 0.6 },
                            ]}
                        >
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    onlineText: {
        fontSize: 10,
        color: '#666',
    },
    messageList: {
        padding: 16,
        paddingBottom: 24,
    },
    messageRow: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    myMessageRow: {
        alignSelf: 'flex-end',
    },
    theirMessageRow: {
        alignSelf: 'flex-start',
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 12,
        fontStyle: 'italic',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        marginRight: 8,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
