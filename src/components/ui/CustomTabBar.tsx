import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { useCartStore } from '@/store/cart.store';
import { MotiView } from 'moti';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

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
    } else {
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
        <Ionicons name={iconName} size={22} color={color} />
        {role === 'customer' && (routeName === 'shop' || routeName === 'shop/index') && totalItems > 0 && (
          <View 
            style={{ backgroundColor: colors.primary, borderColor: colors.card }}
            className="absolute -right-2 -top-1 rounded-full min-w-[14px] h-3.5 justify-center items-center px-0.5 border-1"
          >
            <Text className="text-white text-[8px] font-bold">{totalItems}</Text>
          </View>
        )}
      </View>
    );
  };

  const getLabel = (routeName: string) => {
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
  }

  const visibleRoutes = state.routes.filter(route => {
    const { options } = descriptors[route.key] as any;
    // In Expo Router, hidden routes have href: null or tabBarButton strictly returning null
    const isHrefHidden = options.href === null;
    const isButtonHidden = typeof options.tabBarButton === 'function' && options.tabBarButton() === null;
    return !isHrefHidden && !isButtonHidden;
  });

  const TAB_BAR_WIDTH = width - 40; // 20 margin horizontal
  const TAB_WIDTH = TAB_BAR_WIDTH / visibleRoutes.length;

  // Find the index of the focused route among visible routes for pill position
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
          bottom: insets.bottom + 15,
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(255, 255, 255, 1)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }
      ]}
    >
      {/* Animated Pill Background */}
      {visibleIndex !== -1 && (
        <MotiView
          from={{ translateX: 0 }}
          animate={{ 
            translateX: visibleIndex * TAB_WIDTH,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
          }}
          style={[
            styles.pill,
            { 
              width: TAB_WIDTH - 12,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }
          ]}
        />
      )}

      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
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

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.4}
          >
            <View style={styles.iconContainer}>
              {getIcon(route.name, isFocused, isFocused ? colors.primary : (isDark ? '#888' : '#666'))}
              <Text 
                style={[
                  styles.label, 
                  { 
                    color: isFocused ? colors.primary : (isDark ? '#888' : '#666'),
                    fontWeight: isFocused ? '700' : '600',
                    opacity: isFocused ? 1 : 0.8
                  }
                ]}
              >
                {getLabel(route.name)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignSelf: 'center',
    width: width - 40,
    height: 70,
    borderRadius: 35,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
  },
  pill: {
    position: 'absolute',
    height: 58,
    borderRadius: 29,
    marginHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
