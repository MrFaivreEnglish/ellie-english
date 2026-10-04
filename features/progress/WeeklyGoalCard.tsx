import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useTheme } from '../settings/ThemeContext';
import { WEEKLY_GOAL_OPTIONS, setWeeklyGoal, type PracticeWeek } from './weeklyGoal';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type WeeklyGoalCardProps = {
  week: PracticeWeek;
  onGoalChange: (goal: number) => void;
};

// "Revise on 3 days this week". A missed day costs nothing, and the total below never drops.
export default function WeeklyGoalCard({ week, onGoalChange }: WeeklyGoalCardProps) {
  const { colors, isDarkMode } = useTheme();
  const accent = week.goalReached ? colors.success : colors.primary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, boxShadow: `0px 1px 0px ${isDarkMode ? '#2C3340' : '#E6E3DB'}` },
        // Depth comes from a hairline shadow, not a border; only a reached goal gets an outline.
        week.goalReached && { borderWidth: 2, borderColor: colors.success },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: accent + '22' }]}>
          <MaterialIcons name={week.goalReached ? 'emoji-events' : 'event-available'} size={18} color={accent} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>This week</Text>
          <Text style={[styles.subtitle, { color: week.goalReached ? colors.success : colors.secondaryText }]}>
            {week.goalReached
              ? `Goal reached: ${week.daysPractised} days. Well done!`
              : `${week.daysPractised} of ${week.goal} days. Revise on ${week.goal - week.daysPractised} more.`}
          </Text>
        </View>
      </View>

      <View style={styles.daysRow}>
        {week.days.map((practised, index) => {
          const isToday = index === week.todayIndex;
          return (
            <View key={index} style={styles.dayCell} accessible accessibilityLabel={`${DAY_LETTERS[index]}${isToday ? ', today' : ''}, ${practised ? 'practised' : 'not yet'}`}>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: practised ? accent : colors.surface,
                    borderColor: isToday ? accent : practised ? accent : colors.border,
                    borderWidth: isToday ? 2 : 1,
                  },
                ]}
              >
                {practised && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
              <Text style={[styles.dayLetter, { color: isToday ? colors.text : colors.secondaryText }]}>{DAY_LETTERS[index]}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.total, { color: colors.secondaryText }]}>
          {week.totalDaysPractised === 1 ? '1 day' : `${week.totalDaysPractised} days`} practised in total
        </Text>
        <View style={styles.goalPicker} accessibilityRole="radiogroup">
          {WEEKLY_GOAL_OPTIONS.map((option) => {
            const selected = option === week.goal;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  void setWeeklyGoal(option);
                  onGoalChange(option);
                }}
                activeOpacity={0.8}
                style={[
                  styles.goalChip,
                  { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Goal: ${option} days a week`}
              >
                <Text style={[styles.goalChipText, { color: selected ? colors.buttonText ?? '#fff' : colors.text }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLetter: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  total: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  goalPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  goalChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
