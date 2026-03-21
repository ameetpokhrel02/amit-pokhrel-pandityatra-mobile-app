import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { GiftedChat, Bubble, IMessage, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatTimer } from '@/hooks/useChatTimer';

interface PanditChatViewProps {
    roomId: string | number;
    panditName?: string;
    isPostBooking?: boolean; // If true, unlimited time
}

export const PanditChatView: React.FC<PanditChatViewProps> = ({
    roomId,
    panditName,
    isPostBooking = false
}) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const { messages: socketMessages, status, sendMessage } = useChatSocket(roomId);
    const { secondsLeft, formattedTime, isActive, startTimer, stopTimer, isExpired } = useChatTimer();

    // Map socket messages to GiftedChat format
    const formattedMessages: IMessage[] = useMemo(() => {
        return socketMessages.map(m => ({
            _id: m.id,
            text: m.text,
            createdAt: new Date(m.timestamp),
            user: {
                _id: m.senderId === 'me' || m.senderId === 'u1' ? 'me' : 'pandit',
                name: m.senderId === 'me' || m.senderId === 'u1' ? 'You' : (panditName || 'Pandit'),
            },
        })).reverse(); // GiftedChat expects newest first
    }, [socketMessages, panditName]);

    useEffect(() => {
        // Start timer only for pre-booking
        if (!isPostBooking && !isExpired) {
            startTimer();
        }
        return () => {
            stopTimer();
        };
    }, [isPostBooking, isExpired, startTimer, stopTimer]);

    const onSend = useCallback((newMessages: IMessage[] = []) => {
        if (!isPostBooking && isExpired) {
            Alert.alert("Time Limit Reached", "Your 15-minute daily limit for pre-booking chat has expired.");
            return;
        }

        const userMsg = newMessages[0].text;
        const sent = sendMessage(userMsg);
        
        if (!sent) {
            Alert.alert("Connection Error", "Message could not be sent. Please check your connection.");
        }
    }, [isPostBooking, isExpired, sendMessage]);

    const renderBubble = (props: any) => (
        <Bubble
            {...props}
            wrapperStyle={{
                right: { backgroundColor: colors.primary },
                left: { backgroundColor: isDark ? '#333' : '#F3F4F6' },
            }}
            textStyle={{
                right: { color: 'white' },
                left: { color: colors.text },
            }}
        />
    );

    const renderSend = (props: any) => (
        <Send {...props} disabled={!isPostBooking && isExpired} containerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
            <View className="mr-2 mb-1 h-10 w-10 items-center justify-center" style={{ opacity: (!isPostBooking && isExpired) ? 0.5 : 1 }}>
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
                {!isPostBooking && (
                    <View 
                        className="flex-row items-center justify-center p-3 gap-2"
                        style={{ backgroundColor: isExpired ? '#FEE2E2' : '#FFF7ED' }}
                    >
                        <Ionicons 
                            name="timer-outline" 
                            size={18} 
                            color={isExpired ? '#EF4444' : '#F97316'} 
                        />
                        <Text 
                            className="text-sm font-bold"
                            style={{ color: isExpired ? '#EF4444' : '#C2410C' }}
                            numberOfLines={1}
                        >
                            {isExpired 
                                ? "Pre-booking limit reached (15m/day)" 
                                : `Time remaining: ${formattedTime}`
                            }
                        </Text>
                    </View>
                )}

                <View className="flex-1">
                    <GiftedChat
                        messages={formattedMessages}
                        onSend={(msgs) => onSend(msgs)}
                        user={{ _id: 'me' }}
                        renderBubble={renderBubble}
                        renderSend={renderSend}
                        textInputProps={{ 
                            placeholder: (!isPostBooking && isExpired) ? "Time limit reached" : "Type a message...",
                            editable: !(!isPostBooking && isExpired),
                            className: "p-2"
                        }}
                        renderInputToolbar={(!isPostBooking && isExpired) ? () => null : undefined}
                        alwaysShowSend
                        infiniteScroll
                    />
                </View>

                {status !== 'connected' && (
                    <View className="absolute top-24 left-0 right-0 items-center bg-black/50 py-1 z-50">
                        <Text className="text-white text-xs">Connecting to WebSocket...</Text>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};
