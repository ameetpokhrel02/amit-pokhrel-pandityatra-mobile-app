import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/theme/colors';
import { useTheme } from '@/store/ThemeContext';
import { sendAiChatMessage } from '@/services/ai.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  attachmentName?: string;
}

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { initialQuestion, contextLabel } = useLocalSearchParams<{ initialQuestion?: string; contextLabel?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; uri: string } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initial greeting from AI Guide
    loadInitialGuide();
  }, []);

  const loadInitialGuide = async () => {
    setLoading(true);
    try {
      const greeting = contextLabel
        ? `Namaste! I'm your PanditYatra AI Guide. I can see you'd like to talk about your ${contextLabel}. Go ahead and ask me anything.`
        : "Namaste! I am your PanditYatra AI Guide. How can I help you with your spiritual journey today?";
      const initialMsg: Message = {
        id: '1',
        text: greeting,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages([initialMsg]);
      if (initialQuestion) {
        await sendMessage(initialQuestion);
      }
    } catch (error) {
      console.error('Error fetching AI guide:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setAttachment({ name: result.assets[0].name, uri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Attachment failed', 'Could not open the file picker.');
    }
  };

  const sendMessage = async (rawText: string) => {
    if ((!rawText.trim() && !attachment) || loading) return;
    const text = rawText.trim() || 'Please take a look at this document.';

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: Date.now(),
      attachmentName: attachment?.name,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // The AI chat endpoint answers from text context — a PDF attachment is referenced
    // by name in the prompt since the backend has no file-upload contract for this endpoint.
    const promptText = attachment ? `${text}\n\n[Attached document: ${attachment.name}]` : text;
    setAttachment(null);

    try {
      const aiResponse = await sendAiChatMessage(promptText);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again later.",
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(inputText);

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble, 
      item.sender === 'user' ? styles.userBubble : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]
    ]}>
      {item.attachmentName && (
        <View style={styles.attachmentChip}>
          <Ionicons name="document-text" size={14} color={item.sender === 'user' ? '#FFF' : colors.primary} />
          <Text style={[styles.attachmentChipText, item.sender === 'user' ? styles.userText : { color: colors.text }]} numberOfLines={1}>
            {item.attachmentName}
          </Text>
        </View>
      )}
      <Text style={[
        styles.messageText,
        item.sender === 'user' ? styles.userText : { color: colors.text }
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI Guide</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading && messages[messages.length-1]?.sender === 'user' ? (
          <View style={[styles.aiBubble, styles.loadingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      />

      {attachment && (
        <View style={[styles.pendingAttachment, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="document-text" size={16} color={colors.primary} />
          <Text style={[styles.pendingAttachmentText, { color: colors.text }]} numberOfLines={1}>{attachment.name}</Text>
          <TouchableOpacity onPress={() => setAttachment(null)}>
            <Ionicons name="close-circle" size={18} color={colors.text + '80'} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.attachBtn} onPress={handlePickPdf}>
          <Ionicons name="attach" size={22} color={colors.text + '80'} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
          placeholder="Ask about pujas, rituals, or samagri..."
          placeholderTextColor={colors.text + '50'}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: (inputText.trim() || attachment) ? colors.primary : colors.text + '20' }]}
          onPress={handleSend}
          disabled={(!inputText.trim() && !attachment) || loading}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  aiBadgeText: { fontSize: 12, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  messageList: { padding: 20, paddingBottom: 30 },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 15,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6F00',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFF' },
  loadingBubble: { paddingVertical: 10, paddingHorizontal: 20 },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    opacity: 0.9,
  },
  attachmentChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  pendingAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pendingAttachmentText: { flex: 1, fontSize: 13, fontWeight: '600' },
  attachBtn: { width: 36, height: 44, justifyContent: 'center', alignItems: 'center' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
