import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Text from '../shared/ThemedText';
import type { AccountAvatarColorPreset, AccountAvatarPreset } from '../account/accountAvatarStorage';
import type { ThemeColors } from '../settings/ThemeContext';
import { freshFontFamily } from '../shared/freshDirection';
import { getDesktopTypographyScale, getSheetDensity } from '../shared/responsiveLayout';
import useReducedMotion from '../shared/useReducedMotion';

type RewardRevealModalProps = {
  visible: boolean;
  reward: AccountAvatarPreset | AccountAvatarColorPreset | null;
  extraRewardCount?: number;
  colors: ThemeColors;
  isDarkMode: boolean;
  onContinue: () => void;
  onSetAsPicture?: () => void;
  continueLabel?: string;
  busy?: boolean;
  hasBackdropUnderlay?: boolean;
};

const isImageReward = (
  reward: AccountAvatarPreset | AccountAvatarColorPreset
): reward is AccountAvatarPreset => 'image' in reward;

export default function RewardRevealModal({
  visible,
  reward,
  extraRewardCount = 0,
  colors,
  isDarkMode,
  onContinue,
  onSetAsPicture,
  continueLabel = 'Continue',
  busy = false,
  hasBackdropUnderlay = false,
}: RewardRevealModalProps) {
  const { width, height } = useWindowDimensions();
  const desktopScale = getDesktopTypographyScale(width, height, 'fit');
  const { compact, dense, veryShort } = getSheetDensity(width, height, desktopScale);
  const availableHeight = Math.max(320, height - (dense ? 32 : 48));
  const portraitSheetMinHeight = compact && height > width
    ? Math.min(availableHeight, Math.max(450, Math.round((width - 32) * 1.16)))
    : 0;
  const reducedMotion = useReducedMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const imageReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      imageReveal.setValue(0);
      return;
    }
    if (reducedMotion) {
      entrance.setValue(1);
      imageReveal.setValue(1);
      return;
    }

    entrance.setValue(0);
    imageReveal.setValue(0);
    const reveal = Animated.parallel([
      Animated.timing(entrance, {
        toValue: 1,
        duration: 480,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(imageReveal, {
        toValue: 1,
        friction: 8,
        tension: 98,
        delay: 130,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    reveal.start();
    return () => reveal.stop();
  }, [entrance, imageReveal, reducedMotion, visible]);

  if (!reward) return null;

  const rewardPalette = isDarkMode
    ? {
        sheet: '#241B10',
        panel: '#302315',
        accent: '#F2A64A',
        button: '#B85B17',
        border: '#7A5528',
        title: '#FFD18A',
        secondary: '#E3CAA4',
        shadow: '#100B06',
      }
    : {
        sheet: '#FFF8EA',
        panel: '#FFFFFF',
        accent: '#C56A18',
        button: '#A84D0B',
        border: '#E8BE78',
        title: '#7A3F0D',
        secondary: '#7B6546',
        shadow: '#713709',
      };
  const sheetBackground = rewardPalette.sheet;
  const primaryBackground = rewardPalette.button;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
      onRequestClose={onContinue}
    >
      <View style={[
        styles.backdrop,
        { backgroundColor: hasBackdropUnderlay ? 'transparent' : isDarkMode ? 'rgba(7,15,28,0.54)' : 'rgba(20,20,25,0.55)' },
      ]}>
        <View style={[styles.viewport, dense && styles.viewportCompact]}>
          <Animated.View
            style={[
              styles.sheet,
              dense && styles.sheetCompact,
              veryShort && styles.sheetVeryCompact,
              {
                backgroundColor: sheetBackground,
                borderColor: rewardPalette.border,
                borderWidth: 1,
                minHeight: portraitSheetMinHeight,
                maxHeight: availableHeight,
                justifyContent: 'space-between',
                opacity: entrance,
                boxShadow: isDarkMode
                  ? '0px 8px 24px rgba(0,0,0,0.34)'
                  : '0px 8px 24px rgba(126,77,20,0.16)',
                transform: [
                  { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                  { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
                ],
              } as ViewStyle,
            ]}
            accessibilityViewIsModal
          >
            <View style={[styles.revealContent, dense && styles.revealContentCompact, veryShort && styles.revealContentVeryCompact]}>
              <Animated.View
                style={[
                  styles.rewardVisual,
                  dense && styles.rewardVisualCompact,
                  veryShort && styles.rewardVisualVeryCompact,
                  {
                    backgroundColor: reward.backgroundColor,
                    borderColor: reward.accentColor,
                    borderWidth: reward.borderWidth ?? 3,
                  },
                  {
                    opacity: imageReveal,
                    transform: [{
                      scale: imageReveal.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                    }],
                  },
                ]}
              >
                {isImageReward(reward) && (
                  <Image source={reward.image} style={[styles.rewardImage, dense && styles.rewardImageCompact, veryShort && styles.rewardImageVeryCompact]} resizeMode={reward.imageFit ?? 'contain'} />
                )}
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </Animated.View>

              <View style={[styles.rewardCopy, veryShort && styles.rewardCopyVeryCompact]}>
                <Text style={[styles.rewardTitle, dense && styles.rewardTitleCompact, veryShort && styles.rewardTitleVeryCompact, { color: rewardPalette.title }]}>
                  {isImageReward(reward) ? 'Profile picture unlocked' : 'Border color unlocked'}
                </Text>
                <Text style={[styles.rewardLabel, dense && styles.rewardLabelCompact, veryShort && styles.rewardLabelVeryCompact, { color: rewardPalette.secondary }]}>
                  {reward.label}{extraRewardCount > 0 ? ` · +${extraRewardCount} more` : ''}
                </Text>
              </View>
            </View>

            <View style={[styles.actions, veryShort && styles.actionsVeryCompact]}>
              {!!onSetAsPicture && (
                <Pressable
                  onPress={onSetAsPicture}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={isImageReward(reward) ? 'Open avatar selection' : 'Open border selection'}
                  accessibilityState={{ disabled: busy }}
                  style={({ pressed }) => [
                    styles.action,
                    dense && styles.actionCompact,
                    veryShort && styles.actionVeryCompact,
                    {
                      backgroundColor: primaryBackground,
                      boxShadow: `0px ${pressed ? 1 : 4}px 0 ${rewardPalette.shadow}`,
                      opacity: busy ? 0.64 : pressed ? 0.84 : 1,
                      transform: [{ translateY: pressed ? 3 : 0 }],
                    } as ViewStyle,
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
                  ]}
                >
                  <Text style={[styles.primaryActionText, { color: colors.buttonText }]}>
                    {isImageReward(reward) ? 'Set as picture' : 'Use this border'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={onContinue}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={continueLabel}
                accessibilityState={{ disabled: busy }}
                style={({ pressed }) => [
                  styles.action,
                  dense && styles.actionCompact,
                  veryShort && styles.actionVeryCompact,
                  styles.secondaryAction,
                  {
                    backgroundColor: rewardPalette.panel,
                    borderColor: rewardPalette.border,
                    opacity: busy ? 0.64 : pressed ? 0.76 : 1,
                  },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
                ]}
              >
                <Text style={[styles.secondaryActionText, { color: colors.text }]}>{continueLabel}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // No zIndex/elevation needed: this View lives inside RN's own <Modal>, which already
    // renders in its own top-level native window/Android Activity above everything else.
    // The old elevation:100000 here was pure leftover and, since this backdrop's own
    // background is intentionally transparent/translucent, Android rendered that huge
    // elevation as an opaque white plate with a thick grey shadow ring instead of the
    // intended see-through scrim.
  },
  viewport: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  viewportCompact: {
    paddingVertical: 8,
  },
  sheet: {
    width: '100%',
    maxWidth: 550,
    minHeight: 0,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingTop: 40,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  sheetCompact: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  sheetVeryCompact: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  revealContent: {
    width: '100%',
    flexShrink: 0,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingBottom: 28,
  },
  revealContentCompact: {
    minHeight: 0,
    paddingBottom: 16,
  },
  revealContentVeryCompact: {
    paddingBottom: 10,
  },
  rewardVisualCompact: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  rewardVisualVeryCompact: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  rewardVisual: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    boxShadow: '0px 10px 28px rgba(255,169,0,0.24)',
  },
  rewardImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  rewardImageCompact: {
    width: 84,
    height: 84,
  },
  rewardImageVeryCompact: {
    width: 66,
    height: 66,
  },
  newBadge: {
    position: 'absolute',
    right: -10,
    top: -8,
    borderRadius: 9,
    backgroundColor: '#D3202F',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.6,
    fontWeight: freshFontFamily.extrabold,
  },
  rewardCopy: {
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  rewardCopyVeryCompact: {
    marginTop: 12,
    gap: 2,
  },
  rewardTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
  },
  rewardTitleCompact: {
    fontSize: 21,
    lineHeight: 26,
  },
  rewardTitleVeryCompact: {
    fontSize: 19,
    lineHeight: 23,
  },
  rewardLabel: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: freshFontFamily.medium,
    textAlign: 'center',
  },
  rewardLabelCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  rewardLabelVeryCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    gap: 12,
    flexShrink: 0,
  },
  actionsVeryCompact: {
    gap: 8,
  },
  action: {
    width: '100%',
    minHeight: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  actionCompact: {
    minHeight: 52,
    borderRadius: 16,
  },
  actionVeryCompact: {
    minHeight: 46,
    borderRadius: 14,
  },
  secondaryAction: {
    borderWidth: 2,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: freshFontFamily.bold,
  },
  secondaryActionText: {
    fontSize: 17,
    fontWeight: freshFontFamily.bold,
  },
});
