import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../shared/ThemedText';
import { useTheme } from '../settings/ThemeContext';
import type { Word } from '../../types/VocabularyTypes';

// The presentational blocks of the Home screen (see HANDOFF-home.md). They only draw what
// HomeScreen hands them; all the data and routing stays there.

const SHADOW_SOFT = '#DCE3EE';
const TEAL = '#34C8B4';
const TEAL_EDGE = '#1F9C8B';

const useCardStyle = () => {
  const { colors, isDarkMode } = useTheme();
  return {
    backgroundColor: colors.card,
    boxShadow: `0px 3px 0px ${isDarkMode ? '#2C3340' : SHADOW_SOFT}`,
  } as const;
};

type TactileButtonProps = {
  label: string;
  color: string;
  edge: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

// A button with a hard bottom edge that sinks when pressed.
export function TactileButton({ label, color, edge, onPress, accessibilityLabel }: TactileButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.tactile,
        {
          backgroundColor: color,
          boxShadow: pressed ? `0px 1px 0px ${edge}` : `0px 4px 0px ${edge}`,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}
    >
      <Text style={styles.tactileLabel}>{label}</Text>
    </Pressable>
  );
}

type MilestoneBannerProps = {
  milestone: number;
  nextMilestone: number;
  sampleWords: Word[];
  extraCount: number;
  onDismiss: () => void;
  onOpen: () => void;
};

export function MilestoneBanner({ milestone, nextMilestone, sampleWords, extraCount, onDismiss, onOpen }: MilestoneBannerProps) {
  return (
    <View style={[styles.banner, { backgroundColor: TEAL, boxShadow: `0px 4px 0px ${TEAL_EDGE}` }]}>
      <Pressable
        onPress={onOpen}
        style={styles.bannerBody}
        accessibilityRole="button"
        accessibilityLabel={`You have learnt ${milestone} words. Open My words`}
      >
      <Text style={styles.bannerMedal}>🏅</Text>
      <View style={styles.bannerCopy}>
        <Text style={styles.bannerTitle} numberOfLines={1}>You've learnt {milestone} words!</Text>
        <Text style={styles.bannerSub} numberOfLines={1}>Next milestone: {nextMilestone}</Text>
      </View>
      <View style={styles.bannerChips}>
        {sampleWords.slice(0, 3).map((word) => (
          <View key={`${word.english}|${word.french}`} style={styles.bannerChip}>
            <Text style={styles.bannerChipText} numberOfLines={1}>{word.french}</Text>
          </View>
        ))}
        {extraCount > 0 && <Text style={styles.bannerMore}>+{extraCount}</Text>}
      </View>
      </Pressable>
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.bannerClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss milestone message"
      >
        <Text style={styles.bannerCloseText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const SECTION = {
  vocabulary: { text: '#0F9F8F', edge: '#0B7468', label: 'VOCABULARY' },
  grammar: { text: '#1A7FD4', edge: '#13609F', label: 'GRAMMAR' },
} as const;

type ContinueCardProps = {
  type: 'vocabulary' | 'grammar';
  title: string;
  onContinue: () => void;
};

// Where the student left off: the lesson's title and one button.
export function ContinueCard({ type, title, onContinue }: ContinueCardProps) {
  const { colors } = useTheme();
  const section = SECTION[type];
  const cardStyle = useCardStyle();

  return (
    <View style={[styles.continueCard, cardStyle]}>
      <View style={styles.continueLeft}>
        <Text style={[styles.eyebrow, { color: section.text }]}>CONTINUE · {section.label}</Text>
        <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
      </View>
      <TactileButton
        label="Continue"
        color={section.text}
        edge={section.edge}
        onPress={onContinue}
        accessibilityLabel={'Continue ' + title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tactile: {
    minHeight: 40,
    minWidth: 120,
    paddingHorizontal: 28,
    paddingVertical: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  tactileLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 6,
  },
  bannerBody: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerMedal: { fontSize: 26 },
  bannerCopy: { flexShrink: 1, minWidth: 0 },
  bannerTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  bannerSub: { color: '#FFFFFF', fontWeight: '600', fontSize: 13, opacity: 0.9 },
  bannerChips: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap', overflow: 'hidden' },
  bannerChip: { backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1 },
  bannerChipText: { color: '#0F9F8F', fontWeight: '800', fontSize: 13 },
  bannerMore: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  bannerClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bannerCloseText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },

  continueCard: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  continueLeft: { flex: 1, minWidth: 0, gap: 6 },
  eyebrow: { fontWeight: '800', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  continueTitle: { fontWeight: '900', fontSize: 24, lineHeight: 29 },


});
