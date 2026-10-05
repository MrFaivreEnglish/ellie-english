import { Svg, Circle } from 'react-native-svg';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useTheme } from '../settings/ThemeContext';
import { BONUS_DAY_XP, type DayState, type GoalWeek } from '../progress/dailyGoal';
import type { Word } from '../../types/VocabularyTypes';

// The presentational blocks of the Home screen (see HANDOFF-home.md). They only draw what
// HomeScreen hands them; all the data and routing stays there.

const SHADOW_SOFT = '#DCE3EE';
const TEAL = '#34C8B4';
const TEAL_EDGE = '#1F9C8B';
const CORAL = '#EF7A6B';
const CORAL_EDGE = '#D6594A';
const PURPLE = '#8B6CF0';
const PURPLE_EDGE = '#6A4FC9';

const useCardStyle = () => {
  const { colors, isDarkMode } = useTheme();
  return {
    backgroundColor: colors.card,
    boxShadow: `0px 3px 0px ${isDarkMode ? '#2C3340' : SHADOW_SOFT}`,
  } as const;
};

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

// Where the student left off. The whole card is the button: icon, title, arrow.
export function ContinueCard({ type, title, onContinue }: ContinueCardProps) {
  const { colors, isDarkMode } = useTheme();
  const section = SECTION[type];
  const cardStyle = useCardStyle();

  return (
    <TouchableOpacity
      onPress={onContinue}
      activeOpacity={0.85}
      style={[styles.continueCard, cardStyle]}
      accessibilityRole="button"
      accessibilityLabel={'Continue ' + title}
    >
      <View style={[styles.continueIcon, { backgroundColor: isDarkMode ? section.text + '33' : section.text + '1F' }]}>
        <MaterialIcons name={type === 'grammar' ? 'edit' : 'style'} size={26} color={section.text} />
      </View>
      <View style={styles.continueLeft}>
        <Text style={[styles.eyebrow, { color: section.text }]}>Continue</Text>
        <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.continueMeta, { color: colors.secondaryText }]}>{type === 'grammar' ? 'Grammar' : 'Vocabulary'}</Text>
      </View>
      <MaterialIcons name="arrow-forward" size={26} color={colors.secondaryText} />
    </TouchableOpacity>
  );
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const describeDay = (name: string, state: DayState, isToday: boolean) => {
  const when = isToday ? `${name} (today)` : name;
  switch (state) {
    case 'goal': return `${when}, goal reached`;
    case 'bonus': return `${when}, bonus day, +${BONUS_DAY_XP} XP`;
    case 'today': return `${when}, in progress`;
    case 'missed': return `${when}, missed`;
    case 'bonusSlot': return `${when}, bonus day still open, +${BONUS_DAY_XP} XP`;
    default: return `${when}, not yet`;
  }
};

function DayCircle({ state, progress }: { state: DayState; progress: number }) {
  const { colors, isDarkMode } = useTheme();
  if (state === 'goal') {
    return (
      <View style={[styles.dayCircle, { backgroundColor: CORAL, boxShadow: `0px 2px 0px ${CORAL_EDGE}` }]}>
        <Text style={styles.dayCheck}>✓</Text>
      </View>
    );
  }
  if (state === 'bonus') {
    return (
      <View style={[styles.dayCircle, { backgroundColor: PURPLE, boxShadow: `0px 2px 0px ${PURPLE_EDGE}` }]}>
        <Text style={styles.dayStar}>★</Text>
      </View>
    );
  }
  if (state === 'today') {
    // A 4px ring (36px outside, 28px inside) that fills clockwise as today's answers add up.
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    return (
      <View style={styles.dayCircle}>
        <Svg width={36} height={36} style={StyleSheet.absoluteFill}>
          <Circle cx={18} cy={18} r={radius} stroke="#FBDCD7" strokeWidth={4} fill={colors.card} />
          <Circle
            cx={18}
            cy={18}
            r={radius}
            stroke={CORAL}
            strokeWidth={4}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
            rotation="-90"
            origin="18, 18"
          />
        </Svg>
      </View>
    );
  }
  if (state === 'missed') {
    return <View style={[styles.dayCircle, { backgroundColor: isDarkMode ? '#2C3340' : '#F1F5F9' }]} />;
  }
  if (state === 'bonusSlot') {
    return (
      <View style={[styles.dayCircle, styles.dashed, { borderColor: '#CBD5E1' }]}>
        <Text style={[styles.daySlotText, { color: colors.secondaryText }]}>+{BONUS_DAY_XP}</Text>
      </View>
    );
  }
  return <View style={[styles.dayCircle, styles.dashed, { borderColor: SHADOW_SOFT }]} />;
}

export function WeekCard({ week, compact = false }: { week: GoalWeek; compact?: boolean }) {
  const { colors, isDarkMode } = useTheme();
  const cardStyle = useCardStyle();

  return (
    <View style={[styles.weekCard, cardStyle]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Your week</Text>
        {week.goalReached ? (
          <Text style={[styles.weekStatus, { color: isDarkMode ? '#B7A3FF' : PURPLE_EDGE }]} numberOfLines={1}>
            {compact ? `Goal reached! ★ +${BONUS_DAY_XP} XP` : `Goal reached! ★ +${BONUS_DAY_XP} XP per extra day`}
          </Text>
        ) : (
          <Text style={[styles.weekStatus, { color: '#C2483A' }]} numberOfLines={1}>
            {week.daysHit} of {week.goal} days
          </Text>
        )}
      </View>
      <View style={styles.daysRow}>
        {week.states.map((state, index) => {
          const isToday = index === week.todayIndex;
          return (
            <View
              key={DAY_NAMES[index]}
              style={styles.dayCell}
              accessible
              accessibilityLabel={describeDay(DAY_NAMES[index], state, isToday)}
            >
              <DayCircle state={state} progress={week.todayProgress} />
              <Text
                style={[
                  styles.dayLabel,
                  { color: isToday ? colors.text : colors.secondaryText, fontWeight: isToday ? '800' : '600' },
                ]}
                numberOfLines={1}
              >
                {isToday ? 'Today' : DAY_LABELS[index]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  weekCard: { flexGrow: 1, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 18, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontWeight: '900', fontSize: 18 },
  weekStatus: { fontWeight: '800', fontSize: 14, flexShrink: 1 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayCell: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  dayLabel: { fontSize: 12 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayCheck: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, lineHeight: 22 },
  dayStar: { color: '#FFE27A', fontWeight: '900', fontSize: 18, lineHeight: 22 },
  daySlotText: { fontWeight: '800', fontSize: 11 },
  dashed: { borderWidth: 2, borderStyle: 'dashed' },

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
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  continueIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  continueMeta: { fontWeight: '600', fontSize: 14, lineHeight: 18 },
  continueLeft: { flex: 1, minWidth: 0, gap: 6 },
  eyebrow: { fontWeight: '800', fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase' },
  continueTitle: { fontWeight: '900', fontSize: 22, lineHeight: 27 },


});
