import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { MaterialIcons as NativeMaterialIcons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../settings/ThemeContext';

type NativeIconProps = React.ComponentProps<typeof NativeMaterialIcons>;
type PixelGlyphName = keyof typeof PIXEL_GLYPHS;





const PIXEL_GLYPHS = {
  left: ['000000000', '000100000', '001000000', '010000000', '111111110', '010000000', '001000000', '000100000', '000000000'],
  right: ['000000000', '000001000', '000000100', '000000010', '011111111', '000000010', '000000100', '000001000', '000000000'],
  up: ['000010000', '000111000', '001010100', '010010010', '000010000', '000010000', '000010000', '000010000', '000000000'],
  down: ['000000000', '000010000', '000010000', '000010000', '000010000', '010010010', '001010100', '000111000', '000010000'],
  check: ['000000000', '000000011', '000000110', '100001100', '110011000', '011110000', '001100000', '000000000', '000000000'],
  close: ['100000001', '010000010', '001000100', '000101000', '000010000', '000101000', '001000100', '010000010', '100000001'],
  heart: ['000000000', '011000110', '111101111', '111111111', '111111111', '011111110', '001111100', '000111000', '000010000'],
  heartOutline: ['000000000', '011000110', '100101001', '100010001', '100000001', '010000010', '001000100', '000101000', '000010000'],
  pencil: ['000000110', '000001111', '000011110', '000111100', '001111000', '011110000', '111100000', '111000000', '100000000'],
  cards: ['001111110', '001000010', '111000010', '101111110', '101000000', '101000000', '111111100', '000000000', '000000000'],
  book: ['110000011', '101000101', '100101001', '100101001', '100101001', '100101001', '101000101', '111101111', '110000011'],
  gear: ['001010100', '011111110', '110111011', '111000111', '011000110', '111000111', '110111011', '011111110', '001010100'],
  search: ['001111000', '010001000', '100000100', '100000100', '100000100', '010001100', '001111110', '000000011', '000000001'],
  sparkle: ['000010000', '000010000', '010010010', '001111100', '111111111', '001111100', '010010010', '000010000', '000010000'],
  palette: ['001111000', '011111100', '110110110', '111111111', '110111011', '111111111', '011111110', '001111100', '000110000'],
  star: ['000010000', '000111000', '110111011', '011111110', '001111100', '011111110', '110101011', '100000001', '000000000'],
  lock: ['001111100', '010000010', '010000010', '011111110', '110000011', '110010011', '110111011', '110000011', '111111111'],
  play: ['110000000', '111100000', '111111000', '111111110', '111111111', '111111110', '111111000', '111100000', '110000000'],
  shuffle: ['110000001', '011000011', '001100111', '000111110', '000011000', '001101100', '011000110', '110000011', '110000001'],
  swap: ['000001000', '000000100', '111111110', '000000100', '000001000', '001000000', '010000000', '011111111', '010000000'],
  volume: ['000100000', '001100100', '011101010', '111101001', '111101001', '111101001', '011101010', '001100100', '000100000'],
  person: ['000111000', '001111100', '001111100', '001111100', '000111000', '001111100', '011111110', '111111111', '111111111'],
  fire: ['000010000', '000110000', '001110100', '011111100', '111111110', '111111111', '111100111', '011111110', '001111100'],
  trophy: ['111111111', '101111101', '101111101', '011111110', '001111100', '000111000', '000111000', '001111100', '011111110'],
  warning: ['000010000', '000111000', '001101100', '001101100', '011101110', '011111110', '110101011', '111111111', '000000000'],
  plus: ['000000000', '000010000', '000010000', '000010000', '111111111', '000010000', '000010000', '000010000', '000000000'],
  trash: ['001111100', '000111000', '111111111', '110000011', '110101011', '110101011', '110101011', '110000011', '111111111'],
  refresh: ['000111100', '001100110', '011000000', '110000001', '110001111', '000000110', '011001100', '001111000', '000100000'],
  flag: ['110000000', '111111100', '110000110', '111111100', '110000000', '110000000', '110000000', '110000000', '110000000'],
  image: ['111111111', '100000001', '101100001', '101100001', '100001101', '100011111', '101111111', '100000001', '111111111'],
  device: ['011111110', '110000011', '110000011', '110000011', '110000011', '110000011', '110000011', '110010011', '011111110'],
  clock: ['001111100', '011000110', '110010011', '110010011', '110011111', '110000011', '110000011', '011000110', '001111100'],
  checklist: ['010011111', '110000000', '000000000', '010011111', '110000000', '000000000', '010011111', '110000000', '000000000'],
  list: ['110111111', '110000000', '000000000', '110111111', '110000000', '000000000', '110111111', '110000000', '000000000'],
  grid: ['111011101', '101010101', '111011101', '000000000', '111011101', '101010101', '111011101', '000000000', '000000000'],
  tune: ['001000000', '111111111', '001000000', '000000100', '111111111', '000000100', '000100000', '111111111', '000100000'],
  rule: ['000000000', '111111111', '100101011', '100000001', '111111111', '000000000', '000000000', '000000000', '000000000'],
  calendar: ['010000010', '111111111', '100000001', '101010101', '100000001', '101010101', '100000001', '111111111', '000000000'],
  vibration: ['100000001', '010111010', '010101010', '110101011', '110101011', '010101010', '010111010', '100000001', '000000000'],
  save: ['111111110', '110001010', '110001010', '111111110', '110000011', '110111011', '110101011', '110111011', '111111111'],
  gamepad: ['000000000', '001111100', '011111110', '110111011', '111010111', '110111011', '010000010', '010000010', '000000000'],
  bookmark: ['011111110', '010000010', '010000010', '010000010', '010000010', '010000010', '010101010', '011000110', '000000000'],
  face: ['001111100', '011000110', '110000011', '110101011', '110000011', '110111011', '111000111', '011000110', '001111100'],
} as const;

const ICON_ALIASES: Record<string, PixelGlyphName> = {
  'arrow-back': 'left', 'chevron-left': 'left',
  'arrow-forward': 'right', 'chevron-right': 'right', 'play-arrow': 'play',
  'keyboard-arrow-down': 'down', 'expand-more': 'down', 'arrow-downward': 'down',
  'expand-less': 'up',
  check: 'check', done: 'check', 'check-circle': 'check', 'cloud-done': 'check',
  close: 'close', 'error-outline': 'warning',
  favorite: 'heart', 'favorite-border': 'heartOutline',
  edit: 'pencil', 'edit-note': 'pencil',
  style: 'cards', 'view-carousel': 'cards',
  book: 'book', 'menu-book': 'book', 'library-books': 'book', 'auto-stories': 'book',
  settings: 'gear', tune: 'tune', rule: 'rule',
  search: 'search', 'search-off': 'close',
  'auto-awesome': 'sparkle', star: 'star', 'workspace-premium': 'trophy', 'emoji-events': 'trophy',
  palette: 'palette', lock: 'lock', shuffle: 'shuffle', 'swap-horiz': 'swap',
  'volume-up': 'volume', 'record-voice-over': 'volume',
  'account-circle': 'person', 'alternate-email': 'person',
  whatshot: 'fire', 'local-fire-department': 'fire', bolt: 'fire',
  add: 'plus', 'add-circle-outline': 'plus',
  'delete-outline': 'trash', refresh: 'refresh', sync: 'refresh', flag: 'flag',
  'image-not-supported': 'image',
  'brightness-6': 'sparkle', today: 'calendar', vibration: 'vibration',
  'stay-current-portrait': 'device', 'phone-iphone': 'device', devices: 'device', android: 'device', 'add-to-home-screen': 'device',
  timer: 'clock', save: 'save', spellcheck: 'check', 'sports-esports': 'gamepad',
  checklist: 'checklist', 'view-list': 'list', 'view-agenda': 'list', 'grid-view': 'grid',
  'delete-sweep': 'trash', 'bookmark-border': 'bookmark', 'sentiment-dissatisfied': 'face',
  'tips-and-updates': 'sparkle', logout: 'right', 'restart-alt': 'refresh', 'open-in-new': 'right',
  publish: 'up', 'ios-share': 'up', 'upload-file': 'up', 'content-copy': 'cards', 'inventory-2': 'cards',
};

function PixelGlyph({ name, size, color, style }: {
  name: PixelGlyphName;
  size: number;
  color: string;
  style?: NativeIconProps['style'];
}) {
  const pattern = PIXEL_GLYPHS[name];
  const cells: React.ReactNode[] = [];

  pattern.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      if (cell === '1') {
        cells.push(<Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
      }
    });
  });

  return (
    <View style={[{ width: size, height: size }, style as ViewStyle]}>
      <Svg width={size} height={size} viewBox="0 0 9 9">
        {cells}
      </Svg>
    </View>
  );
}

export default function ThemedMaterialIcon(props: NativeIconProps) {
  const { isShinyEllieMode } = useTheme();
  const { name, size = 24, color = '#000000', style } = props;
  const glyph = ICON_ALIASES[String(name)];

  if (!isShinyEllieMode || !glyph) {
    return <NativeMaterialIcons {...props} />;
  }

  return (
    <PixelGlyph
      name={glyph}
      size={typeof size === 'number' ? size : Number(size) || 24}
      color={String(color)}
      style={style}
    />
  );
}

export type MaterialIconName = NativeIconProps['name'];
