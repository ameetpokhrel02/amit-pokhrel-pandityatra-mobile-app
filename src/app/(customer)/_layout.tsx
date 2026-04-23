import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { View, Text } from 'react-native';
import { useCartStore } from '@/store/cart.store';
import { useTheme } from '@/store/ThemeContext';
import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';

function ShopIcon({ color, focused }: { color: string, focused: boolean }) {
  const { totalItems } = useCartStore();
  const { colors } = useTheme();
  return (
    <View className="items-center justify-center">
      <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={22} color={color} />
      {totalItems > 0 && (
        <View
          style={{ backgroundColor: '#FF6F00', borderColor: colors.card }}
          className="absolute -right-2 -top-1 rounded-full min-w-[16px] h-4 justify-center items-center px-0.5 border-1.5"
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
        tabBar={(props) => <CustomTabBar {...props} role="customer" />}
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
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
          name="bookings/index"
          options={{
            title: 'Bookings',
            tabBarLabel: 'Bookings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop/index"
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
          'ai-assistant',
          'booking-confirmation',
          'cart',
          'checkout',
          'edit-profile',
          'help-contact',
          'help',
          'invoice',
          'kundali-history',
          'kundali',
          'panchang',
          'preferences',
          'recordings',
          'services',
          'video-player',
          'wishlist',
          'booking/index',
          'booking/date-time',
          'bookings/[id]',
          'bookings/samagri-recommendations',
          'bookings/review',
          'pandit/[id]',
          'payments',
          'reviews/pending',
          'reviews/history',
          'reviews/platform-feedback',
          'reviews/app-reviews',
          'bookings/pandit-feedback',
          'shop/ai-recommend',
          'shop/[id]',
          'shop/orders',
          'shop/order/[id]',
          'security',
          'legal/privacy-policy',
          'legal/terms-of-service'
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
    </View>
  );
}

export default function CustomerTabLayout() {
  return <LayoutContent />;
}
