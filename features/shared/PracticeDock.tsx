import React from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Text from './ThemedText';
import MaterialIcons from './ThemedMaterialIcon';
import type { ThemeColors } from '../settings/ThemeContext';
import { getWebLessonScale, scaleValue } from './responsiveLayout';

export type PracticeDockMode<K extends string> = {
  key: K;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

export type PracticeDockProps<K extends string> = {
  modes: PracticeDockMode<K>[];
  activeKey: K | null;
  onSelect: (key: K) => void;
  isDesktopWeb: boolean;
  isDarkMode: boolean;
  colors: ThemeColors;
  desktopMaxWidth?: number;
  tabsWidth?: ViewStyle['width'];
  showActiveCollapseIcon?: boolean;


  hidden?: boolean;


  onLayout?: (height: number) => void;



  tabHeight?: number;
  tabLabelFontSize?: number;
};

const ACTIVE_BG = '#516ACC';
const ACTIVE_BG_DARK = '#516ACC';
const ACTIVE_TEXT = '#FFFFFF';
const INACTIVE_BG_LIGHT = '#FFFFFF';
const INACTIVE_BG_DARK = '#0D1A28';

const INACTIVE_TEXT_LIGHT = '#5C5A52';
const INACTIVE_TEXT_DARK = '#FFFFFF';

function PracticeDockInner<K extends string>({
  modes,
  activeKey,
  onSelect,
  isDesktopWeb,
  isDarkMode,
  colors,
  desktopMaxWidth = 800,
  tabsWidth = '100%',
  showActiveCollapseIcon = true,
  hidden = false,
  onLayout,
  tabHeight = 46,
  tabLabelFontSize = 15,
}: PracticeDockProps<K>) {
  const { width, height } = useWindowDimensions();



  const desktopScale = getWebLessonScale(width, height);
  if (hidden) return null;

  return (
    <View
      style={[
        styles.dock,
        {
          paddingVertical: scaleValue(16, desktopScale),
          paddingHorizontal: scaleValue(20, desktopScale),
        },
        {
          backgroundColor: colors.background,
          // Hairline rule separating the mode buttons from the exercise above them.
          // Mobile only — desktop has room to separate them by spacing alone.
          borderTopWidth: isDesktopWeb ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
      onLayout={onLayout ? (event) => onLayout(event.nativeEvent.layout.height) : undefined}
    >
      <View style={[
        styles.tabs,
        { width: tabsWidth },
        { maxWidth: scaleValue(desktopMaxWidth, desktopScale), gap: scaleValue(8, desktopScale) },
      ]}>
        {modes.map((mode) => {
          const isActive = activeKey === mode.key;
          const backgroundColor = isActive
            ? (isDarkMode ? ACTIVE_BG_DARK : ACTIVE_BG)
            : (isDarkMode ? INACTIVE_BG_DARK : INACTIVE_BG_LIGHT);
          const color = isActive ? ACTIVE_TEXT : (isDarkMode ? INACTIVE_TEXT_DARK : INACTIVE_TEXT_LIGHT);
          const borderColor = isActive ? backgroundColor : colors.border;

          return (
            <TouchableOpacity
              key={mode.key}
              activeOpacity={0.76}
              onPress={() => onSelect(mode.key)}
              accessibilityRole="button"
              accessibilityLabel={isActive ? `Close ${mode.label}` : `Open ${mode.label}`}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.tab,
                { borderRadius: scaleValue(12, desktopScale), gap: scaleValue(7, desktopScale) },
                { height: scaleValue(tabHeight, desktopScale), backgroundColor, borderColor },
              ]}
            >
              <MaterialIcons
                name={isActive && showActiveCollapseIcon ? 'arrow-downward' : mode.icon}
                size={scaleValue(isActive && showActiveCollapseIcon ? 17 : 14, desktopScale)}
                color={color}
              />
              <Text
                style={[
                  styles.tabText,
                  { fontSize: scaleValue(tabLabelFontSize, desktopScale) },
                  isActive && styles.tabTextActive,
                  { color },
                ]}
                numberOfLines={1}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const PracticeDock = React.memo(PracticeDockInner) as typeof PracticeDockInner;
export default PracticeDock;

const styles = StyleSheet.create({
  dock: {
    flexShrink: 0,
    zIndex: 5,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  tabs: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },


  tab: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  tabText: {
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
});
