import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { View, Text } from 'react-native';
import { useCartStore } from '@/store/cart.store';
import { useTheme } from '@/store/ThemeContext';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';

function ShopIcon({ color, focused }: { color: string, focused: boolean }) {
  const { totalItems } = useCartStore();
  return (
    <View className="items-center justify-center">
      <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={22} color={color} />
      {totalItems > 0 && (
        <View 
            style={{ backgroundColor: '#FF6F00' }}
            className="absolute -right-2 -top-1 rounded-full min-w-[16px] h-4 justify-center items-center px-0.5 border-1.5 border-white"
        >
          <Text className="text-white text-[9px] font-bold">{totalItems}</Text>
        </View>
      )}
    </View>
  );
}

function LayoutContent() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const activeColor = colors.primary;
  const inactiveColor = '#8E8E93';

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: isDark ? '#333' : '#E5E5EA',
            height: 75,
            paddingBottom: 20,
            paddingTop: 8,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pandits"
          options={{
            title: 'Pandits',
            tabBarLabel: 'Pandits',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            tabBarLabel: 'Bookings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarLabel: 'Shop',
            tabBarIcon: ({ color, focused }) => (
              <ShopIcon color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
          }}
        />
        
        {/* Hidden Screens - Standardizing with href: null for a clean layout */}
        {[
          'bookings/[id]', 'booking/index', 'booking', 'bookings.tsx', 'booking.tsx',
          'chat/ai-guide', 'chat/index', 'bookings/samagri-recommendations', 'cart', 'shop/[id]',
          'kundali', 'edit-profile', 'checkout', 'panchang', 'services/index', 'chat/[id]', 
          'pandit/[id]', 'payments', 'services/list', 'services/[id]', 'shop/ai-recommend', 
          'reviews/pending', 'reviews/history', 'reviews/platform-feedback', 'bookings/review',
          'notifications', 'kundali-history', 'shop/orders', 'shop/order/[id]',
          'booking-confirmation', 'invoice', 'help', 'help-contact', 'wishlist', 'preferences',
          'ai-assistant', 'chat/dual-chat'
        ].map(screen => (
          <Tabs.Screen
            key={screen}
            name={screen}
            options={{
              href: null,
            }}
          />
        ))}
      </Tabs>
      <FloatingChatButton />
    </View>
  );
}

export default function CustomerTabLayout() {
  return <LayoutContent />;
}
