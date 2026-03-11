import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme, View, Text } from 'react-native';
import { CartProvider, useCart } from '@/store/CartContext';

function CartIcon({ color, focused }: { color: string, focused: boolean }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
      {totalItems > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -6,
            top: -3,
            backgroundColor: '#EF4444',
            borderRadius: 8,
            width: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{totalItems}</Text>
        </View>
      )}
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
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color, focused }) => (
              <CartIcon color={color} focused={focused} />
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
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="chat/ai-guide"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="bookings/samagri-recommendations"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="shop/[id]"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="kundali"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="checkout"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="panchang"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="services/index"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="chat/[id]"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="pandit/[id]"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="video/[bookingId]"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="services/list"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="services/[id]"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="shop/ai-recommend"
          options={{
            href: null
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


