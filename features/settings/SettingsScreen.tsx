import React, { useState } from 'react';
import { Alert, View, StyleSheet, Platform, ScrollView, Pressable, Modal, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import BackButton from '../shared/BackButton';
import PillToggle from '../shared/PillToggle';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigationTypes';
import { FontAwesome } from '@expo/vector-icons';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMenuCopy } from '../shared/menuCopy';
import { ENABLE_SHINY_ELLIE_COLOR_MODE } from '../../lib/featureFlags';
import { hapticsAreSupported } from '../shared/haptics';
import { getButtonStyle, getButtonTextColor, getPixelSurfaceStyle, withColorAlpha } from '../shared/uiPrimitives';
import { getDesktopContentMaxWidth, getDesktopTypographyScale, getTopSafeAreaInset, isDesktopWebWidth, NARROW_TRAY_WIDTH } from '../shared/responsiveLayout';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';
import { useAccount } from '../account/AccountContext';
import { getAdminContentAccess } from '../lessons/adminContentSync';

const SETTINGS_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: undefined,
});

const ANDROID_APK_DOWNLOAD_URL = 'https://github.com/MrFaivreEnglish/ellie-english/releases/latest/download/ellie-latest.apk';

export default function SettingsScreen() {
  const {
    isDarkMode,
    toggleTheme,
    colors,
    isGrammarGameMode,
    toggleGrammarGameMode,
    isGrammarSpeechEnabled,
    toggleGrammarSpeech,
    isVocabTimerMode,
    toggleVocabTimerMode,
    isVocabTimerRecordSavingEnabled,
    toggleVocabTimerRecordSaving,
    vocabLessonCardView,
    updateVocabLessonCardView,
    isTypingStrictMode,
    toggleTypingStrictMode,
    isHapticsEnabled,
    toggleHaptics,
    isSoundEffectsEnabled,
    toggleSoundEffects,
    isTodayCardEnabled,
    toggleTodayCard,
    isAndroidStatusBarEnabled,
    toggleAndroidStatusBar,
    isShinyEllieUnlocked,
    isShinyEllieMode,
    updateShinyEllieMode,
    isShinyElliePresentationMode,
    updateShinyElliePresentationMode,
    shinyEllieColorVariant,
    updateShinyEllieColorVariant,
  } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAccount();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'scroll', windowHeight);





  const desktopScale = getDesktopTypographyScale(windowWidth, windowHeight, 'scroll');
  // Tablet keeps the mobile structural layout (isDesktopWeb stays false)
  // but still gets a real desktopScale > 1 — numeric-only scale call sites
  // gate on this instead of isDesktopWeb alone, which used to leave tablet
  // at the flat phone size even though its own scale was already correct.
  const isScaledLayout = isDesktopWeb || desktopScale > 1;
  const isHeaderTitleCompact = windowWidth < NARROW_TRAY_WIDTH;
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);
  const [, setAdminTapCount] = useState(0);
  const [isCheckingAdminAccess, setIsCheckingAdminAccess] = useState(false);
  const [installGuideVisible, setInstallGuideVisible] = useState(false);
  const adminAccessEnabled = Platform.OS === 'web';


  // Shown at every web width: the pill and its icons already scale with desktopScale, and a
  // desktop visitor is just as likely to want the iPhone guide or the Android download.
  // Native is the only place with no install to offer — it is the installed app.
  const showInstallBadge = Platform.OS === 'web';
  const appCopy = getMenuCopy();
  const copy = appCopy.settings;
  const commonCopy = appCopy.common;
  const settingsCardBackground = colors.card;
  const settingsCardBorder = colors.border;
  const settingsRowBorder = colors.border;
  const settingsIconBackground = colors.surfaceAlt;
  const settingsIconColor = colors.secondaryText;
  const settingsControlBackground = colors.surface;
  const settingsSubsectionBackground = colors.surface;
  const settingsSubsectionText = colors.secondaryText;
  const settingsCardShadow = isDarkMode
    ? '0px 4px 10px rgba(0,0,0,0.22)'
    : `0px 4px 10px ${withColorAlpha(colors.shadow, 0.72)}`;
  const primaryButtonStyle = getButtonStyle(colors, isDarkMode, 'primary');
  const primaryButtonTextColor = getButtonTextColor(colors, isDarkMode, 'primary');
  const pixelSurfaceStyle = getPixelSurfaceStyle(colors, isDarkMode, 'soft');

  const openAndroidDownload = () => {
    if (!ANDROID_APK_DOWNLOAD_URL) {
      Alert.alert('Download unavailable', 'The Android APK link is not available yet.');
      return;
    }

    Linking.openURL(ANDROID_APK_DOWNLOAD_URL).catch(() => {
      Alert.alert('Download unavailable', 'The Android APK link could not be opened.');
    });
  };

  const openAdminStudio = async () => {
    if (!session) {
      Alert.alert(
        'Admin sign-in required',
        'Sign in with your administrator account before opening Content Studio.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: () => navigation.navigate('Account', undefined) },
        ]
      );
      return;
    }

    setIsCheckingAdminAccess(true);
    try {
      const access = await getAdminContentAccess();
      if (!access.isAdmin) {
        Alert.alert('Not an administrator', 'This account does not have permission to publish app content.');
        return;
      }
      navigation.navigate('AdminLessonPreview');
    } catch (error) {
      Alert.alert(
        'Could not verify admin access',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsCheckingAdminAccess(false);
    }
  };

  const handleAdminVersionPress = () => {
    if (!adminAccessEnabled || isCheckingAdminAccess) {
      return;
    }

    setAdminTapCount((current) => {
      const next = current + 1;
      if (next >= 7) {
        void openAdminStudio();
        return 0;
      }
      return next;
    });
  };

  const renderSetting = ({
    icon,
    title,
    description,
    value,
    onValueChange,
    activeColor,
  }: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    title: string;
    description: string;
    value: boolean;
    onValueChange: () => void;
    activeColor: string;
  }) => (
    <View
      style={[
        styles.settingItem,
        isScaledLayout && {
          minHeight: Math.round(62 * desktopScale),
          paddingHorizontal: Math.round(12 * desktopScale),
          paddingVertical: Math.round(10 * desktopScale),
        },
        { borderBottomColor: settingsRowBorder },
      ]}
    >
      <View style={[styles.settingTextContainer, isScaledLayout && { paddingRight: Math.round(10 * desktopScale) }]}>
        <View
          style={[
            styles.settingIconBox,
            isScaledLayout && { width: Math.round(36 * desktopScale), height: Math.round(36 * desktopScale), borderRadius: Math.round(10 * desktopScale) },
            { backgroundColor: settingsIconBackground },
          ]}
        >
          <MaterialIcons name={icon} size={Math.round(20 * desktopScale)} color={settingsIconColor} />
        </View>
        <View style={[styles.settingCopy, isScaledLayout && { marginLeft: Math.round(10 * desktopScale) }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
            {description}
          </Text>
        </View>
      </View>
      <PillToggle
        value={value}
        onValueChange={onValueChange}
        activeColor={activeColor}
        trackOffColor={colors.border}
        scale={isScaledLayout ? desktopScale : 1}
        accessibilityLabel={title}
      />
    </View>
  );

  const renderChoiceSetting = <T extends string>({
    icon,
    title,
    description,
    value,
    options,
    onValueChange,
  }: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    title: string;
    description: string;
    value: T;
    options: ReadonlyArray<{ value: T; label: string }>;
    onValueChange: (value: T) => void;
  }) => (
    <View
      style={[
        styles.settingItem,
        isScaledLayout && {
          minHeight: Math.round(62 * desktopScale),
          paddingHorizontal: Math.round(12 * desktopScale),
          paddingVertical: Math.round(10 * desktopScale),
        },
        { borderBottomColor: settingsRowBorder },
      ]}
    >
      <View style={[styles.settingTextContainer, isScaledLayout && { paddingRight: Math.round(10 * desktopScale) }]}>
        <View
          style={[
            styles.settingIconBox,
            isScaledLayout && { width: Math.round(36 * desktopScale), height: Math.round(36 * desktopScale), borderRadius: Math.round(10 * desktopScale) },
            { backgroundColor: settingsIconBackground },
          ]}
        >
          <MaterialIcons name={icon} size={Math.round(20 * desktopScale)} color={settingsIconColor} />
        </View>
        <View style={[styles.settingCopy, isScaledLayout && { marginLeft: Math.round(10 * desktopScale) }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
            {description}
          </Text>
        </View>
      </View>
      <View style={[styles.segmentedControl, { backgroundColor: settingsControlBackground, borderColor: settingsCardBorder }]}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onValueChange(option.value)}
              style={[
                styles.segmentedButton,
                isActive && { backgroundColor: colors.buttonBackground },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${title}: ${option.label}`}
            >
              <Text style={[styles.segmentedText, { color: isActive ? colors.buttonText : colors.secondaryText }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <DesktopTypographyProvider mode="scroll">
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <View style={isDesktopWeb && [styles.desktopContentWrap, { maxWidth: desktopContentMaxWidth }]}>
      <BackButton label={commonCopy.backToHome} onPress={() => navigation.navigate('Home')} />

      <View style={styles.headerTitleRow}>
        <Text
          style={[
            styles.headerTitle,
            isHeaderTitleCompact && styles.headerTitleCompact,
            { color: colors.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {copy.header}
        </Text>
        {showInstallBadge && (
          <View style={[styles.headerInstallPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.headerInstallText, { color: colors.secondaryText }]}>Install Ellie!</Text>
            <View style={styles.headerInstallButtons}>
              <TouchableOpacity
                onPress={() => setInstallGuideVisible(true)}
                activeOpacity={0.84}
                accessibilityRole="button"
                accessibilityLabel="Installer Ellie sur iPhone"
                style={[styles.headerInstallButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <FontAwesome name="apple" size={Math.round(18 * desktopScale)} color={colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openAndroidDownload}
                activeOpacity={0.84}
                accessibilityRole="button"
                accessibilityLabel="Installer Ellie sur Android"
                style={[styles.headerInstallButton, styles.headerInstallButtonAndroid]}
              >
                <MaterialIcons name="android" size={Math.round(19 * desktopScale)} color="#258B62" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Display</Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder, boxShadow: settingsCardShadow, shadowColor: colors.shadow },
            pixelSurfaceStyle,
          ]}
        >
          {renderSetting({
            icon: 'brightness-6',
            title: copy.darkModeTitle,
            description: copy.darkModeDescription,
            value: isDarkMode,
            onValueChange: toggleTheme,
            activeColor: colors.primary,
          })}
          {renderSetting({
            icon: 'today',
            title: copy.todayCardTitle,
            description: copy.todayCardDescription,
            value: isTodayCardEnabled,
            onValueChange: toggleTodayCard,
            activeColor: colors.primary,
          })}
          {renderSetting({
            icon: 'volume-up',
            title: copy.soundEffectsTitle,
            description: copy.soundEffectsDescription,
            value: isSoundEffectsEnabled,
            onValueChange: toggleSoundEffects,
            activeColor: colors.primary,
          })}
          {hapticsAreSupported && renderSetting({
            icon: 'vibration',
            title: copy.hapticsTitle,
            description: Platform.OS === 'web'
              ? copy.hapticsWebDescription
              : copy.hapticsDescription,
            value: isHapticsEnabled,
            onValueChange: toggleHaptics,
            activeColor: colors.primary,
          })}
          {Platform.OS === 'android' && renderSetting({
            icon: 'stay-current-portrait',
            title: copy.androidStatusBarTitle,
            description: copy.androidStatusBarDescription,
            value: isAndroidStatusBarEnabled,
            onValueChange: toggleAndroidStatusBar,
            activeColor: colors.primary,
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.vocabulary}</Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder, boxShadow: settingsCardShadow, shadowColor: colors.shadow },
            pixelSurfaceStyle,
          ]}
        >
          <View style={[styles.settingItem, { borderBottomColor: settingsRowBorder }]}>
            <View style={styles.settingTextContainer}>
              <View style={[styles.settingIconBox, { backgroundColor: settingsIconBackground }]}>
                <MaterialIcons name="view-agenda" size={Math.round(20 * desktopScale)} color={settingsIconColor} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingText, { color: colors.text }]}>{copy.vocabularyLayoutTitle}</Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {copy.vocabularyLayoutDescription}
                </Text>
              </View>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: settingsControlBackground, borderColor: settingsCardBorder }]}>
              <TouchableOpacity
                onPress={() => updateVocabLessonCardView('list')}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={copy.list}
                accessibilityState={{ selected: vocabLessonCardView === 'list' }}
                style={[
                  styles.segmentedButton,
                  vocabLessonCardView === 'list' && { backgroundColor: colors.buttonBackground },
                ]}
              >
                <Text style={[styles.segmentedText, { color: colors.primary }, vocabLessonCardView === 'list' && [styles.inlineChoiceTextActive, { color: colors.buttonText }]]}>{copy.list}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateVocabLessonCardView('tile')}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={copy.tiles}
                accessibilityState={{ selected: vocabLessonCardView === 'tile' }}
                style={[
                  styles.segmentedButton,
                  vocabLessonCardView === 'tile' && { backgroundColor: colors.buttonBackground },
                ]}
              >
                <Text style={[styles.segmentedText, { color: colors.primary }, vocabLessonCardView === 'tile' && [styles.inlineChoiceTextActive, { color: colors.buttonText }]]}>{copy.tiles}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text
            style={[
              styles.subsectionTitle,
              {
                backgroundColor: settingsSubsectionBackground,
                borderBottomColor: settingsRowBorder,
                color: settingsSubsectionText,
              },
            ]}
          >
            {copy.matching}
          </Text>
          {renderSetting({
            icon: 'timer',
            title: copy.timerModeTitle,
            description: copy.timerModeDescription,
            value: isVocabTimerMode,
            onValueChange: toggleVocabTimerMode,
            activeColor: colors.primary,
          })}
          {renderSetting({
            icon: 'save',
            title: copy.saveBestTimesTitle,
            description: copy.saveBestTimesDescription,
            value: isVocabTimerRecordSavingEnabled,
            onValueChange: toggleVocabTimerRecordSaving,
            activeColor: colors.primary,
          })}
          <Text
            style={[
              styles.subsectionTitle,
              {
                backgroundColor: settingsSubsectionBackground,
                borderBottomColor: settingsRowBorder,
                color: settingsSubsectionText,
              },
            ]}
          >
            {copy.typing}
          </Text>
          {renderSetting({
            icon: 'spellcheck',
            title: copy.exactTypingTitle,
            description: copy.exactTypingDescription,
            value: isTypingStrictMode,
            onValueChange: toggleTypingStrictMode,
            activeColor: colors.primary,
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.grammar}</Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder, boxShadow: settingsCardShadow, shadowColor: colors.shadow },
            pixelSurfaceStyle,
          ]}
        >
          {renderSetting({
            icon: 'sports-esports',
            title: copy.grammarGameModeTitle,
            description: copy.grammarGameModeDescription,
            value: isGrammarGameMode,
            onValueChange: toggleGrammarGameMode,
            activeColor: colors.primary,
          })}
          {renderSetting({
            icon: 'record-voice-over',
            title: copy.grammarSpeechTitle,
            description: copy.grammarSpeechDescription,
            value: isGrammarSpeechEnabled,
            onValueChange: toggleGrammarSpeech,
            activeColor: colors.primary,
          })}
        </View>
      </View>

      {ENABLE_SHINY_ELLIE_COLOR_MODE && isShinyEllieUnlocked && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.extras}</Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder, boxShadow: settingsCardShadow, shadowColor: colors.shadow },
              pixelSurfaceStyle,
            ]}
          >
            <Text
              style={[
                styles.subsectionTitle,
                {
                  backgroundColor: settingsSubsectionBackground,
                  borderBottomColor: settingsRowBorder,
                  color: settingsSubsectionText,
                },
              ]}
            >
              {copy.shinyEllieTitle} · {copy.shinyEllieDescription}
            </Text>
            {renderChoiceSetting({
              icon: 'auto-awesome',
              title: copy.shinyElliePresentationTitle,
              description: copy.shinyElliePresentationDescription,
              value: isShinyElliePresentationMode ? 'shiny' : 'normal',
              options: [
                { value: 'normal', label: 'Normal' },
                { value: 'shiny', label: 'Shiny' },
              ] as const,
              onValueChange: (value) => updateShinyElliePresentationMode(value === 'shiny'),
            })}
            {renderChoiceSetting({
              icon: 'style',
              title: copy.shinyEllieLookTitle,
              description: copy.shinyEllieLookDescription,
              value: isShinyEllieMode ? 'pixel' : 'normal',
              options: [
                { value: 'normal', label: 'Normal' },
                { value: 'pixel', label: 'Pixel' },
              ] as const,
              onValueChange: (value) => updateShinyEllieMode(value === 'pixel'),
            })}
            {renderChoiceSetting({
              icon: 'palette',
              title: copy.shinyElliePaletteTitle,
              description: copy.shinyElliePaletteDescription,
              value: shinyEllieColorVariant,
              options: [
                { value: 'cool', label: 'Cool' },
                { value: 'warm', label: 'Warm' },
              ] as const,
              onValueChange: updateShinyEllieColorVariant,
            })}
          </View>
        </View>
      )}

      <View style={[styles.creditsContainer, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }, pixelSurfaceStyle]}>
        <Text style={[styles.creditsTitle, { color: colors.text }]}>{copy.credits}</Text>
        <Text style={[styles.creditsText, { color: colors.secondaryText }]}>
          - {copy.creditsConcept}{"\n"}
          - {copy.creditsImages}{"\n"}
          - {copy.creditsBuiltWith}
        </Text>
        <Pressable
          onPress={handleAdminVersionPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={copy.version}
        >
          <Text style={[styles.versionTrigger, { color: colors.secondaryText }]}>{copy.version}</Text>
        </Pressable>
        <Text style={[styles.creditsSchoolText, { color: colors.secondaryText }]}>{copy.creditsSchool}</Text>
      </View>
      </View>

      <Modal visible={installGuideVisible} transparent animationType="fade" onRequestClose={() => setInstallGuideVisible(false)}>
        <View style={styles.adminModalBackdrop}>
          <View style={[styles.installModalCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelSurfaceStyle]}>
            <View style={[styles.installModalIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialIcons name="add-to-home-screen" size={Math.round(30 * desktopScale)} color={colors.primary} />
            </View>
            <Text style={[styles.adminModalTitle, { color: colors.text }]}>Installer Ellie</Text>
            <View style={styles.installSteps}>
              <View style={styles.installStepRow}>
                <Text style={[styles.installStepNumber, { backgroundColor: colors.buttonBackground, color: colors.buttonText }]}>1</Text>
                <Text style={[styles.installStepText, { color: colors.text }]}>Ouvre Ellie dans Safari.</Text>
              </View>
              <View style={styles.installStepRow}>
                <Text style={[styles.installStepNumber, { backgroundColor: colors.buttonBackground, color: colors.buttonText }]}>2</Text>
                <Text style={[styles.installStepText, { color: colors.text }]}>Appuie sur Partager.</Text>
              </View>
              <View style={styles.installStepRow}>
                <Text style={[styles.installStepNumber, { backgroundColor: colors.buttonBackground, color: colors.buttonText }]}>3</Text>
                <Text style={[styles.installStepText, { color: colors.text }]}>Choisis Sur l'ecran d'accueil.</Text>
              </View>
              <View style={styles.installStepRow}>
                <Text style={[styles.installStepNumber, { backgroundColor: colors.buttonBackground, color: colors.buttonText }]}>4</Text>
                <Text style={[styles.installStepText, { color: colors.text }]}>Appuie sur Ajouter.</Text>
              </View>
            </View>
            {!ANDROID_APK_DOWNLOAD_URL && (
              <Text style={[styles.installModalNote, { color: colors.secondaryText }]}>
                Le bouton Android fonctionnera quand le lien APK sera ajoute.
              </Text>
            )}
            <TouchableOpacity
              onPress={() => setInstallGuideVisible(false)}
              style={[styles.adminPrimaryButton, styles.installModalDoneButton, primaryButtonStyle]}
              accessibilityRole="button"
              accessibilityLabel="Close install guide"
            >
              <Text style={[styles.adminPrimaryButtonText, { color: primaryButtonTextColor }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContentWrap: {


    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    minWidth: 0,
  },
  headerTitleCompact: {
    fontSize: 26,
  },
  headerTitleRow: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerInstallButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerInstallPill: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingLeft: 12,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerInstallText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  headerInstallButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInstallButtonAndroid: {
    backgroundColor: '#E9F8EF',
    borderColor: '#258B62',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 7,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0px 4px 10px rgba(0,0,0,0.06)',
  },
  subsectionTitle: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  settingText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    flexShrink: 1,
  },
  settingDescription: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 2,
    flexShrink: 1,
  },
  inlineChoiceGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChoiceGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: 168,
  },
  inlineChoiceButton: {
    borderWidth: 1.5,
    borderColor: '#E6DED3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  languageChoiceButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  inlineChoiceButtonActive: {
    backgroundColor: '#0D7DD4',
  },
  inlineChoiceText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#0D7DD4',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineChoiceTextActive: {
    color: '#fff',
  },
  segmentedControl: {
    minHeight: 36,
    minWidth: 112,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 3,
    flexDirection: 'row',
    gap: 3,
  },
  segmentedButton: {
    minHeight: 28,
    minWidth: 50,
    borderRadius: 7,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FAF3EA',
    borderWidth: 1.5,
    borderColor: '#0D7DD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#0D7DD4',
    fontSize: 13,
    fontWeight: '700',
  },
  creditsContainer: {
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  creditsTitle: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 7,
  },
  creditsText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  versionTrigger: {
    fontFamily: SETTINGS_FONT_FAMILY,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  creditsSchoolText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
  },
  adminModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  adminModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E6DED3',
  },
  installModalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
  },
  installModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  installSteps: {
    gap: 10,
    marginTop: 6,
  },
  installStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  installStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 13,
    lineHeight: 24,
    fontWeight: '900',
    overflow: 'hidden',
  },
  installStepText: {
    flex: 1,
    minWidth: 0,
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  installModalNote: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 14,
  },
  installModalDoneButton: {
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  adminModalTitle: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  adminModalText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 14,
  },
  adminModalInput: {
    fontFamily: SETTINGS_FONT_FAMILY,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  adminModalError: {
    fontFamily: SETTINGS_FONT_FAMILY,
    marginTop: 8,
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
  },
  adminModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  adminSecondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#EEF3F8',
  },
  adminSecondaryButtonText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#44505C',
    fontSize: 14,
    fontWeight: '700',
  },
  adminPrimaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#0D7DD4',
  },
  adminPrimaryButtonText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
