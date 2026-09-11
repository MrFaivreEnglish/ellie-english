import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Text from '../../shared/ThemedText';
import { vocabRushColorsForTheme } from './vocabRushColors';
import { getXP } from '../../progress/xpStorage';
import { getXPLevel } from '../../progress/xpLevels';
import LevelUpModal from '../../progress/LevelUpModal';
import SessionResultCard, {
  SessionResultActions,
  SessionResultStats,
} from '../../progress/SessionResultCard';
import type { ThemeColors } from '../../settings/ThemeContext';
import { DesktopTypographyProvider } from '../../shared/DesktopTypography';
import { getDesktopTypographyScale, NARROW_CARD_WIDTH } from '../../shared/responsiveLayout';



type Props = {
  visible: boolean;
  score: number;
  sessionXp: number;
  // Claiming is what actually banks the run's XP — nothing is written before it.
  onClaimXP?: () => Promise<unknown> | void;
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
  onClaimXP,
  bestCombo,
  matchedCount,
  totalWords,
  isDarkMode,
  themeColors,
  onPlayAgain,
  onBack,
  onGoToAccount,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const desktopScale = getDesktopTypographyScale(windowWidth, windowHeight, 'fit');
  const colors = vocabRushColorsForTheme(isDarkMode, themeColors);
  const [currentXP, setCurrentXP] = useState(0);
  const [xpReady, setXpReady] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [flowFinished, setFlowFinished] = useState(false);
  const hasShownLevelUpRef = useRef(false);
  const claimStartedRef = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!visible) {
      setXpReady(false);
      setShowLevelUp(false);
      setFlowFinished(false);
      hasShownLevelUpRef.current = false;
      claimStartedRef.current = false;
      pendingActionRef.current = null;
      return;
    }

    let active = true;
    getXP()
      .then((xp) => {
        if (!active) return;
        setCurrentXP(xp);
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

  const containerPadding = windowWidth < NARROW_CARD_WIDTH ? 16 : 24;
  const matchedPercent = totalWords > 0 ? Math.min(100, Math.max(0, (matchedCount / totalWords) * 100)) : 0;
  // XP is banked on claim, so the stored total read on open is the pre-run one.
  const previousXP = currentXP;
  const totalAfterRunXP = currentXP + sessionXp;
  const didLevelUp = sessionXp > 0 && getXPLevel(previousXP) < getXPLevel(totalAfterRunXP);
  const continueAfterClaim = (action: () => void) => {
    if (claimStartedRef.current) return;
    claimStartedRef.current = true;
    void Promise.resolve(onClaimXP?.()).catch(() => {});
    if (didLevelUp && !hasShownLevelUpRef.current) {
      hasShownLevelUpRef.current = true;
      pendingActionRef.current = action;
      setShowLevelUp(true);
      return;
    }
    setFlowFinished(true);
    action();
  };
  const closeResult = () => {
    if (claimStartedRef.current) return;
    claimStartedRef.current = true;
    setFlowFinished(true);
    onBack();
  };

  return (
    <DesktopTypographyProvider mode="fit">
      <>
      {!showLevelUp && !flowFinished && (
        <View style={[styles.pageBackground, { backgroundColor: isDarkMode ? 'rgba(7,15,28,0.62)' : 'rgba(20,20,25,0.55)' }]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { padding: containerPadding }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.stack, { maxWidth: Math.round(430 * desktopScale) }]}>
              <SessionResultCard
                colors={themeColors}
                isDarkMode={isDarkMode}
                tone="warning"
                eyebrow="Nice try!"
                title="Time's up!"
                subtitle={`You matched ${matchedCount} of ${totalWords} words. Ready to beat that score?`}
                image={require('../../../assets/embarrassed.png')}
                sectionLabel="Vocabulary"
                onBack={closeResult}
              >
                <View style={styles.roundProgress}>
                  <View style={styles.roundProgressHeader}>
                    <Text style={[styles.roundProgressTitle, { color: themeColors.text }]}>Words matched</Text>
                    <Text style={[styles.roundProgressValue, { color: colors.timerRed }]}>{Math.round(matchedPercent)}%</Text>
                  </View>
                  <View style={[styles.roundProgressTrack, { backgroundColor: themeColors.progressTrack }]}>
                    <View style={[styles.roundProgressFill, { width: `${matchedPercent}%`, backgroundColor: colors.timerRed }]} />
                  </View>
                </View>

                <SessionResultStats
                  colors={themeColors}
                  isDarkMode={isDarkMode}
                  items={[
                    { emoji: '✨', label: 'XP earned', value: `+${sessionXp}` },
                    { emoji: '🔥', label: 'Best combo', value: `×${bestCombo}` },
                    { emoji: '⭐', label: 'Score', value: score },
                  ]}
                />

                <SessionResultActions
                  colors={themeColors}
                  isDarkMode={isDarkMode}
                  primaryLabel={`Claim ${sessionXp} XP`}
                  onPrimary={() => continueAfterClaim(onPlayAgain)}
                />
              </SessionResultCard>
            </View>
          </ScrollView>
        </View>
      )}

      <LevelUpModal
        visible={visible && showLevelUp && !flowFinished}
        totalXP={totalAfterRunXP}
        sessionXP={sessionXp}
        colors={themeColors}
        isDarkMode={isDarkMode}
        onDismiss={() => {
          setFlowFinished(true);
          setShowLevelUp(false);
          const action = pendingActionRef.current;
          pendingActionRef.current = null;
          action?.();
        }}
        dismissLabel="Continue"
        onGoToAccount={onGoToAccount ? () => {

          pendingActionRef.current = null;
          setFlowFinished(true);
          setShowLevelUp(false);







          // Let the nested native modal dismiss before navigation presents another screen.
          setTimeout(onGoToAccount, 220);
        } : undefined}
      />
      </>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  pageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 24,
    // Unlike the Modal-wrapped completion screens, this overlay isn't inside a native
    // <Modal> — it shares the normal view tree with the game screen underneath, so it
    // still needs real elevation to draw/stack above that content on Android. But this
    // background is intentionally translucent, and an elevation as extreme as the old
    // 1000 made Android render it as an opaque white plate with a thick grey shadow ring
    // instead of a see-through scrim — 24 is already well clear of anything else on this
    // screen (the game UI tops out at elevation 2), and shadowColor suppresses the ring.
    elevation: 24,
    shadowColor: 'transparent',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    width: '100%',
    maxWidth: 430,
  },
  roundProgress: {
    width: '100%',
  },
  roundProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundProgressTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  roundProgressValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  roundProgressTrack: {
    width: '100%',
    height: 10,
    marginTop: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  roundProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
