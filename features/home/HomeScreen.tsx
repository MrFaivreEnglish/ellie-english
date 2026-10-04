import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getSerializableVocabularyLesson } from '../vocabulary/vocabularyUtils';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../../types/navigationTypes';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exitImmersiveOpaque } from '../../lib/immersive';
import { dismissMilestone, getDismissedMilestone, getMilestoneProgress } from '../progress/milestones';
import { getLearningLibrary } from '../progress/learningLibrary';
import type { Word } from '../../types/VocabularyTypes';
import { ContinueCard, MilestoneBanner } from './HomeCards';
import { getLearnedFlashcardSummary } from '../vocabulary/flashcardProgressStorage';
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
import { DESIGN_ACCENTS } from '../shared/uiPrimitives';
import { freshSmallPillShadow } from '../shared/freshDirection';
import {
  HOME_MENU_TEXT_COLOR,
  SHINY_HOME_MENU_CARD_COLORS,
  SHINY_HOME_MENU_CARD_GRADIENT_ENDS,
  SHINY_HOME_MENU_TEXT_COLOR,
} from '../shared/homeMenuColors';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from '../shared/appChromeColors';
import { isDesktopWebWidth } from '../shared/responsiveLayout';
import LessonHighlightBadge from '../shared/LessonHighlightBadge';
import { getSectionHighlightKind, useSeenLessonHighlights, type LessonHighlightKind } from '../shared/lessonHighlights';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];
const GRAMMAR_ICON_SOURCE = require('../../assets/navigation/grammar.png');
const VOCABULARY_ICON_SOURCE = require('../../assets/navigation/vocabulary.png');
const CHAPTERS_ICON_SOURCE = require('../../assets/navigation/chapters.png');
const SETTINGS_ICON_SOURCE = require('../../assets/navigation/settings.png');
// Tile fill and bottom edge from the Home handoff.
const HOME_TILE_COLORS = { grammar: '#4DA6F2', vocabulary: '#34C8B4', lessons: '#A794E8', settings: '#90A4B8' } as const;
const HOME_TILE_EDGES = { grammar: '#2B7FD0', vocabulary: '#1F9C8B', lessons: '#7E66D0', settings: '#6B8095' } as const;
const TILE_ICONS: Record<string, number> = {
  Grammar: GRAMMAR_ICON_SOURCE,
  Vocabulary: VOCABULARY_ICON_SOURCE,
  Lessons: CHAPTERS_ICON_SOURCE,
  Settings: SETTINGS_ICON_SOURCE,
};







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
  const { colors, isDarkMode, isAndroidStatusBarEnabled, isShinyElliePresentationMode } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();




  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);




  const isTabletDevice = !isDesktopWeb && Math.min(windowWidth, windowHeight) >= 600;
  const isScaledWeb = isDesktopWeb || isTabletDevice;



  const {
    isLoading: isAccountLoading,
    lastSyncAt,
    session,
    accountAvatarColorId,
    accountAvatarId,
  } = useAccount();
  const copy = getMenuCopy().home;
  const insets = useSafeAreaInsets();
  const homeHeaderTopPadding = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 24)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top + 16
      : 10;
  const [localXP, setLocalXP] = React.useState(0);
  const [lastLesson, setLastLesson] = React.useState<LastLessonEntry | null>(null);
  const [showTutorial, setShowTutorial] = React.useState(false);
  const isNavigatingFromMenuRef = React.useRef(false);
  const homeMenuCardColors = isShinyElliePresentationMode ? SHINY_HOME_MENU_CARD_COLORS : HOME_TILE_COLORS;
  const homeMenuCardGradientEnds = isShinyElliePresentationMode ? SHINY_HOME_MENU_CARD_GRADIENT_ENDS : HOME_TILE_EDGES;
  const homeMenuTextColor = isShinyElliePresentationMode ? SHINY_HOME_MENU_TEXT_COLOR : HOME_MENU_TEXT_COLOR;
  const [learntWordTotal, setLearntWordTotal] = React.useState(0);
  const [dismissedMilestone, setDismissedMilestone] = React.useState<number | null>(null);
  const [milestoneWords, setMilestoneWords] = React.useState<Word[]>([]);
  const seenLessonHighlights = useSeenLessonHighlights();
  const tileHighlights: Record<string, LessonHighlightKind | undefined> = {
    Grammar: getSectionHighlightKind('grammar', seenLessonHighlights),
    Vocabulary: getSectionHighlightKind('vocabulary', seenLessonHighlights),
  };
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
      title: isScaledWeb ? copy.lessonsTitle : copy.lessonsTitleCompact,
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
  // The highest milestone reached and not yet dismissed. Shown once, then never again.
  const reachedMilestone = React.useMemo(() => getMilestoneProgress(learntWordTotal).reached, [learntWordTotal]);
  const pendingMilestone =
    dismissedMilestone !== null && reachedMilestone > dismissedMilestone ? reachedMilestone : 0;
  const dismissPendingMilestone = React.useCallback(() => {
    if (!pendingMilestone) return;
    setDismissedMilestone(pendingMilestone);
    void dismissMilestone(pendingMilestone);
  }, [pendingMilestone]);

  React.useEffect(() => {
    if (!pendingMilestone) return;
    let active = true;
    getLearningLibrary().then((library) => {
      if (active) setMilestoneWords(library.recentWords.slice(0, 3));
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [pendingMilestone]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

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
      getDismissedMilestone().then((value) => {
        if (!active) return;
        setDismissedMilestone(value);
      }).catch(() => {});
      getLearnedFlashcardSummary().then((summary) => {
        if (!active) return;
        setLearntWordTotal(summary.totalLearned);
      }).catch(() => {});

      return () => {
        active = false;
      };
    }, [
      androidNavigationBarButtonStyle,
      androidNavigationBarColor,
      isAndroidStatusBarEnabled,
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
          lesson: getSerializableVocabularyLesson(continueLessonTarget.lesson),
        },
      },
    });
  }, [continueLessonTarget, navigation]);

  const isWide = windowWidth >= 720;
  const columnPadding = windowWidth >= 480 ? 24 : 16;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View
        style={[
          styles.column,
          { paddingHorizontal: columnPadding, paddingTop: homeHeaderTopPadding + 14 },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            <Text
              style={[styles.headerTitle, !isWide && styles.headerTitleNarrow, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {welcomeText}
            </Text>
          </View>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              style={[styles.headerSearchButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Search words and lessons"
            >
              <MaterialIcons name="search" size={24} color={colors.secondaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Account')}
              style={styles.accountPillWrap}
              accessibilityRole="button"
              accessibilityLabel="Open account"
            >
              <View style={styles.avatarFrame}>
                {!isAccountLoading ? (
                  <AccountAvatar
                    avatarId={unlockedAccountAvatarId}
                    colorId={unlockedAccountAvatarColorId}
                    size={60}
                  />
                ) : (
                  <MaterialIcons name="account-circle" size={60} color={accountPillAccent} />
                )}
              </View>
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

        {pendingMilestone > 0 && (
          <MilestoneBanner
            milestone={pendingMilestone}
            nextMilestone={getMilestoneProgress(pendingMilestone).next}
            sampleWords={milestoneWords}
            extraCount={milestoneWords.length > 0 ? Math.max(0, learntWordTotal - milestoneWords.length) : 0}
            onDismiss={dismissPendingMilestone}
            onOpen={() => navigation.navigate('MyWords')}
          />
        )}

        {continueLessonTarget && (
          <ContinueCard
            type={continueLessonTarget.type === 'grammar' ? 'grammar' : 'vocabulary'}
            title={continueLessonTarget.title}
            onContinue={openContinueLesson}
          />
        )}


        <View style={styles.grid}>
          {localizedCategories.map((category) => (
            <View key={category.route} style={styles.tileCell}>
              <Pressable
                style={({ pressed }) => [
                  styles.tile,
                  !isWide && styles.tileNarrow,
                  {
                    backgroundColor: category.color,
                    boxShadow: pressed ? `0px 1px 0px ${category.gradientEnd}` : `0px 5px 0px ${category.gradientEnd}`,
                    transform: [{ translateY: pressed ? 4 : 0 }],
                  },
                ]}
                android_ripple={{ color: 'rgba(255,255,255,0.26)' }}
                unstable_pressDelay={0}
                onPress={() => openHomeMenuRoute(category.route)}
                accessibilityRole="button"
                accessibilityLabel={category.title}
              >
                <Image
                  source={TILE_ICONS[category.route]}
                  style={styles.tileIcon}
                  resizeMode="contain"
                  fadeDuration={0}
                  accessibilityIgnoresInvertColors
                />
                <Text style={[styles.tileTitle, !isWide && styles.tileTitleNarrow, { color: homeMenuTextColor }]} numberOfLines={isWide ? 1 : 2}>
                  {category.title}
                </Text>
                {!!tileHighlights[category.route] && <LessonHighlightBadge kind={tileHighlights[category.route]!} />}
              </Pressable>
            </View>
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
  container: { flex: 1 },
  column: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingBottom: 32,
    gap: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { fontWeight: '900', fontSize: 40 },
  headerTitleNarrow: { fontSize: 30 },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountPillWrap: { alignItems: 'center', paddingBottom: 8 },
  // The avatar draws its own border in the colour the student picked.
  avatarFrame: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 48,
    justifyContent: 'center',
  },
  levelBadgeIcon: { fontSize: 9, lineHeight: 11 },
  levelBadgeText: { fontWeight: '800', fontSize: 11, lineHeight: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tileCell: { width: '47.5%', flexGrow: 1 },
  tile: {
    minHeight: 104,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 24,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  tileTitleNarrow: { fontSize: 17 },
  tileNarrow: { flexDirection: 'column', minHeight: 112, paddingHorizontal: 10, paddingVertical: 16, gap: 6 },
  tileIcon: { width: 28, height: 28 },
  tileTitle: { fontWeight: '800', fontSize: 20, flexShrink: 1, textAlign: 'center' },
});
