import { StyleSheet, TouchableOpacity } from 'react-native';
import Text from './ThemedText';
import MaterialIcons from './ThemedMaterialIcon';
import { useTheme } from '../settings/ThemeContext';

// One small "My words" shortcut that sits on the same row as a screen's back button, instead
// of a full-width row of its own.
export default function MyWordsPill({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel="Open My words: what you've learnt and what to review"
    >
      <MaterialIcons name="menu-book" size={18} color={colors.success} />
      <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>My words</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontSize: 14, fontWeight: '800' },
});
