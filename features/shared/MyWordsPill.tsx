import { StyleSheet, TouchableOpacity } from 'react-native';
import Text from './ThemedText';
import MaterialIcons from './ThemedMaterialIcon';
import { useTheme } from '../settings/ThemeContext';
import { uiRadii } from './uiPrimitives';

type MyWordsPillProps = {
  onPress: () => void;
  // Icon only, for rows too narrow for the label.
  iconOnly?: boolean;
  backgroundColor?: string;
  borderColor?: string;
};

// A small "My words" shortcut that sits beside another control, styled like it.
export default function MyWordsPill({ onPress, iconOnly = false, backgroundColor, borderColor }: MyWordsPillProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.84}
      style={[
        styles.pill,
        iconOnly && styles.pillIconOnly,
        { backgroundColor: backgroundColor ?? colors.card, borderColor: borderColor ?? colors.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open My words: what you've learnt and what to review"
    >
      <MaterialIcons name="menu-book" size={18} color={colors.success} />
      {!iconOnly && <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>My words</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: uiRadii.control,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pillIconOnly: { width: 42, paddingHorizontal: 0, justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '800' },
});
