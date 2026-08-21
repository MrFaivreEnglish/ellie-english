import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { vocabRushColors, vocabRushColorsForTheme } from './vocabRushColors';
import { shuffleArray } from '../vocabularyUtils';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../../shared/haptics';
import { addXP } from '../../progress/xpStorage';
import { useTheme } from '../../settings/ThemeContext';
import { getMenuCopy } from '../../shared/menuCopy';
import { HOME_MENU_ROUTE_COLORS, SHINY_HOME_MENU_ROUTE_COLORS } from '../../shared/homeMenuColors';
import { getAndroidBottomBarColor } from '../../shared/appChromeColors';
import { isApkLayoutPreviewEnabled } from '../../shared/apkPreview';
import VocabRushGameOverCard from './VocabRushGameOverCard';
import VocabularyCompletionModal from '../VocabularyCompletionModal';
import { fontFamilyForWeight } from './vocabRushFonts';
import type { Word } from '../../../types/VocabularyTypes';

const BOARD_SIZE = 6;
// On-screen "SCORE" stat during play — independent of the XP formula below.
const SCORE_PER_MATCH = 1;
// Matches the classic matching screen's WRONG_MATCH_FEEDBACK_MS exactly.
const WRONG_PAIR_LOCKOUT_MS = 650;
const REFILL_DELAY_MS = 150;
const GRID_MAX_WIDTH = 820;
const GRID_COLUMN_GAP = 60;
// Card enter/exit timings — same feel as the classic screen's refill animation.
const CARD_ENTER_MS = 170;
const CARD_EXIT_MS = 130;
const CARD_ENTER_OFFSET = 8;

type ModeKey = 'easy' | 'normal' | 'hard' | 'impossible';

// Timer scales with how many words are actually in play (secondsPerWord × totalWords)
// rather than a fixed duration — a 3-word test session and a 30-word full session both
// feel like "Easy" instead of one being absurdly long or the other absurdly rushed.
// XP is a flat amount per matched pair, awarded once at the end — only when every
// word gets matched before time runs out, never on a timeout ("game over").
const MODES: { key: ModeKey; label: string; secondsPerWord: number; xpPerPair: number; emoji: string; tagline: string; accent: string }[] = [
  { key: 'easy', label: 'Easy', secondsPerWord: 3, xpPerPair: 1, emoji: '🐢', tagline: 'Chill vibes only', accent: '#3FA867' },
  { key: 'normal', label: 'Normal', secondsPerWord: 2, xpPerPair: 2, emoji: '🙂', tagline: 'Nice and steady', accent: vocabRushColors.comboValue },
  { key: 'hard', label: 'Hard', secondsPerWord: 1.5, xpPerPair: 3, emoji: '🔥', tagline: 'Getting spicy', accent: '#e8792b' },
  { key: 'impossible', label: 'Impossible', secondsPerWord: 1, xpPerPair: 5, emoji: '💀', tagline: 'Good luck with that', accent: vocabRushColors.timerRed },
];
// Highest xpPerPair across all modes ('Impossible') — the ceiling shown as
// "max XP possible" wherever we tease Vocab Rush before the mode is picked.
export const MAX_XP_PER_PAIR = Math.max(...MODES.map((m) => m.xpPerPair));
const MIN_MODE_SECONDS = 8;
const getModeSeconds = (secondsPerWord: number, totalWords: number) =>
  Math.max(MIN_MODE_SECONDS, Math.round(secondsPerWord * Math.max(1, totalWords)));

// Reference viewport height at which every element renders at its full spec size.
// Shorter viewports (phones, APK, mobile web) scale the chrome down so the whole
// screen — header through bottom nav — always fits without scrolling.
const CHROME_REFERENCE_HEIGHT = 860;
const MIN_CHROME_SCALE = 0.62;

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
  const { colors: themeColors, isDarkMode, isShinyEllieMode } = useTheme();
  const colors = vocabRushColorsForTheme(isDarkMode, themeColors);
  const menuCopy = getMenuCopy();
  // Same "wrong pair" feedback colors as the classic matching screen.
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
  const [mode, setMode] = useState<ModeKey | null>(null);
  const [pickerVisible, setPickerVisible] = useState(true);

  const queueRef = useRef<Word[]>(initial.queue);
  const nextPairIdRef = useRef(initial.nextPairId);
  const gameEndedRef = useRef(false);
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Per-slot (not per-card) enter/exit animation — reused across content swaps so a
  // card fades+slides out and the next one fades+slides in at the same board position.
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
          anim.scale.setValue(0.94);
          anim.translateY.setValue(CARD_ENTER_OFFSET);
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: CARD_ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(anim.scale, { toValue: 1, duration: CARD_ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(anim.translateY, { toValue: 0, duration: CARD_ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
          ]).start();
        }

        prevPairIdsRef.current.set(slotKey, currentPairId);
      });
    });
  }, [board]);

  const startGame = (modeKey: ModeKey) => {
    const fresh = buildInitialBoard(words);
    // Pair ids restart from w0 each game — clear anim tracking so slots replay their
    // enter animation instead of being mistaken for "unchanged" from the last session.
    cardAnimsRef.current.clear();
    prevPairIdsRef.current.clear();
    gameEndedRef.current = false;
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
    setTimeLeft(getModeSeconds(MODES.find((m) => m.key === modeKey)!.secondsPerWord, totalWords));
    setGameOver(false);
    setMode(modeKey);
    setPickerVisible(false);
  };

  // XP is only awarded when the round ends because every word got matched — never on
  // a timeout ("game over"). Awarding happens (and resolves) before `gameOver` flips,
  // so by the time the completion screen reads total XP to detect a level-up, it's in.
  const endGame = async (finalMatchedCount: number, modeKey: ModeKey, awardXp: boolean) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    if (awardXp) {
      const activeMode = MODES.find((m) => m.key === modeKey) ?? MODES[1];
      const finalXp = finalMatchedCount * activeMode.xpPerPair;
      setSessionXp(finalXp);
      if (finalXp > 0) {
        await addXP(finalXp);
      }
    }
    setGameOver(true);
  };

  // Leaving this screen mid-round (tab switch, back button) used to leave the
  // interval running or resume the stale countdown on return — the round would
  // silently burn through the clock while the player wasn't even looking at it.
  // Losing focus now pauses the timer; regaining focus mid-round resets it to a
  // fresh full duration for the current mode instead of resuming where it left off.
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

      setScore((s) => s + SCORE_PER_MATCH);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
      setMatchedCount((c) => c + 1);
      setSelected({ en: null, fr: null });
      setInputLocked(true);
      playExitAnimation(`en-${enIndex}`);
      playExitAnimation(`fr-${frIndex}`);

      setTimeout(() => {
        setBoard((prev) => {
          const nextWord = queueRef.current.shift();
          const next = { en: [...prev.en], fr: [...prev.fr] };

          if (nextWord) {
            const pairId = `w${nextPairIdRef.current++}`;
            next.en[enIndex] = { pairId, word: nextWord };
            next.fr[frIndex] = { pairId, word: nextWord };
          } else {
            next.en[enIndex] = null;
            next.fr[frIndex] = null;
          }

          return next;
        });
        setInputLocked(false);
      }, REFILL_DELAY_MS);
    } else {
      triggerWarningHaptic();
      setStreak(0);
      setInputLocked(true);
      setWrongPair({ en: enIndex, fr: frIndex });

      setTimeout(() => {
        setSelected({ en: null, fr: null });
        setWrongPair(null);
        setInputLocked(false);
      }, WRONG_PAIR_LOCKOUT_MS);
    }
  }, [selected, board]);

  const handleCardPress = (column: 'en' | 'fr', index: number) => {
    if (paused || inputLocked) return;
    if (!board[column][index]) return;

    triggerSelectionHaptic();
    setSelected((prev) => ({ ...prev, [column]: index }));
  };

  // --- Bottom nav — a faithful clone of the real app tab bar (App.tsx MainTabNavigator) ---
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();
  const isAndroidTabBarLayout = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebTabBarLocal = Platform.OS === 'web' && !useApkPreviewLayout;
  const isCompactTabBar = windowWidth < 430;
  const isLargeTabBar = windowWidth >= 900;
  const tabBarIconSize = isCompactTabBar ? 22 : isLargeTabBar ? 23 : 22;
  const tabBarLabelFontSize = isCompactTabBar ? 11 : isLargeTabBar ? 12 : 11;
  const tabBarLabelLineHeight = isCompactTabBar ? 13 : isLargeTabBar ? 14 : 13;
  const androidSystemNavInset = isAndroidTabBarLayout ? Math.max(insets.bottom, 24) : 0;
  const tabBarBaseHeight = isWebTabBarLocal ? (isCompactTabBar ? 58 : isLargeTabBar ? 60 : 58) : (isCompactTabBar ? 48 : isLargeTabBar ? 50 : 48);
  const tabBarHeight = tabBarBaseHeight + androidSystemNavInset;
  const tabBarBackgroundColor = isDarkMode
    ? themeColors.card
    : isAndroidTabBarLayout
      ? getAndroidBottomBarColor(isDarkMode, themeColors)
      : 'rgba(255, 255, 255, 0.82)';
  const tabBarBorderColor = isAndroidTabBarLayout ? 'transparent' : isDarkMode ? themeColors.border : 'rgba(0,0,0,0.08)';
  const tabBarTopBorderWidth = isAndroidTabBarLayout ? 0 : StyleSheet.hairlineWidth;
  const tabRouteColors: Record<string, string> = isShinyEllieMode ? SHINY_HOME_MENU_ROUTE_COLORS : HOME_MENU_ROUTE_COLORS;

  const navItems: { key: NavKey; route: string; icon: ComponentProps<typeof MaterialIcons>['name']; label: string }[] = [
    { key: 'grammar', route: 'Grammar', icon: 'edit', label: menuCopy.home.grammarTitle },
    { key: 'vocabulary', route: 'Vocabulary', icon: 'style', label: isCompactTabBar ? 'Vocab' : menuCopy.home.vocabularyTitle },
    { key: 'lessons', route: 'Lessons', icon: 'menu-book', label: isCompactTabBar ? menuCopy.lessons.chapters : menuCopy.lessons.header },
    { key: 'settings', route: 'Settings', icon: 'settings', label: menuCopy.home.settingsTitle },
  ];

  // --- Horizontal fit (width-driven) ---
  const horizontalPadding = windowWidth < 480 ? 20 : 48;
  const columnGap = windowWidth < 480 ? Math.round(GRID_COLUMN_GAP * 0.4) : GRID_COLUMN_GAP;
  const gridContentWidth = Math.min(windowWidth - horizontalPadding * 2, GRID_MAX_WIDTH);
  const columnWidth = Math.max(50, (gridContentWidth - columnGap) / 2);

  // --- Vertical fit (height-driven) — scales chrome so header..grid always fits above the tab bar ---
  const availableHeight = Math.max(300, windowHeight - insets.top - tabBarHeight);
  const chromeScale = clampNum(availableHeight / CHROME_REFERENCE_HEIGHT, MIN_CHROME_SCALE, 1);
  const sc = (base: number) => Math.round(base * chromeScale);

  const containerPaddingV = Math.max(10, sc(20));
  const backButtonSize = Math.max(38, sc(56));
  const headerFontSize = Math.max(16, sc(24));
  const timerFontSize = Math.max(28, sc(52));
  const statValueFontSize = Math.max(15, sc(26));
  const statLabelFontSize = Math.max(9, sc(12));
  const dividerHeight = Math.max(22, sc(44));
  const statsMarginTop = Math.max(8, sc(26));
  const statsGap = Math.max(10, sc(22));
  const instructionFontSize = Math.max(11, sc(15));
  const instructionMarginTop = Math.max(10, sc(30));
  const gridMarginTop = Math.max(8, sc(26));
  const rowGap = Math.max(9, sc(24));

  const statsRowHeight = Math.max(timerFontSize, statLabelFontSize + statValueFontSize + 2);
  const instructionLineHeight = instructionFontSize + 6;

  // Everything above the grid, at the sizes above (the tab bar is handled separately, at its own fixed size).
  // No progress bar — the timer + instruction line already communicate pace, and
  // dropping the bar frees up vertical room for shorter cards with more breathing space.
  const chromeHeight =
    containerPaddingV +
    backButtonSize +
    statsMarginTop + statsRowHeight +
    instructionMarginTop + instructionLineHeight +
    gridMarginTop;

  // Small safety buffer — text line-height in real rendering runs a few px past
  // fontSize, so this keeps the last row clear of the tab bar rather than exact-fitting.
  const chromeSafetyMargin = 20;
  const gridHeight = Math.max(boardSize * 30, availableHeight - chromeHeight - chromeSafetyMargin);

  // Cards match the classic matching screen's proportions: width is a wide, fixed
  // share of the column (not derived from height via a strict aspect ratio), and
  // text scales with height the same way so it reads bigger and bolder.
  // Capped shorter than before (was 130) so there's more visible gap between rows.
  const cardWidth = Math.round(columnWidth * (windowWidth < 480 ? 0.86 : 0.9));
  const cardHeightFromBudget = (gridHeight - (boardSize - 1) * rowGap) / boardSize;
  const cardHeight = clampNum(cardHeightFromBudget, 36, 100);
  const cardFontSize = clampNum(cardHeight * 0.38, 11, 16);

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
              isWrong ? { color: wrongTextColor } : isSelected && styles.cardTextSelected,
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

        <Text style={[styles.instruction, { fontSize: instructionFontSize, marginTop: instructionMarginTop, color: colors.instructionText }]}>
          Match every English word to its French translation
        </Text>

        <View style={[styles.grid, { columnGap, marginTop: gridMarginTop, maxWidth: GRID_MAX_WIDTH }]}>
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
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.tabIconPill}>
                <MaterialIcons name={item.icon} size={tabBarIconSize} color={iconColor} />
              </View>
              <Text style={{ color: labelColor, fontSize: tabBarLabelFontSize, lineHeight: tabBarLabelLineHeight, textAlign: 'center' }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Ran out of time: a Match-Madness-specific "game over" screen. */}
      <VocabRushGameOverCard
        visible={gameOver && !pickerVisible && timeLeft === 0}
        score={score}
        sessionXp={sessionXp}
        bestCombo={bestStreak}
        matchedCount={matchedCount}
        totalWords={totalWords}
        isDarkMode={isDarkMode}
        themeColors={themeColors}
        onPlayAgain={() => startGame(mode ?? defaultMode)}
        onBack={onBack}
        onGoToAccount={onGoToAccount}
      />

      {/* Matched everything before time ran out: the same completion screen as the rest of the app. */}
      <VocabularyCompletionModal
        visible={gameOver && !pickerVisible && timeLeft > 0}
        timerMode
        wordsLength={totalWords}
        isDarkMode={isDarkMode}
        onReplay={() => startGame(mode ?? defaultMode)}
        isFirstCompletion={false}
        isPersonalBest={false}
        colors={themeColors}
        startedTimerMode
        matchingSessionXp={sessionXp}
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
        onGoToAccount={onGoToAccount}
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
    // Android's `elevation` shadow is computed from the view's layout bounds,
    // not its rendered/transformed bitmap — it doesn't shrink in sync with the
    // exit animation's `scale` transform, so the shadow visibly detaches from
    // the card mid-animation. Dropping elevation (iOS's shadow* + web's
    // boxShadow both track the transform correctly) fixes that glitch.
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
  cardTextSelected: {
    color: '#ffffff',
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
  tabIconPill: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
