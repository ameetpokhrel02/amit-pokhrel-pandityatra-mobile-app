import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme, View, Text } from 'react-native';
import { useCartStore } from '@/store/cart.store';
import { useChatStore } from '@/store/chat.store';
import { useTheme } from '@/store/ThemeContext';

function ShopIcon({ color, focused }: { color: string, focused: boolean }) {
  const { totalItems } = useCartStore();
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

function LayoutContent() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const activeColor = colors.primary;
  const inactiveColor = '#8E8E93';

  return (
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
      {/* Hidden Screens */}
      {[
        'bookings', 'bookings/[id]', 'booking', 'chat/ai-guide', 
        'bookings/samagri-recommendations', 'cart', 'shop/[id]', 
        'kundali', 'edit-profile', 'checkout', 'panchang', 
        'services/index', 'chat/[id]', 'pandit/[id]', 'payments', 
        'payments/checkout', 'video/[bookingId]', 'services/list', 
        'services/[id]', 'shop/ai-recommend', 'reviews/pending', 
        'reviews/history', 'reviews/platform-feedback', 'bookings/review',
        'notifications', 'kundali-history', 'shop/orders', 'shop/order/[id]',
        'booking-confirmation', 'invoice'
      ].map(screen => (
        <Tabs.Screen
          key={screen}
          name={screen}
          options={{
            href: null,
            tabBarItemStyle: { display: 'none' }
          }}
        />
      ))}
    </Tabs>
  );
}

export default function CustomerTabLayout() {
  return <LayoutContent />;
}


