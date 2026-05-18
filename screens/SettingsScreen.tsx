import React, { useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, Switch, Platform, ScrollView, Pressable, Modal, TextInput, TouchableOpacity } from 'react-native';
import BackButton from '../components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearVocabularyTimerBests } from '../utils/vocabularyTimerStorage';
import { getMenuCopy, menuLanguageOptions } from '../utils/menuCopy';
import { ENABLE_MENU_LANGUAGE_SELECTOR, ENABLE_SHINY_ELLIE_COLOR_MODE } from '../lib/featureFlags';
import { hapticsAreSupported } from '../utils/haptics';

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
  const openAccountScreen = () => {
    const parent = navigation.getParent();

    if (parent) {
      parent.navigate('Account');
      return;
    }

    navigation.navigate('Account');
  };

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
    <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
      <View style={styles.settingTextContainer}>
        <MaterialIcons name={icon} size={24} color={colors.text} />
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
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Account</Text>
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingTextContainer}>
            <MaterialIcons name="account-circle" size={24} color={colors.text} />
            <View style={styles.settingCopy}>
              <Text style={[styles.settingText, { color: colors.text }]}>Account backup</Text>
              <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                Optional login for an online copy.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={openAccountScreen}
            style={[styles.resetButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Open account"
          >
            <Text style={[styles.resetButtonText, { color: colors.primary }]}>Open</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.appearance}</Text>
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
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingTextContainer}>
              <MaterialIcons name="translate" size={24} color={colors.text} />
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
                    { borderColor: colors.primary, backgroundColor: colors.card },
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.home}</Text>
        {renderSetting({
          icon: 'today',
          title: copy.todayCardTitle,
          description: copy.todayCardDescription,
          value: isTodayCardEnabled,
          onValueChange: toggleTodayCard,
          activeColor: colors.primary,
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.vocabulary}</Text>
        <Text style={[styles.subsectionTitle, { color: colors.secondaryText }]}>{copy.flashcards}</Text>
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingTextContainer}>
            <MaterialIcons name="view-agenda" size={24} color={colors.text} />
            <View style={styles.settingCopy}>
              <Text style={[styles.settingText, { color: colors.text }]}>{copy.vocabularyLayoutTitle}</Text>
              <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                {copy.vocabularyLayoutDescription}
              </Text>
            </View>
          </View>
          <View style={styles.inlineChoiceGroup}>
            <TouchableOpacity
              onPress={() => updateVocabLessonCardView('list')}
              accessibilityRole="button"
              accessibilityLabel={copy.list}
              accessibilityState={{ selected: vocabLessonCardView === 'list' }}
              style={[
                styles.inlineChoiceButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                vocabLessonCardView === 'list' && [styles.inlineChoiceButtonActive, { backgroundColor: colors.primary }],
              ]}
            >
              <Text style={[styles.inlineChoiceText, { color: colors.primary }, vocabLessonCardView === 'list' && styles.inlineChoiceTextActive]}>{copy.list}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateVocabLessonCardView('tile')}
              accessibilityRole="button"
              accessibilityLabel={copy.tiles}
              accessibilityState={{ selected: vocabLessonCardView === 'tile' }}
              style={[
                styles.inlineChoiceButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                vocabLessonCardView === 'tile' && [styles.inlineChoiceButtonActive, { backgroundColor: colors.primary }],
              ]}
            >
              <Text style={[styles.inlineChoiceText, { color: colors.primary }, vocabLessonCardView === 'tile' && styles.inlineChoiceTextActive]}>{copy.tiles}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.subsectionTitle, { color: colors.secondaryText }]}>{copy.matching}</Text>
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
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingTextContainer}>
            <MaterialIcons name="restore" size={24} color={colors.text} />
            <View style={styles.settingCopy}>
              <Text style={[styles.settingText, { color: colors.text }]}>{copy.resetBestTimesTitle}</Text>
              <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                {copy.resetBestTimesDescription}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={resetVocabularyTimerBests}
            style={[styles.resetButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={copy.resetBestTimesTitle}
          >
            <Text style={[styles.resetButtonText, { color: colors.primary }]}>{copy.reset}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subsectionTitle, { color: colors.secondaryText }]}>{copy.typing}</Text>
        {renderSetting({
          icon: 'spellcheck',
          title: copy.exactTypingTitle,
          description: copy.exactTypingDescription,
          value: isTypingStrictMode,
          onValueChange: toggleTypingStrictMode,
          activeColor: colors.primary,
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.grammar}</Text>
        {renderSetting({
          icon: 'sports-esports',
          title: copy.grammarGameModeTitle,
          description: copy.grammarGameModeDescription,
          value: isGrammarGameMode,
          onValueChange: toggleGrammarGameMode,
          activeColor: '#9575CD',
        })}
      </View>

      {hapticsAreSupported && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.interaction}</Text>
          {renderSetting({
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
      )}

      {ENABLE_SHINY_ELLIE_COLOR_MODE && isShinyEllieUnlocked && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{copy.extras}</Text>
          {renderSetting({
            icon: 'auto-awesome',
            title: copy.shinyEllieTitle,
            description: copy.shinyEllieDescription,
            value: isShinyEllieMode,
            onValueChange: toggleShinyEllieMode,
            activeColor: '#f4b942',
          })}
        </View>
      )}

      {/* Credits Section */}
      <View style={styles.creditsContainer}>
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
    fontSize: 32,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  settingCopy: {
    flex: 1,
    marginLeft: 10,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
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
    borderWidth: 2,
    borderColor: '#D6E2EE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    color: '#5F8F6A',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineChoiceTextActive: {
    color: '#fff',
  },
  resetButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#EAF5FF',
    borderWidth: 1.5,
    borderColor: '#5F8F6A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#5F8F6A',
    fontSize: 13,
    fontWeight: '800',
  },
  creditsContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  creditsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  creditsText: {
    fontSize: 13,
    lineHeight: 19,
  },
  versionTrigger: {
    marginTop: 16,
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  adminModalText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  adminModalInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  adminModalError: {
    marginTop: 8,
    color: '#C62828',
    fontSize: 13,
    fontWeight: '700',
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
    color: '#44505C',
    fontSize: 14,
    fontWeight: '800',
  },
  adminPrimaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#5F8F6A',
  },
  adminPrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
