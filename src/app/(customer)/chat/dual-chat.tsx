import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { AiGuideView } from '@/components/chat/AiGuideView';
import { PanditChatView } from '@/components/chat/PanditChatView';

type Tab = 'ai' | 'pandit';

export default function DualChatScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const isDark = theme === 'dark';
    const params = useLocalSearchParams();
    
    // Default to 'pandit' if a roomId/id is provided, otherwise 'ai'
    const initialTab: Tab = (params.id || params.roomId) ? 'pandit' : 'ai';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Custom Header */}
            <View 
                className="flex-row items-center justify-between px-2 h-[60px] border-b"
                style={{ 
                    borderBottomColor: isDark ? '#333' : '#E5E7EB', 
                    backgroundColor: colors.card 
                }}
            >
                <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 items-center justify-center">
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <View className="flex-row flex-1 justify-center h-full gap-5">
                    <TouchableOpacity 
                        onPress={() => setActiveTab('ai')}
                        className={`justify-center px-3 h-full ${activeTab === 'ai' ? 'border-b-[3px]' : ''}`}
                        style={{ borderBottomColor: activeTab === 'ai' ? colors.primary : 'transparent' }}
                    >
                        <Text 
                            className="text-base font-bold"
                            style={{ 
                                color: activeTab === 'ai' ? colors.primary : colors.text, 
                                opacity: activeTab === 'ai' ? 1 : 0.6 
                            }}
                        >
                            AI Guide
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => setActiveTab('pandit')}
                        className={`justify-center px-3 h-full ${activeTab === 'pandit' ? 'border-b-[3px]' : ''}`}
                        style={{ borderBottomColor: activeTab === 'pandit' ? colors.primary : 'transparent' }}
                    >
                        <Text 
                            className="text-base font-bold"
                            style={{ 
                                color: activeTab === 'pandit' ? colors.primary : colors.text, 
                                opacity: activeTab === 'pandit' ? 1 : 0.6 
                            }}
                        >
                            Pandit Chat
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="w-11" />
            </View>

            {/* Chat Views */}
            <View className="flex-1">
                {activeTab === 'ai' ? (
                    <AiGuideView />
                ) : (
                    <PanditChatView 
                        roomId={(params.id || params.roomId || 'default') as string} 
                        panditName={params.panditName as string}
                        isPostBooking={params.isPostBooking === 'true'}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
