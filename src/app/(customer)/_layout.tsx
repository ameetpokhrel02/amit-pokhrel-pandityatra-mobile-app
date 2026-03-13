import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme, View, Text } from 'react-native';
import { CartProvider, useCart } from '@/store/CartContext';

function ShopIcon({ color, focused }: { color: string, focused: boolean }) {
  const { totalItems } = useCart();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={24} color={color} />
      {totalItems >= 0 && (
        <View
          style={{
            position: 'absolute',
            right: -8,
            top: -4,
            backgroundColor: '#111', // Dark badge as in reference
            borderRadius: 10,
            minWidth: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 2,
            borderWidth: 1.5,
            borderColor: Colors.light.background,
          }}
        >
          <Text style={{ color: '#FF6F00', fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
        </View>
      )}
    </View>
  );
}

function AIChatIcon({ color, focused }: { color: string, focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons 
        name={focused ? 'chatbox' : 'chatbox-outline'} 
        size={26} 
        color={color} 
      />
      <View style={{ position: 'absolute', top: 6 }}>
        <Text style={{ 
          fontSize: 8, 
          fontWeight: 'bold', 
          color: color,
          textTransform: 'uppercase'
        }}>AI</Text>
      </View>
    </View>
  );
}

import { useTheme } from '@/store/ThemeContext';
import { ChatProvider, useChat } from '@/store/ChatContext';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { ChatModal } from '@/components/chat/ChatModal';

function LayoutContent() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const activeColor = colors.primary;
  const inactiveColor = '#8E8E93';

  const { chatVisible, openChat, closeChat, bookingId, panditName } = useChat();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: isDark ? '#333' : '#E5E5EA',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pandits"
          options={{
            title: 'Pandits',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'reorder-two' : 'reorder-two-outline'} size={32} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color, focused }) => (
              <ShopIcon color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat/index"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <AIChatIcon color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="bookings/[id]"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="chat/ai-guide"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="bookings/samagri-recommendations"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="shop/[id]"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="kundali"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="checkout"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="panchang"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="services/index"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="chat/[id]"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="pandit/[id]"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="payments/checkout"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="video/[bookingId]"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="services/list"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="services/[id]"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="shop/ai-recommend"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="reviews/pending"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="reviews/history"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="reviews/platform-feedback"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="bookings/review"
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
      </Tabs>
      {/* Hiding floating chat button as it blocks the tab bar */}
      {/* <FloatingChatButton onPress={() => openChat()} /> */}
      {/* <ChatModal
        visible={chatVisible}
        onClose={closeChat}
        bookingId={bookingId}
        panditName={panditName}
      /> */}
    </>
  );
}

export default function CustomerTabLayout() {
  return (
    <CartProvider>
      <ChatProvider>
        <LayoutContent />
      </ChatProvider>
    </CartProvider>
  );
}


