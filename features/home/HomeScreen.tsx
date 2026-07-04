import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
  InteractionManager,
} from 'react-native';
import { Svg, Circle } from 'react-native-svg';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../../types/navigationTypes';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exitImmersiveOpaque } from '../../lib/immersive';
import { getStreak, type StreakData } from '../progress/streakStorage';
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
import { checkAndMarkFirstVisit } from './firstVisitStorage';
import FirstVisitModal from './FirstVisitModal';
import { grammarLessons } from '../../content/lessons/grammarRegistry';
import { vocabularyLessons } from '../../content/lessons/vocabularyRegistry';
import { getPanelStyle, getSoftShadow, getStudySurfaceColors, uiRadii } from '../shared/uiPrimitives';
import {
  HOME_MENU_CARD_COLORS,
  HOME_MENU_CARD_GRADIENT_ENDS,
  HOME_MENU_TEXT_COLOR,
  SHINY_HOME_MENU_CARD_COLORS,
  SHINY_HOME_MENU_CARD_GRADIENT_ENDS,
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDarkMode, isTodayCardEnabled, isAndroidStatusBarEnabled, isShinyEllieMode } = useTheme();
  const {
    isLoading: isAccountLoading,
    lastSyncAt,
    session,
    accountAvatarColorId,
    accountAvatarId,
  } = useAccount();
  const copy = getMenuCopy().home;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const studySurface = React.useMemo(() => getStudySurfaceColors(colors, isDarkMode), [colors, isDarkMode]);
  const homeHeaderTopPadding = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 24)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top + 16
      : 16;
  const [todayGrammarAnswerCount, setTodayGrammarAnswerCount] = React.useState(0);
  const [todayLearntCount, setTodayLearntCount] = React.useState(0);
  const [localXP, setLocalXP] = React.useState(0);
  const [lastLesson, setLastLesson] = React.useState<LastLessonEntry | null>(null);
  const [streak, setStreak] = React.useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastPracticeDate: '' });
  const [showTutorial, setShowTutorial] = React.useState(false);
  const isNavigatingFromMenuRef = React.useRef(false);
  const dailyPracticeGoal = 15;
  const todaySavedProgressCount = todayGrammarAnswerCount + todayLearntCount;
  const savedItemsRemaining = Math.max(0, dailyPracticeGoal - todaySavedProgressCount);
  const todayProgress = Math.min(100, Math.round((todaySavedProgressCount / dailyPracticeGoal) * 100));
  const homeMenuCardColors = isShinyEllieMode ? SHINY_HOME_MENU_CARD_COLORS : HOME_MENU_CARD_COLORS;
  const homeMenuCardGradientEnds = isShinyEllieMode ? SHINY_HOME_MENU_CARD_GRADIENT_ENDS : HOME_MENU_CARD_GRADIENT_ENDS;
  const homeMenuTextColor = isShinyEllieMode ? SHINY_HOME_MENU_TEXT_COLOR : HOME_MENU_TEXT_COLOR;
  const localizedCategories = React.useMemo(() => [
    {
      title: copy.grammarTitle,
      icon: 'edit' as MaterialIconName,
      description: copy.grammarDescription,
      color: homeMenuCardColors.grammar,
      gradientEnd: homeMenuCardGradientEnds.grammar,
      route: 'Grammar'
    },
    {
      title: copy.vocabularyTitle,
      icon: 'style' as MaterialIconName,
      description: copy.vocabularyDescription,
      color: homeMenuCardColors.vocabulary,
      gradientEnd: homeMenuCardGradientEnds.vocabulary,
      route: 'Vocabulary'
    },
    {
      title: copy.lessonsTitle,
      icon: 'menu-book' as MaterialIconName,
      description: copy.lessonsDescription,
      color: homeMenuCardColors.lessons,
      gradientEnd: homeMenuCardGradientEnds.lessons,
      route: 'Lessons'
    },
    {
      title: copy.settingsTitle,
      icon: 'settings' as MaterialIconName,
      description: copy.settingsDescription,
      color: homeMenuCardColors.settings,
      gradientEnd: homeMenuCardGradientEnds.settings,
      route: 'Settings'
    }
  ], [copy, homeMenuCardColors, homeMenuCardGradientEnds]);
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

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      let summaryTask: { cancel?: () => void } | null = null;

      isNavigatingFromMenuRef.current = false;
      checkAndMarkFirstVisit().then((isFirst) => {
        if (active && isFirst) setShowTutorial(true);
      }).catch(() => {});
      exitImmersiveOpaque(
        androidNavigationBarColor,
        androidNavigationBarButtonStyle,
        Platform.OS !== 'android' || isAndroidStatusBarEnabled
      ).catch(() => {});
      getXP().then((xp) => {
        if (!active) return;
        setLocalXP(xp);
      }).catch(() => {});
      getLastLesson().then((entry) => {
        if (!active) return;
        setLastLesson(entry);
      }).catch(() => {});
      getStreak().then((s) => {
        if (!active) return;
        setStreak(s);
      }).catch(() => {});

      if (!isTodayCardEnabled) {
        return () => {
          active = false;
        };
      }

      summaryTask = InteractionManager.runAfterInteractions(() => {
        Promise.all([getGrammarProgressSummary(), getLearnedFlashcardSummary()]).then(([grammarSummary, learnedSummary]) => {
          if (!active) return;
          setTodayGrammarAnswerCount(grammarSummary.correctToday);
          setTodayLearntCount(learnedSummary.learnedToday);
        }).catch(() => {});
      });

      return () => {
        active = false;
        summaryTask?.cancel?.();
      };
    }, [
      androidNavigationBarButtonStyle,
      androidNavigationBarColor,
      isAndroidStatusBarEnabled,
      isTodayCardEnabled,
      lastSyncAt,
    ])
  );

  const openHomeMenuRoute = React.useCallback((route: string) => {
    if (isNavigatingFromMenuRef.current) return;

    isNavigatingFromMenuRef.current = true;
    navigation.navigate('MainTabs', { screen: route as keyof TabParamList });
  }, [navigation]);

  const openContinueLesson = React.useCallback(() => {
    if (!continueLessonTarget) return;

    if (continueLessonTarget.type === 'grammar') {
      navigation.navigate('MainTabs', {
        screen: 'Grammar',
        params: {
          lesson: continueLessonTarget.lesson,
          openKey: Date.now(),
        },
      });
      return;
    }

    navigation.navigate('MainTabs', {
      screen: 'Vocabulary',
      params: {
        screen: 'VocabularyLesson',
        params: {
          lesson: continueLessonTarget.lesson,
        },
      },
    });
  }, [continueLessonTarget, navigation]);

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
            borderBottomColor: isDarkMode ? colors.border : '#E1EAF3',
            borderBottomWidth: 1,
            paddingTop: homeHeaderTopPadding
          }
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{welcomeText}</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{copy.subtitle}</Text>
          </View>
          <View style={styles.headerRightGroup}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Account')}
            style={styles.accountPillWrap}
            accessibilityRole="button"
            accessibilityLabel="Open account"
          >
            {!isAccountLoading ? (
              <AccountAvatar avatarId={unlockedAccountAvatarId} colorId={unlockedAccountAvatarColorId} size={58} />
            ) : (
              <MaterialIcons
                name="account-circle"
                size={58}
                color={accountPillAccent}
              />
            )}
            <View
              style={[
                styles.levelBadge,
                {
                  backgroundColor: isAccountMaster ? (isDarkMode ? colors.warningSoft : '#FFF7D7') : (isDarkMode ? colors.primarySoft : '#E8F4FF'),
                  borderColor: isAccountMaster ? colors.warning : colors.borderStrong,
                },
              ]}
            >
              {isAccountMaster && <Text style={styles.levelBadgeIcon}>★</Text>}
              <Text style={[styles.levelBadgeText, { color: isAccountMaster ? (isDarkMode ? '#FFD166' : '#7A4B00') : colors.primary }]}>
                {accountLevelBadgeLabel.replace('Level ', 'Lv.')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
            <View style={styles.todayLeftBlock}>
              <View style={styles.todayTitleRow}>
                <Text style={[styles.todayTitle, { color: colors.text }]}>{copy.today}</Text>
                {streak.currentStreak >= 2 && (
                  <View style={[styles.streakChip, { backgroundColor: isDarkMode ? '#3D2800' : '#FFF3DC', borderColor: isDarkMode ? '#7A5200' : '#F4B740' }]}>
                    <Text style={styles.streakFlame}>🔥</Text>
                    <Text style={[styles.streakCount, { color: isDarkMode ? '#FFD166' : '#B36B00' }]}>{streak.currentStreak}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.todaySubtitle, { color: colors.secondaryText }]}>
                {todaySavedProgressCount > 0 ? copy.todayLogged : copy.todayStart}
              </Text>
              <Text style={[styles.todayStatusInline, { color: colors.secondaryText }]} numberOfLines={2}>{todayStatus}</Text>
            </View>
            <View style={styles.todayRingWrap}>
              {(() => {
                const size = 80;
                const strokeWidth = 7;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference * (1 - Math.min(todayProgress / 100, 1));
                return (
                  <Svg width={size} height={size}>
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={isDarkMode ? colors.surfaceAlt : '#E8F0F8'}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={todayAccentColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${size / 2}, ${size / 2}`}
                    />
                  </Svg>
                );
              })()}
              <View style={styles.todayRingCenter} pointerEvents="none">
                <Text style={[styles.todayRingValue, { color: todayAccentColor }]}>{todaySavedProgressCount}</Text>
                <Text style={[styles.todayRingGoal, { color: colors.secondaryText }]}>/{dailyPracticeGoal}</Text>
              </View>
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
              borderColor: isDarkMode ? colors.border : colors.borderStrong,
            },
          ]}
          onPress={openContinueLesson}
          accessibilityRole="button"
          accessibilityLabel={`Continue ${continueLessonTarget.title}`}
        >
          <View style={[styles.continueIcon, { backgroundColor: isDarkMode ? studySurface.control : '#DDF4FF', borderColor: isDarkMode ? colors.border : 'transparent' }]}>
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
        {localizedCategories.map((category) => (
          <Pressable
            key={category.route}
            style={({ pressed }) => [
              styles.categoryCard,
              getSoftShadow(isDarkMode, 'raised'),
              isDesktop && styles.categoryCardDesktop,
              pressed && styles.categoryCardPressed,
              {
                backgroundColor: category.color,
                borderColor: 'rgba(255,255,255,0.62)',
                borderBottomColor: 'rgba(0,0,0,0.12)',
              }
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.26)' }}
            unstable_pressDelay={0}
            onPress={() => openHomeMenuRoute(category.route)}
            accessibilityRole="button"
            accessibilityLabel={category.title}
          >
            <MaterialIcons name={category.icon} size={32} color={homeMenuTextColor} />
            <Text style={[styles.categoryTitle, { color: homeMenuTextColor }]}>{category.title}</Text>
            <Text style={[styles.categoryDescription, { color: homeMenuTextColor }]}>{category.description}</Text>
          </Pressable>
        ))}
      </View>

      <FirstVisitModal
        visible={showTutorial}
        onDismiss={() => setShowTutorial(false)}
        onSetupAccount={() => {
          setShowTutorial(false);
          navigation.navigate('Account');
        }}
      />
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountPillWrap: {
    alignItems: 'center',
    gap: 5,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 48,
    justifyContent: 'center',
  },
  levelBadgeIcon: {
    fontSize: 9,
    lineHeight: 11,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
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
    justifyContent: 'space-between',
  },
  todayLeftBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  todayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakFlame: {
    fontSize: 13,
    lineHeight: 16,
  },
  streakCount: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  todaySubtitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  todayStatusInline: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  todayRingWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  todayRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0,
  },
  todayRingValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  todayRingGoal: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
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
    borderWidth: 1,
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
    borderWidth: 2,
    borderBottomWidth: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 5,
  },
  categoryCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  categoryCardDesktop: {
    width: '48%',
  },
  categoryTitle: {
    fontSize: 27,
    fontWeight: '800',
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
