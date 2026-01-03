// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  'chevron.left.forwardslash.chevron.right': 'code',
  'arrow.right.circle.fill': 'arrow-circle-right',

  // User & Profile
  'person.circle.fill': 'account-circle',
  'person.fill': 'person',
  'camera.fill': 'camera-alt',
  'pencil': 'edit',
  'lock.fill': 'lock',
  'hand.raised.fill': 'pan-tool',
  'rectangle.portrait.and.arrow.right': 'logout',

  // Communication
  'paperplane.fill': 'send',
  'bubble.left.and.text.bubble.right.fill': 'chat-bubble',
  'text.bubble': 'chat-bubble-outline',
  'text.bubble.fill': 'chat-bubble',

  // Media & Audio
  'headphones': 'headphones',
  'mic.fill': 'mic',
  'speaker.wave.2.fill': 'volume-up',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'play.circle.fill': 'play-circle-filled',
  'pause.circle.fill': 'pause-circle-filled',
  'stop.circle.fill': 'stop-circle',
  'waveform': 'graphic-eq',

  // Education & Learning
  'book.fill': 'book',
  'book.pages.fill': 'menu-book',
  'graduationcap.fill': 'school',
  'pencil.and.list.clipboard': 'edit-note',
  'doc.text.fill': 'description',

  // System & Utility
  'cpu': 'memory',
  'cpu.fill': 'memory',
  'brain': 'psychology',
  'magnifyingglass': 'search',
  'calendar': 'event',
  'clock': 'access-time',
  'trash': 'delete-outline',
  'trash.fill': 'delete',
  'bookmark': 'bookmark-border',

  // Notifications & Settings
  'bell.fill': 'notifications',
  'moon.fill': 'dark-mode',
  'star.fill': 'star',

  // Status & Alerts
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.circle': 'error-outline',
  'info.circle': 'info-outline',
  'info.circle.fill': 'info',
  'questionmark.circle.fill': 'help',
  'xmark.circle.fill': 'cancel',

  // Social Login
  'g.circle.fill': 'circle',
  'f.circle.fill': 'circle',
  'apple.logo': 'apple',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
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
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
