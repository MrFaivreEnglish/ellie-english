import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  InteractionManager,
  useWindowDimensions,
} from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import Animated, { FadeInDown, useAnimatedProps, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSpringPress } from '../shared/useSpringPress';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function TodayProgressRing({
  progress,
  size,
  strokeWidth,
  trackColor,
  fillColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  trackColor: string;
  fillColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withTiming(Math.min(progress / 100, 1), { duration: 700 });
  }, [progress, progressValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value),
  }));

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={fillColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

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
import { DESIGN_ACCENTS, getSoftShadow, getStudySurfaceColors, uiRadii } from '../shared/uiPrimitives';
import { freshFontFamily, freshRadii, freshSmallPillShadow, freshTileShadow } from '../shared/freshDirection';
import {
  HOME_MENU_CARD_COLORS,
  HOME_MENU_CARD_GRADIENT_ENDS,
  HOME_MENU_TEXT_COLOR,
  SHINY_HOME_MENU_CARD_COLORS,
  SHINY_HOME_MENU_CARD_GRADIENT_ENDS,
  SHINY_HOME_MENU_TEXT_COLOR,
  TODAY_CARD_COLORS,
} from '../shared/homeMenuColors';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from '../shared/appChromeColors';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

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
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth >= 768;
  const {
    isLoading: isAccountLoading,
    lastSyncAt,
    session,
    accountAvatarColorId,
    accountAvatarId,
  } = useAccount();
  const copy = getMenuCopy().home;
  const insets = useSafeAreaInsets();
  const studySurface = React.useMemo(() => getStudySurfaceColors(colors, isDarkMode), [colors, isDarkMode]);
  const homeHeaderTopPadding = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 24)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top + 16
      : 10;
  const [todayGrammarAnswerCount, setTodayGrammarAnswerCount] = React.useState(0);
  const [todayLearntCount, setTodayLearntCount] = React.useState(0);
  const [localXP, setLocalXP] = React.useState(0);
  const [lastLesson, setLastLesson] = React.useState<LastLessonEntry | null>(null);
  const [streak, setStreak] = React.useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastPracticeDate: '' });
  const [showTutorial, setShowTutorial] = React.useState(false);
  const isNavigatingFromMenuRef = React.useRef(false);
  const dailyPracticeGoal = 15;
  const todaySavedProgressCount = todayGrammarAnswerCount + todayLearntCount;
  const todayProgress = Math.min(100, Math.round((todaySavedProgressCount / dailyPracticeGoal) * 100));
  const homeMenuCardColors = isShinyEllieMode ? SHINY_HOME_MENU_CARD_COLORS : HOME_MENU_CARD_COLORS;
  const homeMenuCardGradientEnds = isShinyEllieMode ? SHINY_HOME_MENU_CARD_GRADIENT_ENDS : HOME_MENU_CARD_GRADIENT_ENDS;
  const homeMenuTextColor = isShinyEllieMode ? SHINY_HOME_MENU_TEXT_COLOR : HOME_MENU_TEXT_COLOR;
  const todayCardColors = isShinyEllieMode ? TODAY_CARD_COLORS.shiny : TODAY_CARD_COLORS.normal;
  const continueCardPress = useSpringPress();
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
  const androidNavigationBarColor = getAndroidBottomBarColor(isDarkMode, colors);
  const androidNavigationBarButtonStyle = getAndroidBottomBarButtonStyle(isDarkMode);

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
      <View style={isDesktopWeb && styles.desktopContentWrap}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingTop: homeHeaderTopPadding
          }
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.text },
                isDesktopWeb ? styles.headerTitleDesktop : styles.headerTitleMobile,
              ]}
              numberOfLines={1}
            >
              {welcomeText}
            </Text>
          </View>
          <View style={styles.headerRightGroup}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Account')}
            style={styles.accountPillWrap}
            accessibilityRole="button"
            accessibilityLabel="Open account"
          >
            {!isAccountLoading ? (
              <AccountAvatar avatarId={unlockedAccountAvatarId} colorId={unlockedAccountAvatarColorId} size={isDesktopWeb ? 64 : 60} />
            ) : (
              <MaterialIcons
                name="account-circle"
                size={isDesktopWeb ? 64 : 48}
                color={accountPillAccent}
              />
            )}
            <View
              style={[
                styles.levelBadge,
                isAccountMaster
                  ? { backgroundColor: isDarkMode ? colors.warningSoft : '#FFF7D7' }
                  : { backgroundColor: colors.primary },
                freshSmallPillShadow(isAccountMaster ? colors.warning : DESIGN_ACCENTS.blue.shadow),
              ]}
            >
              {isAccountMaster && <Text style={styles.levelBadgeIcon}>★</Text>}
              <Text style={[styles.levelBadgeText, { color: isAccountMaster ? (isDarkMode ? '#FFD166' : '#7A4B00') : '#FFFFFF' }]}>
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
            { backgroundColor: todayCardColors.solid },
            freshTileShadow(todayCardColors.shadow, true),
          ]}
        >
          <View style={[styles.todayDecorCircle, { backgroundColor: todayCardColors.decoration }]} pointerEvents="none" />
          <View style={styles.todayHeaderRow}>
            <View style={styles.todayLeftBlock}>
              <View style={styles.todayTitleRow}>
                <Text style={[styles.todayTitle, { color: todayCardColors.text }]}>{copy.today}</Text>
                {streak.currentStreak >= 2 && (
                  <Animated.View
                    entering={ZoomIn.springify().damping(14)}
                    style={[styles.todayStreakChip, { backgroundColor: todayCardColors.strongSurface }]}
                  >
                    <Text style={styles.streakFlame}>🔥</Text>
                    <Text style={[styles.todayStreakText, { color: todayCardColors.text }]}>
                      {streak.currentStreak}-day streak
                    </Text>
                  </Animated.View>
                )}
              </View>
              <Text style={[styles.todaySubtitle, { color: todayCardColors.mutedText }]} numberOfLines={2}>
                {todaySavedProgressCount > 0 ? copy.todayLogged : copy.todayStart}
              </Text>
            </View>
            <View style={styles.todayRingWrap}>
              <TodayProgressRing
                progress={todayProgress}
                size={42}
                strokeWidth={4}
                trackColor={todayCardColors.ringTrack}
                fillColor={todayCardColors.text}
              />
              <View style={styles.todayRingCenter} pointerEvents="none">
                <Text style={[styles.todayRingValue, { color: todayCardColors.text, fontSize: 14, lineHeight: 17 }]}>{todaySavedProgressCount}</Text>
                <Text style={[styles.todayRingGoal, { color: todayCardColors.faintText, fontSize: 9, lineHeight: 11 }]}>/{dailyPracticeGoal}</Text>
              </View>
            </View>
          </View>

          <View style={styles.todayRows}>
            <View style={[styles.todayMetricRow, { backgroundColor: todayCardColors.surface }]}>
              <View style={[styles.todayMetricIcon, { backgroundColor: todayCardColors.strongSurface }]}>
                <MaterialIcons name="edit" size={20} color={todayCardColors.text} />
              </View>
              <View style={styles.todayMetricCopy}>
                <Text style={[styles.todayMetricLabel, { color: todayCardColors.subtleText }]} numberOfLines={2}>{copy.itemsToday}</Text>
                <Text style={[styles.todayMetricValue, { color: todayCardColors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {todayGrammarAnswerCount} {todayGrammarAnswerCount === 1 ? copy.practiceItemSingular : copy.practiceItemPlural}
                </Text>
              </View>
            </View>
            <View style={[styles.todayMetricRow, { backgroundColor: todayCardColors.surface }]}>
              <View style={[styles.todayMetricIcon, { backgroundColor: todayCardColors.strongSurface }]}>
                <MaterialIcons name="style" size={20} color={todayCardColors.text} />
              </View>
              <View style={styles.todayMetricCopy}>
                <Text style={[styles.todayMetricLabel, { color: todayCardColors.subtleText }]} numberOfLines={2}>{copy.learntToday}</Text>
                <Text style={[styles.todayMetricValue, { color: todayCardColors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {todayLearntCount} {todayLearntCount === 1 ? copy.wordSingular : copy.wordPlural}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {continueLessonTarget && (
        <Animated.View style={continueCardPress.animatedStyle}>
          <TouchableOpacity
            style={[
              styles.continueCard,
              { backgroundColor: colors.card },
              getSoftShadow(isDarkMode, 'soft'),
            ]}
            onPress={openContinueLesson}
            onPressIn={continueCardPress.onPressIn}
            onPressOut={continueCardPress.onPressOut}
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
              <Text style={[styles.continueLabel, { color: colors.primary }]}>Continue</Text>
              <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                {continueLessonTarget.title}
              </Text>
              <Text style={[styles.continueMeta, { color: colors.secondaryText }]}>
                {continueLessonTarget.type === 'grammar' ? 'Grammar' : 'Vocabulary'}
              </Text>
            </View>
            <MaterialIcons name="arrow-forward" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <Text style={[styles.pickCategoryLabel, { color: colors.secondaryText }]}>✨ pick a category ✨</Text>

      <View style={[styles.categoriesContainer, styles.categoriesContainerDesktop]}>
        {localizedCategories.map((category, index) => (
          <Animated.View
            key={category.route}
            entering={FadeInDown.delay(index * 60).duration(320)}
            style={isTodayCardEnabled ? styles.categoryCardDesktop : styles.categoryCardFullRow}
          >
            <Pressable
              style={({ pressed }) => [
                styles.categoryCard,
                styles.categoryCardGrid,
                pressed && styles.categoryCardPressed,
                { backgroundColor: category.color, width: '100%' },
                freshTileShadow(category.gradientEnd, true, pressed),
              ]}
              android_ripple={{ color: 'rgba(255,255,255,0.26)' }}
              unstable_pressDelay={0}
              onPress={() => openHomeMenuRoute(category.route)}
              accessibilityRole="button"
              accessibilityLabel={category.title}
            >
              <View style={[styles.categoryTitleRow, styles.categoryTitleRowCentered]}>
                <MaterialIcons name={category.icon} size={22} color={homeMenuTextColor} />
                <Text style={[styles.categoryTitle, { color: homeMenuTextColor }]}>{category.title}</Text>
              </View>
              <Text
                style={[
                  styles.categoryDescription,
                  { color: homeMenuTextColor },
                  styles.categoryDescriptionCentered,
                ]}
              >
                {category.description}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
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
  desktopContentWrap: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 18,
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
    fontWeight: freshFontFamily.extrabold,
    fontSize: 29,
  },
  headerTitleMobile: {
    fontSize: 32,
  },
  headerTitleDesktop: {
    fontSize: 44,
  },
  todayStreakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayStreakText: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 10,
    lineHeight: 13,
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
    fontWeight: freshFontFamily.extrabold,
    fontSize: 11,
    lineHeight: 13,
  },
  todayCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  todayDecorCircle: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    gap: 4,
  },
  todayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  todayTitle: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 17,
    lineHeight: 20,
  },
  streakFlame: {
    fontSize: 11,
    lineHeight: 13,
  },
  todaySubtitle: {
    fontWeight: freshFontFamily.bold,
    fontSize: 11.5,
    lineHeight: 15,
  },
  todayRingWrap: {
    width: 42,
    height: 42,
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
    fontWeight: freshFontFamily.extrabold,
    fontSize: 17,
    lineHeight: 20,
  },
  todayRingGoal: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 10,
    lineHeight: 12,
    marginTop: 4,
  },
  todayRows: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  todayMetricRow: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    borderRadius: uiRadii.panel,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  todayMetricIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMetricCopy: {
    alignItems: 'center',
    alignSelf: 'stretch',
    minWidth: 0,
    marginTop: 4,
  },
  todayMetricLabel: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
    textAlign: 'center',
  },
  todayMetricValue: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  continueCard: {
    minHeight: 84,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: uiRadii.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontWeight: freshFontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  continueTitle: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 2,
  },
  continueMeta: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
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
    padding: 20,
    borderRadius: freshRadii.largeTile,
    marginBottom: 16,
  },
  categoryCardGrid: {
    minHeight: 108,
    padding: 16,
    justifyContent: 'center',
  },
  pickCategoryLabel: {
    textAlign: 'center',
    fontWeight: freshFontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 2,
  },
  categoryCardPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  categoryCardDesktop: {
    width: '48%',
    alignItems: 'center',
  },
  categoryCardFullRow: {
    width: '100%',
    alignItems: 'center',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryTitleRowCentered: {
    justifyContent: 'center',
  },
  categoryTitle: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 21,
    color: 'white',
    textAlign: 'center',
  },
  categoryDescription: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 14.5,
    color: 'white',
    marginTop: 8,
    opacity: 0.85,
  },
  categoryDescriptionCentered: {
    textAlign: 'center',
    fontSize: 12.5,
  },
});
