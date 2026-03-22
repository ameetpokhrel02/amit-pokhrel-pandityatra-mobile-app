import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';

import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function PanditTabLayout() {
  const { colors } = useTheme();
  const activeColor = colors.primary;
  const inactiveColor = '#8E8E93';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} role="pandit" />}
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
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
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
        name="services/index"
        options={{
          title: 'Services',
          tabBarLabel: 'Services',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* Hidden Screens Moved to Profile or List logic */}
      {[
        'calendar', 'earnings', 'feedback', 'reviews', 'help', 'payout-history', 'upload-recording'
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
  );
}
