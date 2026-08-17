import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { vocabRushColorsForTheme } from './vocabRushColors';
import { fontFamilyForWeight } from './vocabRushFonts';
import { getXP } from '../../progress/xpStorage';
import { getXPLevel } from '../../progress/xpLevels';
import LevelUpModal from '../../progress/LevelUpModal';
import type { ThemeColors } from '../../settings/ThemeContext';

// Shown only when the round ends because the timer ran out — the "all matched before
// time ran out" case uses the app's normal exercise-complete screen instead.
type Props = {
  visible: boolean;
  score: number;
  sessionXp: number;
  bestCombo: number;
  matchedCount: number;
  totalWords: number;
  isDarkMode: boolean;
  themeColors: ThemeColors;
  onPlayAgain: () => void;
  onBack: () => void;
  onGoToAccount?: () => void;
};

export default function VocabRushGameOverCard({
  visible,
  score,
  sessionXp,
  bestCombo,
  matchedCount,
  totalWords,
  isDarkMode,
  themeColors,
  onPlayAgain,
  onBack,
  onGoToAccount,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const colors = vocabRushColorsForTheme(isDarkMode, themeColors);
  const [currentXP, setCurrentXP] = useState(0);
  const [xpReady, setXpReady] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const hasShownLevelUpRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setXpReady(false);
      setShowLevelUp(false);
      hasShownLevelUpRef.current = false;
      return;
    }

    let active = true;
    getXP()
      .then((xp) => {
        if (!active) return;
        const before = Math.max(0, xp - sessionXp);
        const leveledUp = sessionXp > 0 && getXPLevel(before) < getXPLevel(xp);
        setCurrentXP(xp);
        if (leveledUp && !hasShownLevelUpRef.current) {
          hasShownLevelUpRef.current = true;
          setShowLevelUp(true);
        }
        setXpReady(true);
      })
      .catch(() => {
        if (active) setXpReady(true);
      });

    return () => {
      active = false;
    };
  }, [visible, sessionXp]);

  if (!visible || !xpReady) return null;

  const containerPadding = windowWidth < 480 ? 16 : 24;

  return (
    <>
      {!showLevelUp && (
        <View style={styles.pageBackground}>
          <View style={[styles.stack, { padding: containerPadding }]}>
            <View style={[styles.heroCard, { backgroundColor: colors.cardBg }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.gameOverIconBg }]}>
                <Image
                  source={require('../../../assets/embarrassed.png')}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.title, { color: colors.title }]}>Time's up, game over!</Text>
              <Text style={[styles.body, { color: colors.gameOverSecondaryText }]}>
                You matched {matchedCount} of {totalWords} words. Don't worry, give it another go!
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.statLabel, { color: colors.comboLabel }]}>XP</Text>
                <Text style={[styles.statValue, { color: colors.comboValue }]}>+{sessionXp}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.statLabel, { color: colors.comboLabel }]}>Best Combo</Text>
                <Text style={[styles.statValue, { color: colors.timerRed }]}>×{bestCombo}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.statLabel, { color: colors.comboLabel }]}>Score</Text>
                <Text style={[styles.statValue, { color: colors.title }]}>{score}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onPlayAgain}
                style={[styles.primaryButton, { backgroundColor: colors.comboValue }, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
              >
                <Text style={styles.primaryButtonText}>Play again</Text>
              </Pressable>
              <Pressable
                onPress={onBack}
                style={[styles.secondaryButton, { backgroundColor: colors.cardBg, borderColor: colors.progressTrack }, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.gameOverSecondaryText }]}>Back to Vocabulary</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <LevelUpModal
        visible={showLevelUp}
        totalXP={currentXP}
        sessionXP={sessionXp}
        colors={themeColors}
        isDarkMode={isDarkMode}
        onDismiss={() => {
          setShowLevelUp(false);
          onPlayAgain();
        }}
        dismissLabel="Play again"
        onGoToAccount={onGoToAccount}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,26,16,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
  },
  heroCard: {
    width: '100%',
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 22,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
      },
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 46,
    height: 46,
  },
  title: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
    textAlign: 'center',
  },
  body: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamilyForWeight('600'),
    textAlign: 'center',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
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
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fontFamilyForWeight('700'),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fontFamilyForWeight('800'),
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
  },
  primaryButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamilyForWeight('700'),
    color: '#ffffff',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilyForWeight('600'),
    textAlign: 'center',
  },
});
