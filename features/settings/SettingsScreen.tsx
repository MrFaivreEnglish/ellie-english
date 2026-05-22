import React, { useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, Switch, Platform, ScrollView, Pressable, Modal, TextInput, TouchableOpacity } from 'react-native';
import BackButton from '../shared/BackButton';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearVocabularyTimerBests } from '../vocabulary/vocabularyTimerStorage';
import { getMenuCopy, menuLanguageOptions } from '../shared/menuCopy';
import { ENABLE_MENU_LANGUAGE_SELECTOR, ENABLE_SHINY_ELLIE_COLOR_MODE } from '../../lib/featureFlags';
import { hapticsAreSupported } from '../shared/haptics';

const SETTINGS_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: undefined,
});

export default function SettingsScreen() {
  const ADMIN_PIN = '241711';
  const { 
    isDarkMode, 
    toggleTheme, 
    colors,
    isGrammarGameMode,
    toggleGrammarGameMode,
    isVocabTimerMode,
    toggleVocabTimerMode,
    isVocabTimerRecordSavingEnabled,
    toggleVocabTimerRecordSaving,
    vocabLessonCardView,
    updateVocabLessonCardView,
    menuLanguage,
    updateMenuLanguage,
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
    toggleShinyEllieMode
  } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topContentInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const isPinValid = useMemo(() => adminPinInput.trim() === ADMIN_PIN, [adminPinInput]);
  const appCopy = getMenuCopy(menuLanguage);
  const copy = appCopy.settings;
  const commonCopy = appCopy.common;
  const settingsCardBackground = isDarkMode ? colors.card : '#FFFFFF';
  const settingsCardBorder = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(31,41,55,0.10)';
  const settingsRowBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(31,41,55,0.08)';
  const settingsIconBackground = isDarkMode ? 'rgba(255,255,255,0.07)' : '#F3F5F7';
  const settingsIconColor = isDarkMode ? colors.secondaryText : '#56616D';
  const settingsControlBackground = isDarkMode ? colors.surface : '#F6F7F9';
  const settingsSubsectionBackground = isDarkMode ? 'rgba(255,255,255,0.05)' : '#F7F8FA';
  const settingsSubsectionText = isDarkMode ? colors.text : '#4B5563';

  const handleAdminVersionPress = () => {
    setAdminTapCount((current) => {
      const next = current + 1;
      if (next >= 7) {
        setAdminModalVisible(true);
        return 0;
      }
      return next;
    });
  };

  const closeAdminModal = () => {
    setAdminModalVisible(false);
    setAdminPinInput('');
    setAdminPinError('');
  };

  const submitAdminPin = () => {
    if (!isPinValid) {
      setAdminPinError(copy.wrongPin);
      return;
    }

    closeAdminModal();
    navigation.navigate('AdminLessonPreview');
  };

  const resetVocabularyTimerBests = () => {
    const runReset = async () => {
      await clearVocabularyTimerBests();
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(copy.resetConfirmTitle)
        : true;

      if (confirmed) runReset();
      return;
    }

    Alert.alert(
      copy.resetConfirmTitle,
      copy.resetConfirmMessage,
      [
        { text: copy.cancel, style: 'cancel' },
        { text: copy.reset, style: 'destructive', onPress: runReset },
      ]
    );
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
    <View style={[styles.settingItem, { borderBottomColor: settingsRowBorder }]}>
      <View style={styles.settingTextContainer}>
        <View style={[styles.settingIconBox, { backgroundColor: settingsIconBackground }]}>
          <MaterialIcons name={icon} size={20} color={settingsIconColor} />
        </View>
        <View style={styles.settingCopy}>
          <Text style={[styles.settingText, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: activeColor }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
        accessibilityLabel={title}
      />
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <BackButton label={commonCopy.backToHome} onPress={() => navigation.navigate('Home')} />

      <Text style={[styles.headerTitle, { color: colors.text }]}>{copy.header}</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.appearance}</Text>
        <View style={[styles.sectionCard, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
          {renderSetting({
            icon: 'brightness-6',
            title: copy.darkModeTitle,
            description: copy.darkModeDescription,
            value: isDarkMode,
            onValueChange: toggleTheme,
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
          {ENABLE_MENU_LANGUAGE_SELECTOR && (
          <View style={[styles.settingItem, { borderBottomColor: settingsRowBorder }]}>
            <View style={styles.settingTextContainer}>
              <View style={[styles.settingIconBox, { backgroundColor: settingsIconBackground }]}>
                <MaterialIcons name="translate" size={20} color={settingsIconColor} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingText, { color: colors.text }]}>{copy.languageTitle}</Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {copy.languageDescription}
                </Text>
              </View>
            </View>
            <View style={styles.languageChoiceGroup}>
              {menuLanguageOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => updateMenuLanguage(option)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.languageOptions[option]}
                  accessibilityState={{ selected: menuLanguage === option }}
                  style={[
                    styles.inlineChoiceButton,
                    styles.languageChoiceButton,
                    { borderColor: settingsCardBorder, backgroundColor: settingsCardBackground },
                    menuLanguage === option && [styles.inlineChoiceButtonActive, { backgroundColor: colors.primary }],
                  ]}
                >
                  <Text style={[styles.inlineChoiceText, { color: colors.primary }, menuLanguage === option && styles.inlineChoiceTextActive]}>
                    {copy.languageOptions[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.home}</Text>
        <View style={[styles.sectionCard, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
          {renderSetting({
            icon: 'today',
            title: copy.todayCardTitle,
            description: copy.todayCardDescription,
            value: isTodayCardEnabled,
            onValueChange: toggleTodayCard,
            activeColor: colors.primary,
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.vocabulary}</Text>
        <View style={[styles.sectionCard, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
          <View style={[styles.settingItem, { borderBottomColor: settingsRowBorder }]}>
            <View style={styles.settingTextContainer}>
              <View style={[styles.settingIconBox, { backgroundColor: settingsIconBackground }]}>
                <MaterialIcons name="view-agenda" size={20} color={settingsIconColor} />
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
                accessibilityRole="button"
                accessibilityLabel={copy.list}
                accessibilityState={{ selected: vocabLessonCardView === 'list' }}
                style={[
                  styles.segmentedButton,
                  vocabLessonCardView === 'list' && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.segmentedText, { color: colors.primary }, vocabLessonCardView === 'list' && styles.inlineChoiceTextActive]}>{copy.list}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateVocabLessonCardView('tile')}
                accessibilityRole="button"
                accessibilityLabel={copy.tiles}
                accessibilityState={{ selected: vocabLessonCardView === 'tile' }}
                style={[
                  styles.segmentedButton,
                  vocabLessonCardView === 'tile' && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.segmentedText, { color: colors.primary }, vocabLessonCardView === 'tile' && styles.inlineChoiceTextActive]}>{copy.tiles}</Text>
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
            activeColor: '#FFB74D',
          })}
          {renderSetting({
            icon: 'save',
            title: copy.saveBestTimesTitle,
            description: copy.saveBestTimesDescription,
            value: isVocabTimerRecordSavingEnabled,
            onValueChange: toggleVocabTimerRecordSaving,
            activeColor: '#f4b942',
          })}
          <View style={[styles.settingItem, { borderBottomColor: settingsRowBorder }]}>
            <View style={styles.settingTextContainer}>
              <View style={[styles.settingIconBox, { backgroundColor: settingsIconBackground }]}>
                <MaterialIcons name="restore" size={20} color={settingsIconColor} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingText, { color: colors.text }]}>{copy.resetBestTimesTitle}</Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {copy.resetBestTimesDescription}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={resetVocabularyTimerBests}
              style={[styles.actionButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={copy.resetBestTimesTitle}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>{copy.reset}</Text>
            </TouchableOpacity>
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
        <View style={[styles.sectionCard, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
          {renderSetting({
            icon: 'sports-esports',
            title: copy.grammarGameModeTitle,
            description: copy.grammarGameModeDescription,
            value: isGrammarGameMode,
            onValueChange: toggleGrammarGameMode,
            activeColor: '#9575CD',
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.interaction}</Text>
        <View style={[styles.sectionCard, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
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
        </View>
      </View>

      {ENABLE_SHINY_ELLIE_COLOR_MODE && isShinyEllieUnlocked && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.extras}</Text>
          <View style={[styles.sectionCard, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
            {renderSetting({
              icon: 'auto-awesome',
              title: copy.shinyEllieTitle,
              description: copy.shinyEllieDescription,
              value: isShinyEllieMode,
              onValueChange: toggleShinyEllieMode,
              activeColor: '#f4b942',
            })}
          </View>
        </View>
      )}

      {/* Credits Section */}
      <View style={[styles.creditsContainer, { backgroundColor: settingsCardBackground, borderColor: settingsCardBorder }]}>
        <Text style={[styles.creditsTitle, { color: colors.text }]}>{copy.credits}</Text>
        <Text style={[styles.creditsText, { color: colors.secondaryText }]}>
          - {copy.creditsConcept}{"\n"}
          - {copy.creditsImages}{"\n"}
          - {copy.creditsBuiltWith}{"\n"}{"\n"}{"\n"}
        </Text>
        <Pressable
          onPress={handleAdminVersionPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={copy.version}
        >
          <Text style={[styles.versionTrigger, { color: colors.secondaryText }]}>{copy.version}</Text>
        </Pressable>
      </View>

      <Modal visible={adminModalVisible} transparent animationType="fade" onRequestClose={closeAdminModal}>
        <View style={styles.adminModalBackdrop}>
          <View style={[styles.adminModalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.adminModalTitle, { color: colors.text }]}>{copy.adminAccessTitle}</Text>
            <Text style={[styles.adminModalText, { color: colors.secondaryText }]}>
              {copy.adminAccessDescription}
            </Text>
            <TextInput
              value={adminPinInput}
              onChangeText={(value) => {
                setAdminPinInput(value);
                if (adminPinError) setAdminPinError('');
              }}
              placeholder={copy.pinPlaceholder}
              placeholderTextColor={colors.secondaryText}
              keyboardType="number-pad"
              secureTextEntry
              style={[
                styles.adminModalInput,
                {
                  color: colors.text,
                  borderColor: adminPinError ? '#C62828' : (isDarkMode ? '#415a77' : '#DDE5EE'),
                  backgroundColor: isDarkMode ? '#132033' : '#fff',
                },
              ]}
            />
            {!!adminPinError && <Text style={styles.adminModalError}>{adminPinError}</Text>}
            <View style={styles.adminModalActions}>
              <TouchableOpacity
                onPress={closeAdminModal}
                style={styles.adminSecondaryButton}
                accessibilityRole="button"
                accessibilityLabel={copy.cancel}
              >
                <Text style={styles.adminSecondaryButtonText}>{copy.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitAdminPin}
                style={[styles.adminPrimaryButton, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={copy.openAdmin}
              >
                <Text style={styles.adminPrimaryButtonText}>{copy.openAdmin}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: SETTINGS_FONT_FAMILY,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
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
    borderColor: '#D6E2EE',
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
    backgroundColor: '#5F8F6A',
  },
  inlineChoiceText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#5F8F6A',
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
    backgroundColor: '#EAF5FF',
    borderWidth: 1.5,
    borderColor: '#5F8F6A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#5F8F6A',
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
    borderColor: '#DDE5EE',
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
    backgroundColor: '#5F8F6A',
  },
  adminPrimaryButtonText: {
    fontFamily: SETTINGS_FONT_FAMILY,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
