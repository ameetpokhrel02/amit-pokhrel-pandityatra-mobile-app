import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { useCartStore } from '@/store/cart.store';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface CustomTabBarProps extends BottomTabBarProps {
  role: 'customer' | 'pandit' | 'vendor';
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation, role }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCartStore();
  const isDark = theme === 'dark';

  const getIcon = (routeName: string, focused: boolean, color: string) => {
    let iconName: any = 'home';
    let usesMaterial = false;

    if (role === 'customer') {
      switch (routeName) {
        case 'index': iconName = focused ? 'home' : 'home-outline'; break;
        case 'pandits': iconName = focused ? 'person-circle' : 'person-circle-outline'; break;
        case 'bookings':
        case 'bookings/index': iconName = focused ? 'calendar' : 'calendar-outline'; break;
        case 'shop':
        case 'shop/index': iconName = focused ? 'bag-handle' : 'bag-handle-outline'; break;
        case 'profile': iconName = focused ? 'person' : 'person-outline'; break;
      }
    } else if (role === 'vendor') {
      switch (routeName) {
        case 'index':
          iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          usesMaterial = true;
          break;
        case 'products/index':
          iconName = 'package-variant-closed';
          usesMaterial = true;
          break;
        case 'orders/index':
          iconName = focused ? 'receipt' : 'receipt-outline';
          break;
        case 'profile':
          iconName = focused ? 'store' : 'store-outline';
          usesMaterial = true;
          break;
      }
    } else {
      // pandit
      switch (routeName) {
        case 'index': iconName = focused ? 'grid' : 'grid-outline'; break;
        case 'bookings': iconName = focused ? 'calendar' : 'calendar-outline'; break;
        case 'services':
        case 'services/index': iconName = focused ? 'sparkles' : 'sparkles-outline'; break;
        case 'chat':
        case 'chat/index':
        case 'messages': iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; break;
        case 'profile': iconName = focused ? 'person-circle' : 'person-circle-outline'; break;
      }
    }

    return (
      <View>
        {usesMaterial ? (
          <MaterialCommunityIcons name={iconName} size={24} color={color} />
        ) : (
          <Ionicons name={iconName} size={24} color={color} />
        )}
        {role === 'customer' && (routeName === 'shop' || routeName === 'shop/index') && totalItems > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.card }]}>
            <Text style={styles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
          </View>
        )}
      </View>
    );
  };

  const getLabel = (routeName: string) => {
    if (role === 'vendor') {
      switch (routeName) {
        case 'index': return 'Dashboard';
        case 'products/index': return 'Products';
        case 'orders/index': return 'Orders';
        case 'profile': return 'Profile';
        default: return routeName;
      }
    }
    switch (routeName) {
      case 'index': return 'Home';
      case 'pandits': return 'Pandits';
      case 'bookings':
      case 'bookings/index': return 'Bookings';
      case 'shop':
      case 'shop/index': return 'Shop';
      case 'profile': return 'Profile';
      case 'services':
      case 'services/index': return 'Services';
      case 'chat':
      case 'chat/index':
      case 'messages': return 'Messages';
      default: return routeName;
    }
  };

  const visibleRoutes = state.routes.filter(route => {
    const { options } = descriptors[route.key] as any;
    const isHrefHidden = options.href === null;
    const isButtonHidden = typeof options.tabBarButton === 'function' && options.tabBarButton() === null;
    return !isHrefHidden && !isButtonHidden;
  });

  const visibleIndex = visibleRoutes.findIndex(route => route.name === state.routes[state.index].name);

  // If the focused screen requests to hide the tab bar, return null
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if ((focusedOptions?.tabBarStyle as any)?.display === 'none') {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        }
      ]}
    >
      {visibleRoutes.map((route, index) => {
        const isFocused = visibleIndex === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? colors.primary : (isDark ? '#8E8E93' : '#8E8E93');

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.6}
          >
            {getIcon(route.name, isFocused, color)}
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontWeight: isFocused ? '700' : '500',
                }
              ]}
            >
              {getLabel(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
