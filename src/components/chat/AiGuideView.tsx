import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, Bubble, IMessage, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { sendAiChatMessage } from '@/services/ai.service';
import { ProductCard } from './ProductCard';

interface CustomMessage extends IMessage {
    products?: any[];
}

export const AiGuideView: React.FC = () => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const [messages, setMessages] = useState<CustomMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        setMessages([
            {
                _id: 'welcome',
                text: 'Namaste! I am your PanditYatra AI guide. How can I help you today?',
                createdAt: new Date(),
                user: {
                    _id: 'bot',
                    name: 'AI Guide',
                    avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png',
                },
            },
        ]);
    }, []);

    const onSend = useCallback(async (newMessages: CustomMessage[] = []) => {
        setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
        const userMsg = newMessages[0].text;

        setIsTyping(true);
        try {
            const data = await sendAiChatMessage(userMsg);
            const aiText = data.response || data.message || "I'm sorry, I couldn't process that.";
            const products = data.metadata?.products || [];

            const aiMessage: CustomMessage = {
                _id: Math.random().toString(),
                text: aiText,
                createdAt: new Date(),
                user: {
                    _id: 'bot',
                    name: 'AI Guide',
                    avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png',
                },
                products: products,
            };

            setMessages((previousMessages) => GiftedChat.append(previousMessages, [aiMessage]));
        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMsg: CustomMessage = {
                _id: Math.random().toString(),
                text: "Sorry, I'm having trouble connecting. Please try again later.",
                createdAt: new Date(),
                user: { _id: 'bot', name: 'AI Guide' },
            };
            setMessages((previousMessages) => GiftedChat.append(previousMessages, [errorMsg]));
        } finally {
            setIsTyping(false);
        }
    }, []);

    const renderMessageCustomView = (props: any) => {
        const { currentMessage } = props;
        if (currentMessage.products && currentMessage.products.length > 0) {
            return (
                <View className="p-3">
                    {currentMessage.products.map((p: any) => (
                        <ProductCard
                            key={p.id}
                            id={p.id}
                            title={p.name}
                            price={p.price}
                            image={p.image}
                            description={p.description}
                        />
                    ))}
                </View>
            );
        }
        return null;
    };

    const renderBubble = (props: any) => (
        <Bubble
            {...props}
            wrapperStyle={{
                right: { backgroundColor: colors.primary },
                left: { backgroundColor: isDark ? '#333' : '#F3F4F6', maxWidth: '85%' },
            }}
            textStyle={{
                right: { color: 'white' },
                left: { color: colors.text },
            }}
        />
    );

    const renderSend = (props: any) => (
        <Send {...props} containerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
            <View className="mr-2 mb-1 h-10 w-10 items-center justify-center">
                <Ionicons name="send" size={24} color={colors.primary} />
            </View>
        </Send>
    );

    return (
        <KeyboardAvoidingView 
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View className="flex-1">
                <GiftedChat
                    messages={messages}
                    onSend={(msgs) => onSend(msgs)}
                    user={{ _id: 'me' }}
                    renderBubble={renderBubble}
                    renderSend={renderSend}
                    renderCustomView={renderMessageCustomView}
                    isTyping={isTyping}
                    textInputProps={{ 
                        placeholder: "Ask about pujas, items, or spirituality...",
                        className: "p-2"
                    }}
                    alwaysShowSend
                    infiniteScroll
                    messagesContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </KeyboardAvoidingView>
    );
};
