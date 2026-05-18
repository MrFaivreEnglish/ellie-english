import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exitImmersiveOpaque } from '../lib/immersive';
import { useFonts } from 'expo-font';
import { getLearnedFlashcardSummary } from '../utils/flashcardProgressStorage';
import { getGrammarProgressSummary } from '../utils/grammarProgressStorage';
import { getMenuCopy } from '../utils/menuCopy';
import { useAccount } from '../contexts/AccountContext';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const shinyCardColors = ['#f4b942', '#ef476f', '#06d6a0', '#7b61ff', '#5d77f8ff'];
const DAILY_GREEN = '#58CC02';
const DAILY_GREEN_DARK = '#3F9700';
const DAILY_GREEN_SOFT = '#E5F8D2';
const DAILY_BLUE = '#1CB0F6';
const DAILY_BLUE_SOFT = '#DDF4FF';

const cleanDisplayName = (value: string) => value.trim().replace(/\s+/g, ' ');

const getFirstName = (value: string) => {
  const cleaned = cleanDisplayName(value);
  if (!cleaned) return '';

  return cleaned.split(' ')[0];
};

const getInitial = (value: string) => getFirstName(value).charAt(0).toUpperCase() || 'E';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode, isShinyEllieMode, isTodayCardEnabled, isAndroidStatusBarEnabled, menuLanguage } = useTheme();
  const { isConfigured: isAccountConfigured, isLoading: isAccountLoading, lastSyncAt, session } = useAccount();
  const copy = getMenuCopy(menuLanguage).home;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const homeHeaderTopPadding = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 24)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top + 16
      : 16;
  const [todayGrammarAnswerCount, setTodayGrammarAnswerCount] = React.useState(0);
  const [todayLearntCount, setTodayLearntCount] = React.useState(0);
  const dailyPracticeGoal = 10;
  const todaySavedProgressCount = todayGrammarAnswerCount + todayLearntCount;
  const savedItemsRemaining = Math.max(0, dailyPracticeGoal - todaySavedProgressCount);
  const todayProgress = Math.min(100, Math.round((todaySavedProgressCount / dailyPracticeGoal) * 100));
  const localizedCategories = React.useMemo(() => [
    {
      title: copy.grammarTitle,
      icon: 'edit' as MaterialIconName,
      description: copy.grammarDescription,
      color: '#45B7D1',
      route: 'Grammar'
    },
    {
      title: copy.vocabularyTitle,
      icon: 'style' as MaterialIconName,
      description: copy.vocabularyDescription,
      color: '#4ECDC4',
      route: 'Vocabulary'
    },
    {
      title: copy.lessonsTitle,
      icon: 'menu-book' as MaterialIconName,
      description: copy.lessonsDescription,
      color: '#b29cd9',
      route: 'Lessons'
    },
    {
      title: copy.settingsTitle,
      icon: 'settings' as MaterialIconName,
      description: copy.settingsDescription,
      color: '#91a3b0',
      route: 'Settings'
    }
  ], [copy]);
  const todayStatus =
    todaySavedProgressCount >= dailyPracticeGoal
      ? copy.dailyTargetReached
      : todaySavedProgressCount > 0
        ? `${savedItemsRemaining} ${savedItemsRemaining === 1 ? copy.practiceRemainingSingular : copy.practiceRemainingPlural} ${copy.toDailyTarget}`
        : copy.noPracticeYet;
  const todayAccentColor = todaySavedProgressCount >= dailyPracticeGoal ? DAILY_GREEN : DAILY_BLUE;
  const todayAccentSoft = todaySavedProgressCount >= dailyPracticeGoal ? DAILY_GREEN_SOFT : DAILY_BLUE_SOFT;

  const isDesktop = Platform.OS !== 'web' && width > 0 && width >= 640;
  const isNarrowHeader = width < 370;
  const accountDisplayName = cleanDisplayName(session?.user.displayName || session?.user.username || '');
  const accountFirstName = getFirstName(accountDisplayName);
  const welcomeText = accountFirstName ? `Welcome, ${accountFirstName}!` : copy.welcome;
  const accountPillLabel = isAccountLoading
    ? 'Account'
    : session
      ? isNarrowHeader ? getInitial(accountDisplayName) : accountFirstName || 'Account'
      : isAccountConfigured
        ? isNarrowHeader ? 'Backup' : 'Account backup'
        : isNarrowHeader ? 'Device' : 'This device';
  const accountPillIcon: React.ComponentProps<typeof MaterialIcons>['name'] = isAccountLoading
    ? 'account-circle'
    : session
      ? 'cloud-done'
      : isAccountConfigured
        ? 'person-add'
        : 'phone-iphone';

  // Preload icon font to prevent delayed icons and layout shift.
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      exitImmersiveOpaque('#000000', 'light', Platform.OS !== 'android' || isAndroidStatusBarEnabled).catch(() => {});
      if (!isTodayCardEnabled) {
        return () => {
          active = false;
        };
      }

      Promise.all([getGrammarProgressSummary(), getLearnedFlashcardSummary()]).then(([grammarSummary, learnedSummary]) => {
        if (!active) return;
        setTodayGrammarAnswerCount(grammarSummary.correctToday);
        setTodayLearntCount(learnedSummary.learnedToday);
      });

      return () => {
        active = false;
      };
    }, [isAndroidStatusBarEnabled, isTodayCardEnabled, lastSyncAt])
  );

  // Do not render until icons are ready.
  if (!fontsLoaded) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.card,
            paddingTop: homeHeaderTopPadding
          }
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{welcomeText}</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{copy.subtitle}</Text>
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('Account')}
            style={[
              styles.accountPill,
              {
                backgroundColor: session ? colors.successSoft : colors.primarySoft,
                borderColor: session ? colors.success : colors.primary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open account"
          >
            {session ? (
              <View style={[styles.accountInitial, { backgroundColor: colors.success }]}>
                <Text style={styles.accountInitialText}>{getInitial(accountDisplayName)}</Text>
              </View>
            ) : (
              <MaterialIcons
                name={accountPillIcon}
                size={18}
                color={colors.primary}
              />
            )}
            <Text
              style={[
                styles.accountPillText,
                { color: session ? (colors.successText ?? colors.success) : colors.primary },
              ]}
              numberOfLines={1}
            >
              {accountPillLabel}
            </Text>
            {session && !isNarrowHeader && (
              <MaterialIcons name="expand-more" size={17} color={colors.successText ?? colors.success} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {isTodayCardEnabled && (
        <View
          style={[
            styles.todayCard,
            {
              backgroundColor: isDarkMode ? '#132033' : '#FFFFFF',
              borderColor: todayAccentColor,
            },
          ]}
        >
          <View style={[styles.todayTopStripe, { backgroundColor: todayAccentColor }]} />
          <View style={styles.todayHeaderRow}>
            <View style={[styles.todayIcon, { backgroundColor: todayAccentSoft, borderColor: todayAccentColor }]}>
              <MaterialIcons
                name={todaySavedProgressCount >= dailyPracticeGoal ? 'emoji-events' : 'flag'}
                size={24}
                color={todayAccentColor}
              />
            </View>
            <View style={styles.todayTitleBlock}>
              <Text style={[styles.todayTitle, { color: colors.text }]}>{copy.today}</Text>
              <Text style={[styles.todaySubtitle, { color: colors.secondaryText }]}>
                {todaySavedProgressCount > 0 ? copy.todayLogged : copy.todayStart}
              </Text>
            </View>
            <View style={[
              styles.todayScoreBadge,
              {
                backgroundColor: todayAccentSoft,
                borderColor: todayAccentColor,
              },
            ]}>
              <Text style={[styles.todayScoreValue, { color: todayAccentColor }]}>{todaySavedProgressCount}</Text>
              <Text style={[styles.todayScoreLabel, { color: todayAccentColor }]}>/{dailyPracticeGoal}</Text>
            </View>
          </View>

          <View style={styles.todayProgressBlock}>
            <View style={[styles.todayProgressTrack, { backgroundColor: isDarkMode ? '#26394E' : '#E5E5E5' }]}>
              <View
                style={[
                  styles.todayProgressFill,
                  {
                    width: `${todayProgress}%`,
                    backgroundColor: todayAccentColor,
                  },
                ]}
              />
            </View>
            <View style={styles.todayProgressHeader}>
              <Text style={[styles.todayProgressText, { color: colors.text }]}>{todayStatus}</Text>
              <Text style={[styles.todayGoalText, { color: todayAccentColor }]}>
                {todayProgress}%
              </Text>
            </View>
          </View>

          <View style={styles.todayRows}>
            <View style={[
              styles.todayMetricRow,
              {
                backgroundColor: isDarkMode ? '#1B2B3D' : '#F7FCFF',
                borderColor: DAILY_BLUE,
              },
            ]}>
              <View style={[styles.todayMetricIcon, { backgroundColor: DAILY_BLUE_SOFT }]}>
                <MaterialIcons name="edit" size={20} color={DAILY_BLUE} />
              </View>
              <View style={styles.todayMetricCopy}>
                <Text style={[styles.todayMetricLabel, { color: colors.secondaryText }]}>{copy.itemsToday}</Text>
                <Text style={[styles.todayMetricValue, { color: colors.text }]}>
                  {todayGrammarAnswerCount} {todayGrammarAnswerCount === 1 ? copy.practiceItemSingular : copy.practiceItemPlural}
                </Text>
              </View>
            </View>
            <View style={[
              styles.todayMetricRow,
              {
                backgroundColor: isDarkMode ? '#1A2F25' : '#FAFFF7',
                borderColor: DAILY_GREEN,
              },
            ]}>
              <View style={[styles.todayMetricIcon, { backgroundColor: DAILY_GREEN_SOFT }]}>
                <MaterialIcons name="style" size={20} color={DAILY_GREEN_DARK} />
              </View>
              <View style={styles.todayMetricCopy}>
                <Text style={[styles.todayMetricLabel, { color: colors.secondaryText }]}>{copy.learntToday}</Text>
                <Text style={[styles.todayMetricValue, { color: colors.text }]}>
                  {todayLearntCount} {todayLearntCount === 1 ? copy.wordSingular : copy.wordPlural}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.categoriesContainer, isDesktop && styles.categoriesContainerDesktop]}>
        {localizedCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryCard,
              isDesktop && styles.categoryCardDesktop,
              { backgroundColor: isShinyEllieMode ? shinyCardColors[index % shinyCardColors.length] : category.color }
            ]}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: category.route })}
          >
            <MaterialIcons name={category.icon} size={32} color="white" />
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerSpacer: {
    height: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  accountPill: {
    minHeight: 44,
    maxWidth: 174,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  accountInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitialText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  accountPillText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '900',
  },
  todayCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 16,
    paddingTop: 18,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 5,
  },
  todayTopStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  todayTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },
  todaySubtitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 2,
  },
  todayScoreBadge: {
    minWidth: 72,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  todayScoreValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  todayScoreLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    marginTop: 6,
  },
  todayRows: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  todayMetricRow: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  todayMetricIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMetricCopy: {
    alignItems: 'center',
    minWidth: 0,
    marginTop: 6,
  },
  todayMetricLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  todayMetricValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  todayProgressBlock: {
    marginTop: 14,
  },
  todayProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  todayProgressText: {
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
    minWidth: 0,
  },
  todayGoalText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  todayProgressTrack: {
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  todayProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  categoriesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  categoriesContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    padding: 24,
    paddingBottom: 32,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardDesktop: {
    width: '48%',
  },
  categoryTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
    opacity: 0.9,
  },
});
