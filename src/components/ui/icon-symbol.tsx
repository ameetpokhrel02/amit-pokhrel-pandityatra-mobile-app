import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { OpaqueColorValue, StyleProp, TextStyle, Platform } from 'react-native';

// Add your SFSymbol to MaterialCommunityIcons mapping here.
const MAPPING = {
  // See MaterialCommunityIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'message.fill': 'message',
  'info.circle': 'information',
  'sparkles': 'creation',
  'arrow.up.circle.fill': 'arrow-up-circle',
  'person.fill': 'account',
  'gearshape.fill': 'cog',
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and are mapped to MaterialIcons on other platforms.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialCommunityIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
