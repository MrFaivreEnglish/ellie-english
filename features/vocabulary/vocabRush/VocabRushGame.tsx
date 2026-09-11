import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Text from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import { vocabRushColors, vocabRushColorsForTheme } from './vocabRushColors';
import { shuffleArray } from '../vocabularyUtils';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../../shared/haptics';
import { awardActivityXPOnceToday, previewActivityXPOnceToday } from '../../progress/xpStorage';
import { recordPracticeToday } from '../../progress/streakStorage';
import { useTheme } from '../../settings/ThemeContext';
import { getMenuCopy } from '../../shared/menuCopy';
import { HOME_MENU_ROUTE_COLORS, SHINY_HOME_MENU_ROUTE_COLORS } from '../../shared/homeMenuColors';
import { getAndroidBottomBarColor } from '../../shared/appChromeColors';
import { isApkLayoutPreviewEnabled } from '../../shared/apkPreview';
import VocabRushGameOverCard from './VocabRushGameOverCard';
import VocabularyCompletionModal from '../VocabularyCompletionModal';
import { fontFamilyForWeight } from './vocabRushFonts';
import type { Word } from '../../../types/VocabularyTypes';
import {
  DESKTOP_WEB_MIN_WIDTH,
  getBottomSafeAreaInset,
  getWebLessonScale,
  LARGE_WIDTH,
  NARROW_TRAY_WIDTH,
} from '../../shared/responsiveLayout';

const BOARD_SIZE = 6;

const SCORE_PER_MATCH = 1;

const COMBO_BONUS_STREAK_THRESHOLD = 30;
const COMBO_BONUS_MULTIPLIER = 1.5;

const WRONG_PAIR_LOCKOUT_MS = 650;
const REFILL_DELAY_MS = 150;
const GRID_MAX_WIDTH = 820;
const GRID_COLUMN_GAP = 60;

const CARD_ENTER_MS = 320;
const CARD_EXIT_MS = 130;
const CARD_ENTER_OFFSET = 6;

type ModeKey = 'easy' | 'normal' | 'hard' | 'impossible';






const MODES: { key: ModeKey; label: string; secondsPerWord: number; xpPerPair: number; emoji: string; tagline: string; accent: string }[] = [
  { key: 'easy', label: 'Easy', secondsPerWord: 3, xpPerPair: 1, emoji: '🐢', tagline: 'Chill vibes only', accent: '#3FA867' },
  { key: 'normal', label: 'Normal', secondsPerWord: 2, xpPerPair: 2, emoji: '🙂', tagline: 'Nice and steady', accent: vocabRushColors.comboValue },
  { key: 'hard', label: 'Hard', secondsPerWord: 1.5, xpPerPair: 3, emoji: '🔥', tagline: 'Getting spicy', accent: '#e8792b' },
  { key: 'impossible', label: 'Impossible', secondsPerWord: 1, xpPerPair: 5, emoji: '💀', tagline: 'Good luck with that', accent: vocabRushColors.timerRed },
];


export const MAX_XP_PER_PAIR = Math.max(...MODES.map((m) => m.xpPerPair));

// Rush always draws from the same pool (the student's known words), so there are no
// per-item keys to dedupe against — a cleared run is one activity, keyed by difficulty.
// The first clear on each mode each day pays in full; clearing it again pays a fraction,
// the same shape every other mode uses. Without this, Rush was the one earning path with
// no ceiling at all: clear, replay, repeat, at roughly a level every couple of minutes.
const buildRunActivityKey = (modeKey: ModeKey) => `vocabulary:vocab-rush:${modeKey}`;
const VOCAB_RUSH_REPLAY_XP_FRACTION = 0.2;

const MIN_MODE_SECONDS = 8;
const getModeSeconds = (secondsPerWord: number, totalWords: number) =>
  Math.max(MIN_MODE_SECONDS, Math.round(secondsPerWord * Math.max(1, totalWords)));




const CHROME_REFERENCE_HEIGHT = 860;
const MIN_CHROME_SCALE = 0.62;



const MAX_CHROME_SCALE = 1.9;

type BoardCard = { pairId: string; word: Word };
type BoardColumn = (BoardCard | null)[];

type NavKey = 'grammar' | 'vocabulary' | 'lessons' | 'settings';

export type VocabRushGameProps = {
  words: Word[];
  startingScore?: number;
  startingStreak?: number;
  onBack: () => void;
  onNavigate: (key: NavKey) => void;
  onGoToAccount?: () => void;
};

const clampNum = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const buildInitialBoard = (words: Word[]) => {
  const boardSize = Math.min(BOARD_SIZE, words.length);
  const initialCards: BoardCard[] = words.slice(0, boardSize).map((word, index) => ({
    pairId: `w${index}`,
    word,
  }));

  return {
    en: shuffleArray(initialCards) as BoardColumn,
    fr: shuffleArray(initialCards) as BoardColumn,
    queue: words.slice(boardSize),
    nextPairId: boardSize,
  };
};

export default function VocabRushGame({
  words,
  startingScore = 0,
  startingStreak = 0,
  onBack,
  onNavigate,
  onGoToAccount,
}: VocabRushGameProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { colors: themeColors, isDarkMode, isShinyElliePresentationMode } = useTheme();
  const colors = vocabRushColorsForTheme(isDarkMode, themeColors);
  const desktopUiScale = getWebLessonScale(windowWidth, windowHeight);
  const menuCopy = getMenuCopy();

  const wrongBg = isDarkMode ? '#3A1512' : '#ffe0da';
  const wrongBorderColor = '#f47b74';
  const wrongTextColor = isDarkMode ? '#FFB4AE' : '#ac3031';

  const initial = useMemo(() => buildInitialBoard(words), [words]);
  const totalWords = words.length;
  const boardSize = Math.max(1, Math.min(BOARD_SIZE, totalWords || BOARD_SIZE));
  const defaultMode: ModeKey = 'normal';

  const [board, setBoard] = useState<{ en: BoardColumn; fr: BoardColumn }>({ en: initial.en, fr: initial.fr });
  const [selected, setSelected] = useState<{ en: number | null; fr: number | null }>({ en: null, fr: null });
  const [wrongPair, setWrongPair] = useState<{ en: number; fr: number } | null>(null);
  const [inputLocked, setInputLocked] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [score, setScore] = useState(startingScore);
  const [streak, setStreak] = useState(startingStreak);
  const [bestStreak, setBestStreak] = useState(startingStreak);
  const [sessionXp, setSessionXp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => getModeSeconds(MODES[1].secondsPerWord, totalWords));
  const [gameOver, setGameOver] = useState(false);
  // Streak-bonus: hitting the threshold makes the button available; tapping it activates
  // the 1.5x multiplier, which stays on until the streak itself breaks.
  const [comboBonusAvailable, setComboBonusAvailable] = useState(false);
  const [comboBonusActive, setComboBonusActive] = useState(false);
  // Counts matches made while the bonus was active, so endGame can add the extra XP for them.
  const bonusMatchesRef = useRef(0);
  // "Go to account" dismisses the completion card/modal without resetting the round, so
  // gameOver stays true underneath — track the dismissal separately so it doesn't pop back
  // up when the user returns from Account to this still-open screen.
  const [completionAcknowledged, setCompletionAcknowledged] = useState(false);
  const [mode, setMode] = useState<ModeKey | null>(null);
  const [pickerVisible, setPickerVisible] = useState(true);

  const queueRef = useRef<Word[]>(initial.queue);
  const nextPairIdRef = useRef(initial.nextPairId);
  const gameEndedRef = useRef(false);
  const pendingXpRef = useRef(0);
  const pendingActivityKeyRef = useRef('');




  const pendingRefillSlotsRef = useRef<{ enIndex: number; frIndex: number }[]>([]);
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);



  type CardAnim = { opacity: Animated.Value; scale: Animated.Value; translateY: Animated.Value };
  const cardAnimsRef = useRef<Map<string, CardAnim>>(new Map());
  const prevPairIdsRef = useRef<Map<string, string | null>>(new Map());

  const getCardAnim = (slotKey: string): CardAnim => {
    let anim = cardAnimsRef.current.get(slotKey);
    if (!anim) {
      anim = {
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.94),
        translateY: new Animated.Value(CARD_ENTER_OFFSET),
      };
      cardAnimsRef.current.set(slotKey, anim);
    }
    return anim;
  };

  const playExitAnimation = (slotKey: string) => {
    const anim = getCardAnim(slotKey);
    Animated.parallel([
      Animated.timing(anim.opacity, { toValue: 0, duration: CARD_EXIT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(anim.scale, { toValue: 0.86, duration: CARD_EXIT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(anim.translateY, { toValue: -CARD_ENTER_OFFSET, duration: CARD_EXIT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  useEffect(() => {
    (['en', 'fr'] as const).forEach((column) => {
      board[column].forEach((slot, index) => {
        const slotKey = `${column}-${index}`;
        const currentPairId = slot?.pairId ?? null;
        const prevPairId = prevPairIdsRef.current.get(slotKey);

        if (currentPairId && currentPairId !== prevPairId) {
          const anim = getCardAnim(slotKey);
          anim.opacity.setValue(0);
          anim.scale.setValue(0.97);
          anim.translateY.setValue(CARD_ENTER_OFFSET);
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: CARD_ENTER_MS, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(anim.scale, { toValue: 1, duration: CARD_ENTER_MS, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(anim.translateY, { toValue: 0, duration: CARD_ENTER_MS, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
          ]).start();
        }

        prevPairIdsRef.current.set(slotKey, currentPairId);
      });
    });
  }, [board]);

  const startGame = (modeKey: ModeKey) => {
    const fresh = buildInitialBoard(words);


    cardAnimsRef.current.clear();
    prevPairIdsRef.current.clear();
    gameEndedRef.current = false;
    pendingRefillSlotsRef.current = [];
    setBoard({ en: fresh.en, fr: fresh.fr });
    queueRef.current = fresh.queue;
    nextPairIdRef.current = fresh.nextPairId;
    setSelected({ en: null, fr: null });
    setWrongPair(null);
    setInputLocked(false);
    setMatchedCount(0);
    setScore(startingScore);
    setStreak(startingStreak);
    setBestStreak(startingStreak);
    setSessionXp(0);
    pendingXpRef.current = 0;
    pendingActivityKeyRef.current = '';
    setTimeLeft(getModeSeconds(MODES.find((m) => m.key === modeKey)!.secondsPerWord, totalWords));
    setGameOver(false);
    setCompletionAcknowledged(false);
    setComboBonusAvailable(false);
    setComboBonusActive(false);
    bonusMatchesRef.current = 0;
    setMode(modeKey);
    setPickerVisible(false);
  };




  const endGame = async (finalMatchedCount: number, modeKey: ModeKey, awardXp: boolean) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    // A finished run counts toward the streak whether or not it earned XP, and
    // independently of whether the student claims it on the game-over card.
    void recordPracticeToday();

    if (awardXp) {
      const activeMode = MODES.find((m) => m.key === modeKey) ?? MODES[1];
      const baseXp = finalMatchedCount * activeMode.xpPerPair;
      // Matches made while the combo bonus was active earn the extra 0.5x on top of the base rate.
      const bonusXp = Math.round(bonusMatchesRef.current * activeMode.xpPerPair * (COMBO_BONUS_MULTIPLIER - 1));
      const finalXp = baseXp + bonusXp;
      // Banked when the student claims it on the game-over card — see claimSessionXp.
      pendingXpRef.current = finalXp;
      pendingActivityKeyRef.current = buildRunActivityKey(modeKey);
      // Clearing the same board again today is worth a fraction, so the card has to show
      // what claiming really gives rather than the run's face value.
      setSessionXp(
        await previewActivityXPOnceToday(
          pendingActivityKeyRef.current,
          finalXp,
          VOCAB_RUSH_REPLAY_XP_FRACTION
        )
      );
    }
    setGameOver(true);
  };

  const claimSessionXp = useCallback(async () => {
    const pending = pendingXpRef.current;
    const activityKey = pendingActivityKeyRef.current;
    pendingXpRef.current = 0;
    pendingActivityKeyRef.current = '';
    if (pending <= 0 || !activityKey) return 0;

    const granted = await awardActivityXPOnceToday(activityKey, pending, VOCAB_RUSH_REPLAY_XP_FRACTION);
    setSessionXp(granted);
    return granted;
  }, []);






  const isFocused = useIsFocused();
  const wasFocusedRef = useRef(isFocused);

  useEffect(() => {
    const wasFocused = wasFocusedRef.current;
    wasFocusedRef.current = isFocused;

    if (isFocused && !wasFocused && mode && !pickerVisible && !gameOver) {
      setTimeLeft(getModeSeconds(MODES.find((m) => m.key === mode)!.secondsPerWord, totalWords));
    }
  }, [isFocused, mode, pickerVisible, gameOver, totalWords]);

  const paused = pickerVisible || gameOver || !isFocused;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (timeLeft === 0 && !gameOver && !gameEndedRef.current) {
      void endGame(matchedCount, mode ?? defaultMode, false);
    }
  }, [timeLeft, gameOver, matchedCount, mode]);

  useEffect(() => {
    const shouldPulse = timeLeft > 0 && timeLeft <= 5 && !gameOver;
    if (shouldPulse) {
      if (!timerPulseLoopRef.current) {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(timerPulseAnim, { toValue: 1.22, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(timerPulseAnim, { toValue: 1, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
          ])
        );
        timerPulseLoopRef.current = loop;
        loop.start();
      }
    } else if (timerPulseLoopRef.current) {
      timerPulseLoopRef.current.stop();
      timerPulseLoopRef.current = null;
      timerPulseAnim.setValue(1);
    }
  }, [timeLeft, gameOver, timerPulseAnim]);

  useEffect(() => {
    if (totalWords > 0 && matchedCount >= totalWords && !gameOver && !gameEndedRef.current) {
      void endGame(matchedCount, mode ?? defaultMode, true);
    }
  }, [matchedCount, totalWords, gameOver, mode]);

  useEffect(() => {
    if (selected.en === null || selected.fr === null) return;

    const enCard = board.en[selected.en];
    const frCard = board.fr[selected.fr];
    if (!enCard || !frCard) {
      setSelected({ en: null, fr: null });
      return;
    }

    const enIndex = selected.en;
    const frIndex = selected.fr;

    if (enCard.pairId === frCard.pairId) {
      triggerSuccessHaptic();

      if (comboBonusActive) bonusMatchesRef.current += 1;
      setScore((s) => s + Math.round(SCORE_PER_MATCH * (comboBonusActive ? COMBO_BONUS_MULTIPLIER : 1)));
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((best) => Math.max(best, next));
        if (next >= COMBO_BONUS_STREAK_THRESHOLD && !comboBonusActive) setComboBonusAvailable(true);
        return next;
      });
      setMatchedCount((c) => c + 1);
      setSelected({ en: null, fr: null });
      setInputLocked(true);
      playExitAnimation(`en-${enIndex}`);
      playExitAnimation(`fr-${frIndex}`);

      setTimeout(() => {
        pendingRefillSlotsRef.current.push({ enIndex, frIndex });

        if (pendingRefillSlotsRef.current.length < 2 && queueRef.current.length > 0) {


          setBoard((prev) => {
            const next = { en: [...prev.en], fr: [...prev.fr] };
            next.en[enIndex] = null;
            next.fr[frIndex] = null;
            return next;
          });
          setInputLocked(false);
          return;
        }

        const slotsToFill = pendingRefillSlotsRef.current;
        pendingRefillSlotsRef.current = [];

        setBoard((prev) => {
          const next = { en: [...prev.en], fr: [...prev.fr] };

          slotsToFill.forEach(({ enIndex: pendingEnIndex, frIndex: pendingFrIndex }) => {
            const nextWord = queueRef.current.shift();

            if (nextWord) {
              const pairId = `w${nextPairIdRef.current++}`;
              next.en[pendingEnIndex] = { pairId, word: nextWord };
              next.fr[pendingFrIndex] = { pairId, word: nextWord };
            } else {
              next.en[pendingEnIndex] = null;
              next.fr[pendingFrIndex] = null;
            }
          });

          return next;
        });
        setInputLocked(false);
      }, REFILL_DELAY_MS);
    } else {
      triggerWarningHaptic();
      setStreak(0);
      setComboBonusAvailable(false);
      setComboBonusActive(false);
      setInputLocked(true);
      setWrongPair({ en: enIndex, fr: frIndex });

      setTimeout(() => {
        setSelected({ en: null, fr: null });
        setWrongPair(null);
        setInputLocked(false);
      }, WRONG_PAIR_LOCKOUT_MS);
    }
  }, [selected, board, comboBonusActive]);

  const activateComboBonus = () => {
    if (!comboBonusAvailable) return;
    triggerSelectionHaptic();
    setComboBonusAvailable(false);
    setComboBonusActive(true);
  };

  const handleCardPress = (column: 'en' | 'fr', index: number) => {
    if (paused || inputLocked) return;
    if (!board[column][index]) return;




    const otherColumn = column === 'en' ? 'fr' : 'en';
    if (selected[otherColumn] === null) {
      triggerSelectionHaptic();
    }
    setSelected((prev) => ({ ...prev, [column]: index }));
  };


  const useApkPreviewLayout = isApkLayoutPreviewEnabled();
  const isAndroidTabBarLayout = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebTabBarLocal = Platform.OS === 'web' && !useApkPreviewLayout;
  const isMobileWebTabBar = isWebTabBarLocal && windowWidth < DESKTOP_WEB_MIN_WIDTH;
  const isCompactTabBar = windowWidth < NARROW_TRAY_WIDTH;
  const isLargeTabBar = windowWidth >= LARGE_WIDTH;
  const tabBarScale = isWebTabBarLocal ? desktopUiScale : 1;
  const tabBarIconSize = isMobileWebTabBar
    ? 26
    : Math.round((isCompactTabBar ? 22 : isLargeTabBar ? 23 : 22) * tabBarScale);
  const tabBarLabelFontSize = Math.round((isCompactTabBar ? 11 : isLargeTabBar ? 12 : 11) * tabBarScale);
  const tabBarLabelLineHeight = Math.round((isCompactTabBar ? 13 : isLargeTabBar ? 14 : 13) * tabBarScale);


  const androidSystemNavInset = isAndroidTabBarLayout ? getBottomSafeAreaInset(insets.bottom, 24) : 0;
  const tabBarBaseHeight = isWebTabBarLocal
    ? Math.round((isCompactTabBar ? 58 : isLargeTabBar ? 60 : 58) * tabBarScale)
    : (isCompactTabBar ? 48 : isLargeTabBar ? 50 : 48);
  const tabBarHeight = tabBarBaseHeight + androidSystemNavInset;
  const tabBarBackgroundColor = isDarkMode
    ? themeColors.card
    : isAndroidTabBarLayout
      ? getAndroidBottomBarColor(isDarkMode, themeColors)
      : 'rgba(255, 255, 255, 0.82)';
  const tabBarBorderColor = isAndroidTabBarLayout ? 'transparent' : themeColors.border;
  const tabBarTopBorderWidth = isAndroidTabBarLayout ? 0 : StyleSheet.hairlineWidth;
  const tabRouteColors: Record<string, string> = isShinyElliePresentationMode ? SHINY_HOME_MENU_ROUTE_COLORS : HOME_MENU_ROUTE_COLORS;

  const navItems: { key: NavKey; route: string; icon: ComponentProps<typeof MaterialIcons>['name']; label: string }[] = [
    { key: 'grammar', route: 'Grammar', icon: 'edit', label: menuCopy.home.grammarTitle },
    { key: 'vocabulary', route: 'Vocabulary', icon: 'style', label: isCompactTabBar ? 'Vocab' : menuCopy.home.vocabularyTitle },
    { key: 'lessons', route: 'Lessons', icon: 'menu-book', label: isCompactTabBar ? menuCopy.lessons.chapters : menuCopy.lessons.header },
    { key: 'settings', route: 'Settings', icon: 'settings', label: menuCopy.home.settingsTitle },
  ];


  const horizontalPadding = windowWidth < 480 ? 20 : Math.round(48 * desktopUiScale);
  const columnGap = windowWidth < 480 ? Math.round(GRID_COLUMN_GAP * 0.4) : Math.round(GRID_COLUMN_GAP * desktopUiScale);
  const gridMaxWidth = Math.round(GRID_MAX_WIDTH * desktopUiScale);
  const gridContentWidth = Math.min(windowWidth - horizontalPadding * 2, gridMaxWidth);
  const columnWidth = Math.max(50, (gridContentWidth - columnGap) / 2);


  const availableHeight = Math.max(300, windowHeight - insets.top - tabBarHeight);
  const chromeScale = clampNum(availableHeight / CHROME_REFERENCE_HEIGHT, MIN_CHROME_SCALE, MAX_CHROME_SCALE);
  const sc = (base: number) => Math.round(base * chromeScale);

  const containerPaddingV = Math.max(10, sc(20));
  const backButtonSize = Math.max(38, sc(56));
  const headerFontSize = Math.max(16, sc(24));
  const timerFontSize = Math.max(28, sc(52));
  const statValueFontSize = Math.max(15, sc(26));
  const statLabelFontSize = Math.max(9, sc(12));
  const dividerHeight = Math.max(22, sc(44));
  const statsMarginTop = Math.max(6, sc(16));
  const statsGap = Math.max(10, sc(22));
  const instructionFontSize = Math.max(11, sc(15));
  const instructionMarginTop = Math.max(6, sc(18));
  const gridMarginTop = Math.max(8, sc(26));
  const rowGap = Math.max(9, sc(24));

  const statsRowHeight = Math.max(timerFontSize, statLabelFontSize + statValueFontSize + 2);
  const instructionLineHeight = instructionFontSize + 6;




  const chromeHeight =
    containerPaddingV +
    backButtonSize +
    statsMarginTop + statsRowHeight +
    instructionMarginTop + instructionLineHeight +
    gridMarginTop;



  const chromeSafetyMargin = 20;
  const gridHeight = Math.max(boardSize * 30, availableHeight - chromeHeight - chromeSafetyMargin);





  const cardWidth = Math.round(columnWidth * (windowWidth < 480 ? 0.86 : 0.9));
  const cardHeightFromBudget = (gridHeight - (boardSize - 1) * rowGap) / boardSize;
  const cardHeight = clampNum(cardHeightFromBudget, 36, 100 * desktopUiScale);
  const cardFontSize = clampNum(cardHeight * 0.38, 11, 16 * desktopUiScale);

  const renderCard = (column: 'en' | 'fr', index: number) => {
    const slot = board[column][index];
    const slotKey = `${column}-${index}`;
    const anim = getCardAnim(slotKey);
    const animatedStyle = {
      opacity: anim.opacity,
      transform: [{ scale: anim.scale }, { translateY: anim.translateY }],
    };

    if (!slot) {
      return (
        <Animated.View key={slotKey} style={[{ width: cardWidth, height: cardHeight }, animatedStyle]}>
          <View
            style={[
              styles.card,
              styles.matchedCard,
              { width: '100%', height: '100%', borderColor: colors.matchedBorder, backgroundColor: colors.matchedBg },
            ]}
          >
            <Text style={[styles.matchedCheck, { fontSize: clampNum(cardHeight * 0.2, 12, 16), color: colors.matchedCheck }]}>✓</Text>
          </View>
        </Animated.View>
      );
    }

    const isSelected = selected[column] === index;
    const isWrong = wrongPair?.[column] === index;
    const isDimmed = wrongPair !== null && !isWrong;
    const text = column === 'en' ? slot.word.english : slot.word.french;

    return (
      <Animated.View key={slotKey} style={[{ width: cardWidth, height: cardHeight }, animatedStyle]}>
        <Pressable
          onPress={() => handleCardPress(column, index)}
          style={[
            styles.card,
            { width: '100%', height: '100%' },
            isWrong
              ? { backgroundColor: wrongBg, borderWidth: 1.5, borderColor: wrongBorderColor }
              : isSelected
                ? [styles.cardSelected, { backgroundColor: colors.cardSelectedBg }]
                : [styles.cardDefault, { backgroundColor: colors.cardBg }],
            isDimmed && styles.cardDimmed,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
          ]}
        >
          <Text
            style={[
              styles.cardText,
              { fontSize: cardFontSize, color: colors.cardText },
              isWrong ? { color: wrongTextColor } : isSelected && { color: colors.cardSelectedText },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {text}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          { paddingTop: containerPaddingV + insets.top, paddingHorizontal: horizontalPadding },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={[styles.backButton, { width: backButtonSize, height: backButtonSize, backgroundColor: colors.cardBg }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backButtonText, { fontSize: Math.max(14, Math.round(backButtonSize * 0.36)), color: colors.backButtonIcon }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { fontSize: headerFontSize, color: colors.title }]}>⚡ Vocab Rush</Text>
          <View style={{ width: backButtonSize, height: backButtonSize }} />
        </View>

        <View style={[styles.statsRow, { gap: statsGap, marginTop: statsMarginTop }]}>
          <Pressable
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change speed"
          >
            <Animated.View style={{ transform: [{ scale: timerPulseAnim }] }}>
              <Text style={[styles.timerValue, { fontSize: timerFontSize, color: colors.timerRed }]}>{timeLeft}s</Text>
            </Animated.View>
          </Pressable>
          <View style={[styles.divider, { height: dividerHeight, backgroundColor: colors.divider }]} />
          <View style={styles.statBlock}>
            <Text style={[styles.statLabel, { fontSize: statLabelFontSize, color: colors.comboLabel }]}>COMBO</Text>
            <Text style={[styles.comboValue, { fontSize: statValueFontSize, color: colors.comboValue }]}>×{streak}</Text>
          </View>
          <View style={[styles.divider, { height: dividerHeight, backgroundColor: colors.divider }]} />
          <View style={styles.statBlock}>
            <Text style={[styles.statLabel, { fontSize: statLabelFontSize, color: colors.comboLabel }]}>SCORE</Text>
            <Text style={[styles.scoreValue, { fontSize: statValueFontSize, color: colors.scoreValue }]}>{score}</Text>
          </View>
        </View>

        {(comboBonusAvailable || comboBonusActive) && (
          <Pressable
            onPress={activateComboBonus}
            disabled={!comboBonusAvailable}
            accessibilityRole="button"
            accessibilityLabel={comboBonusActive ? '1.5x combo bonus active' : 'Activate 1.5x combo bonus'}
            accessibilityState={{ disabled: !comboBonusAvailable }}
            style={[
              styles.comboBonusButton,
              { backgroundColor: colors.timerRed, opacity: comboBonusActive ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.comboBonusButtonText}>
              {comboBonusActive ? '🔥 1.5x BONUS ACTIVE' : '🔥 30 COMBO! TAP FOR 1.5x'}
            </Text>
          </Pressable>
        )}

        <Text style={[styles.instruction, { fontSize: instructionFontSize, marginTop: instructionMarginTop, color: colors.instructionText }]}>
          Match every English word to its French translation
        </Text>

        <View style={[styles.grid, { columnGap, marginTop: gridMarginTop, maxWidth: gridMaxWidth }]}>
          <View style={[styles.column, { rowGap }]}>
            {board.en.map((_, index) => renderCard('en', index))}
          </View>
          <View style={[styles.column, { rowGap }]}>
            {board.fr.map((_, index) => renderCard('fr', index))}
          </View>
        </View>

        <View style={styles.spacer} />
      </View>

      <View
        style={[
          styles.bottomNav,
          {
            height: tabBarHeight,
            paddingBottom: androidSystemNavInset,
            backgroundColor: tabBarBackgroundColor,
            borderTopWidth: tabBarTopBorderWidth,
            borderTopColor: tabBarBorderColor,
          },
        ]}
      >
        {navItems.map((item) => {
          const active = item.route === 'Vocabulary';
          const iconColor = active ? (tabRouteColors[item.route] ?? themeColors.primary) : themeColors.secondaryText;
          const labelColor = active ? themeColors.text : themeColors.secondaryText;

          return (
            <Pressable
              key={item.key}
              onPress={() => onNavigate(item.key)}
              style={[styles.navItem, isMobileWebTabBar && styles.navItemMobileWeb]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[styles.tabIconPill, isMobileWebTabBar && styles.tabIconPillMobileWeb]}>
                <MaterialIcons name={item.icon} size={tabBarIconSize} color={iconColor} />
              </View>
              {!isMobileWebTabBar && (
                <Text style={{ color: labelColor, fontSize: tabBarLabelFontSize, lineHeight: tabBarLabelLineHeight, textAlign: 'center' }}>
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <VocabRushGameOverCard
        visible={gameOver && !pickerVisible && timeLeft === 0 && !completionAcknowledged}
        score={score}
        sessionXp={sessionXp}
        onClaimXP={claimSessionXp}
        bestCombo={bestStreak}
        matchedCount={matchedCount}
        totalWords={totalWords}
        isDarkMode={isDarkMode}
        themeColors={themeColors}
        onPlayAgain={() => startGame(mode ?? defaultMode)}
        onBack={onBack}
        onGoToAccount={onGoToAccount ? () => {
          setCompletionAcknowledged(true);
          onGoToAccount();
        } : undefined}
      />

      <VocabularyCompletionModal
        visible={gameOver && !pickerVisible && timeLeft > 0 && !completionAcknowledged}
        timerMode
        wordsLength={totalWords}
        isDarkMode={isDarkMode}
        onReplay={() => startGame(mode ?? defaultMode)}
        isFirstCompletion={false}
        isPersonalBest={false}
        colors={themeColors}
        startedTimerMode
        matchingSessionXp={sessionXp}
        onClaimXP={claimSessionXp}
        statsItems={[
          { emoji: '⚡', value: sessionXp, label: 'XP' },
          { emoji: '🔥', value: bestStreak, label: 'Best combo' },
          { emoji: '✅', value: matchedCount, label: 'Matched' },
        ]}
        title="All matched!"
        subtitle={`${score} pts this round`}
        primaryActionLabel="Play again"
        onPrimaryAction={() => startGame(mode ?? defaultMode)}
        secondaryActionLabel="Back to Vocabulary"
        onSecondaryAction={onBack}
        onGoToAccount={onGoToAccount ? () => {
          setCompletionAcknowledged(true);
          onGoToAccount();
        } : undefined}
      />

      {pickerVisible && (
        <View style={styles.overlay}>
          <View style={[styles.overlayCard, { backgroundColor: colors.cardBg }]}>
            {mode !== null && (
              <Pressable
                onPress={() => setPickerVisible(false)}
                style={[styles.pickerClose, { backgroundColor: colors.progressTrack }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.pickerCloseText, { color: colors.comboLabel }]}>✕</Text>
              </Pressable>
            )}
            <Text style={[styles.overlayTitle, { color: colors.title }]}>Pick your pace</Text>
            <Text style={[styles.overlaySubtext, { color: colors.comboLabel }]}>How much heat can you handle?</Text>
            <View style={styles.pickerModeList}>
              {MODES.map((m) => {
                const isActive = (mode ?? defaultMode) === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => startGame(m.key)}
                    style={[
                      styles.pickerModeButton,
                      { backgroundColor: colors.pickerButtonBg, borderColor: colors.progressTrack },
                      m.key === 'impossible' && !isActive && { borderColor: m.accent },
                      isActive && { backgroundColor: m.accent, borderColor: m.accent },
                    ]}
                  >
                    <View style={styles.pickerModeLeft}>
                      <Text style={styles.pickerModeEmoji}>{m.emoji}</Text>
                      <View>
                        <Text style={[styles.pickerModeLabel, { color: colors.title }, isActive && styles.pickerModeLabelActive]}>{m.label}</Text>
                        <Text style={[styles.pickerModeTagline, { color: colors.comboLabel }, isActive && styles.pickerModeLabelActive]}>{m.tagline}</Text>
                      </View>
                    </View>
                    <View style={styles.pickerModeRight}>
                      <Text style={[styles.pickerModeSeconds, { color: colors.comboLabel }, isActive && styles.pickerModeLabelActive]}>
                        {getModeSeconds(m.secondsPerWord, totalWords)}s
                      </Text>
                      <Text style={[styles.pickerModeXp, { color: colors.comboLabel }, isActive && styles.pickerModeLabelActive]}>
                        +{totalWords * m.xpPerPair} XP
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      },
    }),
  },
  backButtonText: {},
  title: {
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValue: {
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1.5,
  },
  statBlock: {
    alignItems: 'center',
  },
  statLabel: {
    fontWeight: '700',
    fontFamily: fontFamilyForWeight('700'),
    textTransform: 'uppercase',
    letterSpacing: 0.48,
  },
  comboValue: {
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
  },
  scoreValue: {
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
  },
  instruction: {
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: fontFamilyForWeight('700'),
  },
  comboBonusButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  comboBonusButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
  },
  column: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  card: {
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDefault: {





    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.05)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
    }),
  },
  cardSelected: {},
  cardDimmed: {
    opacity: 0.6,
  },
  cardText: {
    fontWeight: '400',
    fontFamily: fontFamilyForWeight('400'),
    textAlign: 'center',
  },
  matchedCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  matchedCheck: {},
  spacer: {
    flex: 1,
    minHeight: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 3,
  },
  navItemMobileWeb: {
    paddingTop: 0,
  },
  tabIconPill: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconPillMobileWeb: {
    width: 52,
    height: 44,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,26,16,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
  },
  overlaySubtext: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilyForWeight('600'),
    marginTop: 6,
  },
  pickerClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamilyForWeight('700'),
  },
  pickerModeList: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  pickerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1.5,
  },
  pickerModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerModeEmoji: {
    fontSize: 19,
  },
  pickerModeLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamilyForWeight('700'),
  },
  pickerModeTagline: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamilyForWeight('600'),
    marginTop: 1,
  },
  pickerModeRight: {
    alignItems: 'flex-end',
  },
  pickerModeSeconds: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
  },
  pickerModeXp: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fontFamilyForWeight('600'),
    marginTop: 2,
  },
  pickerModeLabelActive: {
    color: '#ffffff',
  },
});
