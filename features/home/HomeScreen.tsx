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
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exitImmersiveOpaque } from '../../lib/immersive';
import { useFonts } from 'expo-font';
import { getLearnedFlashcardSummary } from '../vocabulary/flashcardProgressStorage';
import { getGrammarProgressSummary } from '../grammar/grammarProgressStorage';
import { getMenuCopy } from '../shared/menuCopy';
import { useAccount } from '../account/AccountContext';
import AccountAvatar from '../account/AccountAvatar';
import {
  getAccountAvatarColorPreset,
  getUnlockedAccountAvatarColorId,
  getUnlockedAccountAvatarId,
} from '../account/accountAvatarStorage';
import { getXP } from '../progress/xpStorage';
import { getLevelBadgeLabel, getXPLevel, isMasterLevel } from '../progress/xpLevels';
import { getLastLesson, type LastLessonEntry } from '../progress/lastLessonStorage';
import { grammarLessons } from '../../content/lessons/grammarRegistry';
import { vocabularyLessons } from '../../content/lessons/vocabularyRegistry';
import { getPanelStyle, getSoftShadow, uiRadii } from '../shared/uiPrimitives';
import {
  HOME_MENU_CARD_COLORS,
  HOME_MENU_TEXT_COLOR,
  SHINY_HOME_MENU_CARD_COLORS,
  SHINY_HOME_MENU_TEXT_COLOR,
} from '../shared/homeMenuColors';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from '../shared/appChromeColors';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const DAILY_GREEN = '#58CC02';
const DAILY_GREEN_DARK = '#3F9700';
const DAILY_GREEN_SOFT = '#E5F8D2';
const DAILY_BLUE = '#7CB7FF';
const DAILY_BLUE_SOFT = '#DDF4FF';
const cleanDisplayName = (value: string) => value.trim().replace(/\s+/g, ' ');

const getFirstName = (value: string) => {
  const cleaned = cleanDisplayName(value);
  if (!cleaned) return '';

  return cleaned.split(' ')[0];
};

const normalizeLessonTitle = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const findLastLessonTarget = (entry: LastLessonEntry | null) => {
  if (!entry) return null;

  const primaryLessons = entry.type === 'grammar' ? grammarLessons : vocabularyLessons;
  const fallbackLessons = entry.type === 'grammar' ? vocabularyLessons : grammarLessons;
  const wantedTitle = normalizeLessonTitle(entry.title);
  const wantedId = entry.lessonId ? String(entry.lessonId) : '';
  const findMatch = (lessons: any[]) => lessons.find((item: any) => (
    (wantedId && String(item.id ?? '') === wantedId) ||
    normalizeLessonTitle(String(item.title ?? '')) === wantedTitle
  ));
  const primaryLesson = findMatch(primaryLessons);

  if (primaryLesson) return { ...entry, lesson: primaryLesson };

  const fallbackLesson = findMatch(fallbackLessons);
  if (!fallbackLesson) return null;

  const fallbackType = entry.type === 'grammar' ? 'vocabulary' : 'grammar';

  return { ...entry, type: fallbackType as LastLessonEntry['type'], lesson: fallbackLesson };
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode, isTodayCardEnabled, isAndroidStatusBarEnabled, menuLanguage, isShinyEllieMode } = useTheme();
  const {
    isLoading: isAccountLoading,
    lastSyncAt,
    session,
    accountAvatarColorId,
    accountAvatarId,
  } = useAccount();
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
  const [localXP, setLocalXP] = React.useState(0);
  const [lastLesson, setLastLesson] = React.useState<LastLessonEntry | null>(null);
  const dailyPracticeGoal = 15;
  const todaySavedProgressCount = todayGrammarAnswerCount + todayLearntCount;
  const savedItemsRemaining = Math.max(0, dailyPracticeGoal - todaySavedProgressCount);
  const todayProgress = Math.min(100, Math.round((todaySavedProgressCount / dailyPracticeGoal) * 100));
  const homeMenuCardColors = isShinyEllieMode ? SHINY_HOME_MENU_CARD_COLORS : HOME_MENU_CARD_COLORS;
  const homeMenuTextColor = isShinyEllieMode ? SHINY_HOME_MENU_TEXT_COLOR : HOME_MENU_TEXT_COLOR;
  const localizedCategories = React.useMemo(() => [
    {
      title: copy.grammarTitle,
      icon: 'edit' as MaterialIconName,
      description: copy.grammarDescription,
      color: homeMenuCardColors.grammar,
      route: 'Grammar'
    },
    {
      title: copy.vocabularyTitle,
      icon: 'style' as MaterialIconName,
      description: copy.vocabularyDescription,
      color: homeMenuCardColors.vocabulary,
      route: 'Vocabulary'
    },
    {
      title: copy.lessonsTitle,
      icon: 'menu-book' as MaterialIconName,
      description: copy.lessonsDescription,
      color: homeMenuCardColors.lessons,
      route: 'Lessons'
    },
    {
      title: copy.settingsTitle,
      icon: 'settings' as MaterialIconName,
      description: copy.settingsDescription,
      color: homeMenuCardColors.settings,
      route: 'Settings'
    }
  ], [copy, homeMenuCardColors]);
  const todayStatus =
    todaySavedProgressCount >= dailyPracticeGoal
      ? copy.dailyTargetReached
      : todaySavedProgressCount > 0
        ? `${savedItemsRemaining} ${savedItemsRemaining === 1 ? copy.practiceRemainingSingular : copy.practiceRemainingPlural} ${copy.toDailyTarget}`
        : copy.noPracticeYet;
  const dailyBlueSoft = isDarkMode ? colors.primarySoft : DAILY_BLUE_SOFT;
  const dailyGreenSoft = isDarkMode ? colors.successSoft : DAILY_GREEN_SOFT;
  const todayAccentColor = todaySavedProgressCount >= dailyPracticeGoal
    ? (isDarkMode ? colors.success : DAILY_GREEN)
    : (isDarkMode ? colors.primary : DAILY_BLUE);
  const todayAccentSoft = todaySavedProgressCount >= dailyPracticeGoal ? dailyGreenSoft : dailyBlueSoft;
  const todayCardBorderColor = isDarkMode ? colors.borderStrong : todayAccentColor;
  const androidNavigationBarColor = getAndroidBottomBarColor(isDarkMode, colors);
  const androidNavigationBarButtonStyle = getAndroidBottomBarButtonStyle(isDarkMode);

  const isDesktop = Platform.OS !== 'web' && width > 0 && width >= 640;
  const accountDisplayName = cleanDisplayName(session?.user.displayName || session?.user.username || '');
  const accountFirstName = getFirstName(accountDisplayName);
  const welcomeText = accountFirstName ? `Welcome, ${accountFirstName}!` : copy.welcome;
  const accountLevel = React.useMemo(() => getXPLevel(localXP), [localXP]);
  const isAccountMaster = React.useMemo(() => isMasterLevel(accountLevel), [accountLevel]);
  const accountLevelBadgeLabel = React.useMemo(() => getLevelBadgeLabel(accountLevel), [accountLevel]);
  const unlockedAccountAvatarId = React.useMemo(
    () => getUnlockedAccountAvatarId(accountAvatarId, accountLevel),
    [accountAvatarId, accountLevel]
  );
  const unlockedAccountAvatarColorId = React.useMemo(
    () => getUnlockedAccountAvatarColorId(accountAvatarColorId, accountLevel),
    [accountAvatarColorId, accountLevel]
  );
  const accountAvatarColorPreset = React.useMemo(
    () => getAccountAvatarColorPreset(unlockedAccountAvatarColorId),
    [unlockedAccountAvatarColorId]
  );
  const accountPillAccent = accountAvatarColorPreset.accentColor;
  const continueLessonTarget = React.useMemo(() => findLastLessonTarget(lastLesson), [lastLesson]);

  // Preload icon font to prevent delayed icons and layout shift.
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      exitImmersiveOpaque(
        androidNavigationBarColor,
        androidNavigationBarButtonStyle,
        Platform.OS !== 'android' || isAndroidStatusBarEnabled
      ).catch(() => {});
      getXP().then((xp) => {
        if (!active) return;
        setLocalXP(xp);
      });
      getLastLesson().then((entry) => {
        if (!active) return;
        setLastLesson(entry);
      });

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
    }, [
      androidNavigationBarButtonStyle,
      androidNavigationBarColor,
      isAndroidStatusBarEnabled,
      isTodayCardEnabled,
      lastSyncAt,
    ])
  );

  // Do not render until icons are ready.
  if (!fontsLoaded) return null;

  const openContinueLesson = () => {
    if (!continueLessonTarget) return;

    if (continueLessonTarget.type === 'grammar') {
      (navigation as any).navigate('MainTabs', {
        screen: 'Grammar',
        params: {
          lesson: continueLessonTarget.lesson,
          openKey: Date.now(),
        },
      });
      return;
    }

    (navigation as any).navigate('MainTabs', {
      screen: 'Vocabulary',
      params: {
        screen: 'VocabularyLesson',
        params: {
          lesson: continueLessonTarget.lesson,
        },
      },
    });
  };

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
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open account"
          >
            {!isAccountLoading ? (
              <AccountAvatar avatarId={unlockedAccountAvatarId} colorId={unlockedAccountAvatarColorId} size={58} />
            ) : (
              <MaterialIcons
                name="account-circle"
                size={34}
                color={accountPillAccent}
              />
            )}
            {isAccountMaster && (
              <View style={styles.accountPillMasterBadge}>
                <Text style={styles.accountPillMasterText}>{accountLevelBadgeLabel.replace('Level ', '')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {isTodayCardEnabled && (
        <View
          style={[
            styles.todayCard,
            getPanelStyle(colors, isDarkMode, 'raised'),
            {
              backgroundColor: colors.card,
              borderColor: todayCardBorderColor,
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
            <View style={[
              styles.todayProgressTrack,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}>
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
            <View
              style={[
                styles.todayMetricRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDarkMode ? colors.border : DAILY_BLUE,
                },
              ]}
            >
              <View style={[styles.todayMetricIcon, { backgroundColor: dailyBlueSoft }]}>
                <MaterialIcons name="edit" size={20} color={DAILY_BLUE} />
              </View>
              <View style={styles.todayMetricCopy}>
                <Text style={[styles.todayMetricLabel, { color: colors.secondaryText }]}>{copy.itemsToday}</Text>
                <Text style={[styles.todayMetricValue, { color: colors.text }]}>
                  {todayGrammarAnswerCount} {todayGrammarAnswerCount === 1 ? copy.practiceItemSingular : copy.practiceItemPlural}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.todayMetricRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDarkMode ? colors.border : DAILY_GREEN,
                },
              ]}
            >
              <View style={[styles.todayMetricIcon, { backgroundColor: dailyGreenSoft }]}>
                <MaterialIcons name="style" size={20} color={isDarkMode ? DAILY_GREEN : DAILY_GREEN_DARK} />
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

      {continueLessonTarget && (
        <TouchableOpacity
          style={[
            styles.continueCard,
            getPanelStyle(colors, isDarkMode),
            {
              backgroundColor: colors.card,
              borderColor: isDarkMode ? colors.borderStrong : '#1CB0F6',
            },
          ]}
          onPress={openContinueLesson}
          accessibilityRole="button"
          accessibilityLabel={`Continue ${continueLessonTarget.title}`}
        >
          <View style={[styles.continueIcon, { backgroundColor: isDarkMode ? colors.primarySoft : '#DDF4FF' }]}>
            <MaterialIcons
              name={continueLessonTarget.type === 'grammar' ? 'edit' : 'style'}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.continueCopy}>
            <Text style={[styles.continueLabel, { color: colors.secondaryText }]}>Continue</Text>
            <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
              {continueLessonTarget.title}
            </Text>
            <Text style={[styles.continueMeta, { color: colors.secondaryText }]}>
              {continueLessonTarget.type === 'grammar' ? 'Grammar' : 'Vocabulary'}
            </Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
      )}

      <View style={[styles.categoriesContainer, isDesktop && styles.categoriesContainerDesktop]}>
        {localizedCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryCard,
              getSoftShadow(isDarkMode, 'raised'),
              isDesktop && styles.categoryCardDesktop,
              {
                backgroundColor: category.color,
              }
            ]}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: category.route })}
          >
            <MaterialIcons name={category.icon} size={32} color={homeMenuTextColor} />
            <Text style={[styles.categoryTitle, { color: homeMenuTextColor }]}>{category.title}</Text>
            <Text style={[styles.categoryDescription, { color: homeMenuTextColor }]}>{category.description}</Text>
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
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountPillMasterBadge: {
    position: 'absolute',
    right: -4,
    bottom: -5,
    minWidth: 34,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D79A00',
    backgroundColor: '#FFF7D7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  accountPillMasterText: {
    color: '#7A4B00',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
  todayCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 16,
    paddingTop: 18,
    borderRadius: uiRadii.card,
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
    borderRadius: uiRadii.panel,
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
  continueCard: {
    minHeight: 84,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: uiRadii.panel,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  continueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCopy: {
    flex: 1,
    minWidth: 0,
  },
  continueLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 2,
  },
  continueMeta: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 1,
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
    borderRadius: uiRadii.card,
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
    textShadowColor: 'rgba(10,28,48,0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  categoryDescription: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
    opacity: 0.9,
    textShadowColor: 'rgba(10,28,48,0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
