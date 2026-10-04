import React from 'react';
import { Svg, Circle } from 'react-native-svg';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../shared/ThemedText';
import { useTheme } from '../settings/ThemeContext';
import { DAILY_GOAL, BONUS_DAY_XP, type DayState, type GoalWeek } from '../progress/dailyGoal';
import { getMilestoneProgress } from '../progress/milestones';
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
};

export function MilestoneBanner({ milestone, nextMilestone, sampleWords, extraCount, onDismiss }: MilestoneBannerProps) {
  return (
    <View style={[styles.banner, { backgroundColor: TEAL, boxShadow: `0px 4px 0px ${TEAL_EDGE}` }]}>
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
  nextWord?: string;
  wide: boolean;
  onContinue: () => void;
};

export function ContinueCard({ type, title, nextWord, wide, onContinue }: ContinueCardProps) {
  const { colors } = useTheme();
  const section = SECTION[type];
  const cardStyle = useCardStyle();

  return (
    <View style={[styles.continueCard, cardStyle, !wide && styles.continueCardNarrow]}>
      <View style={styles.continueLeft}>
        <Text style={[styles.eyebrow, { color: section.text }]}>CONTINUE · {section.label}</Text>
        <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
        <View style={styles.continueButtonRow}>
          <TactileButton
            label="Continue"
            color={section.text}
            edge={section.edge}
            onPress={onContinue}
            accessibilityLabel={`Continue ${title}`}
          />
        </View>
      </View>
      {wide && (
        <View style={styles.preview} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {type === 'vocabulary' ? (
            <>
              <View style={[styles.stackCard, { backgroundColor: '#BDEFE7', transform: [{ rotate: '6deg' }] }]} />
              <View style={[styles.stackCard, { backgroundColor: '#8EE3D5', transform: [{ rotate: '2deg' }] }]} />
              <View style={[styles.stackCard, styles.stackFront, { backgroundColor: TEAL, transform: [{ rotate: '-3deg' }] }]}>
                <Text style={styles.stackWord} numberOfLines={2} adjustsFontSizeToFit>{nextWord ?? 'le printemps'}</Text>
                <Text style={styles.stackHint}>tap to flip</Text>
              </View>
            </>
          ) : (
            <View style={[styles.stackCard, styles.stackFront, { backgroundColor: '#4DA6F2' }]}>
              <Text style={styles.grammarSentence}>Elle ___ allée au marché.</Text>
              <View style={styles.grammarChips}>
                <View style={styles.grammarChip}><Text style={styles.grammarChipText}>est</Text></View>
                <View style={styles.grammarChip}><Text style={styles.grammarChipText}>a</Text></View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
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
      {!week.goalReached && week.todayIndex >= 0 && (
        <Text style={[styles.weekHint, { color: colors.secondaryText }]}>
          {week.todayCount >= DAILY_GOAL
            ? 'Today counts!'
            : `${week.todayCount}/${DAILY_GOAL} answers today`}
        </Text>
      )}
    </View>
  );
}

export function MyWordsCard({ learnt, onPress }: { learnt: number; onPress: () => void }) {
  const { colors } = useTheme();
  const cardStyle = useCardStyle();
  const { track, next, fraction } = getMilestoneProgress(learnt);
  const nextIndex = track.indexOf(next);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.myWordsCard, cardStyle]}
      accessibilityRole="link"
      accessibilityLabel={`My words. ${learnt} words learnt, next badge at ${next}`}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>My words →</Text>
        <View style={styles.learntRow}>
          <Text style={[styles.learntCount, { color: colors.text }]}>{learnt}</Text>
          <Text style={[styles.learntLabel, { color: colors.secondaryText }]}> learnt</Text>
        </View>
      </View>
      <View style={styles.track}>
        {track.map((value, index) => {
          const reached = learnt >= value;
          // The line into a circle: full once reached, part-filled for the next one.
          const lineFill = reached ? 1 : index === nextIndex ? fraction : 0;
          return (
            <React.Fragment key={value}>
              {index > 0 && (
                <View style={[styles.trackLine, { backgroundColor: colors.border }]}>
                  <View style={[styles.trackLineFill, { width: `${Math.round(lineFill * 100)}%` }]} />
                </View>
              )}
              <View
                style={[
                  styles.milestone,
                  reached
                    ? { backgroundColor: TEAL }
                    : { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.milestoneText, { color: reached ? '#FFFFFF' : colors.secondaryText }]} numberOfLines={1} adjustsFontSizeToFit>
                  {value}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tactile: {
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  tactileLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 17 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 6,
  },
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
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  continueCardNarrow: { padding: 16 },
  continueLeft: { flex: 1, minWidth: 0, gap: 6 },
  eyebrow: { fontWeight: '800', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  continueTitle: { fontWeight: '900', fontSize: 26, lineHeight: 31 },
  continueButtonRow: { marginTop: 8 },
  preview: { width: 240, maxWidth: '40%', height: 130, alignItems: 'center', justifyContent: 'center' },
  stackCard: {
    position: 'absolute',
    width: '86%',
    height: 110,
    borderRadius: 18,
  },
  stackFront: { alignItems: 'center', justifyContent: 'center', padding: 12, gap: 4 },
  stackWord: { color: '#FFFFFF', fontWeight: '900', fontSize: 24, textAlign: 'center' },
  stackHint: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, opacity: 0.9 },
  grammarSentence: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  grammarChips: { flexDirection: 'row', gap: 8, marginTop: 6 },
  grammarChip: { backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 5 },
  grammarChipText: { color: '#1A7FD4', fontWeight: '800', fontSize: 15 },

  weekCard: { flexGrow: 1, borderRadius: 22, padding: 18, gap: 12 },
  myWordsCard: { flexGrow: 1, borderRadius: 22, padding: 18, gap: 18, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontWeight: '900', fontSize: 18 },
  weekStatus: { fontWeight: '800', fontSize: 14, flexShrink: 1 },
  weekHint: { fontWeight: '600', fontSize: 13, textAlign: 'center' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayCell: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  dayLabel: { fontSize: 12 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayCheck: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, lineHeight: 22 },
  dayStar: { color: '#FFE27A', fontWeight: '900', fontSize: 18, lineHeight: 22 },
  daySlotText: { fontWeight: '800', fontSize: 11 },
  dashed: { borderWidth: 2, borderStyle: 'dashed' },

  learntRow: { flexDirection: 'row', alignItems: 'baseline' },
  learntCount: { fontWeight: '900', fontSize: 26 },
  learntLabel: { fontWeight: '700', fontSize: 14 },
  track: { flexDirection: 'row', alignItems: 'center' },
  milestone: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  milestoneText: { fontWeight: '800', fontSize: 12, maxWidth: 28, textAlign: 'center' },
  trackLine: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  trackLineFill: { height: 4, backgroundColor: TEAL },
});
