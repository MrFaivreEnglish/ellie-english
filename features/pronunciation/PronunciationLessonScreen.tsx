import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../shared/BackButton';
import ImageWithCredit from '../shared/ImageWithCredit';
import { useTheme } from '../settings/ThemeContext';
import { pronunciationCategories, type PronunciationLesson } from '../../content/pronunciationLessons';
import { markPracticeActivityToday } from '../progress/xpStorage';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';
import { getDesktopContentMaxWidth, getDesktopTypographyScale, getTopSafeAreaInset, isDesktopWebWidth } from '../shared/responsiveLayout';

const fallbackLesson = pronunciationCategories[0].lessons[0];

type BrowserVoiceInfo = {
  identifier?: string;
  name?: string;
  language?: string;
};

type PronunciationLessonScreenProps = {
  route: {
    params?: {
      lesson?: PronunciationLesson;
      categoryColor?: string;
    };
  };
  navigation: any;
};

export default function PronunciationLessonScreen({
  route,
  navigation,
}: PronunciationLessonScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'scroll', windowHeight);





  const desktopScale = getDesktopTypographyScale(windowWidth, windowHeight, 'scroll');
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);
  const lesson = route.params?.lesson ?? fallbackLesson;
  const accentColor = route.params?.categoryColor ?? '#EF6F6C';
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [preferredVoice, setPreferredVoice] = useState<BrowserVoiceInfo | null>(null);
  const [selectedPracticeIndex, setSelectedPracticeIndex] = useState(0);
  const usefulPhrases = lesson.usefulPhrases ?? [];
  const mainPracticeItems = usefulPhrases.length > 0 ? usefulPhrases : lesson.examples;
  const practiceStarter = mainPracticeItems[selectedPracticeIndex] ?? mainPracticeItems[0];
  const imageSource = useMemo(
    () => (lesson.imageUrl ? { uri: lesson.imageUrl } : undefined),
    [lesson.imageUrl]
  );
  const imageHeight = Math.round(windowHeight * (Platform.OS === 'web' ? 0.50 : 0.45));

  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const starterIndex = mainPracticeItems.findIndex((phrase) => phrase.includes('...'));
    setSelectedPracticeIndex(starterIndex >= 0 ? starterIndex : 0);
  }, [lesson.title]);

  useEffect(() => {
    let mounted = true;

    const loadPreferredVoice = async () => {
      try {
        if (Platform.OS !== 'web' || typeof window === 'undefined') {
          if (mounted) setPreferredVoice(null);
          return;
        }

        const voices = window.speechSynthesis?.getVoices?.() ?? [];
        const englishVoices = voices.filter((voice) =>
          voice.lang?.toLowerCase().startsWith('en')
        );

        const scoreVoice = (voice: SpeechSynthesisVoice) => {
          const language = voice.lang?.toLowerCase() ?? '';
          const name = voice.name?.toLowerCase() ?? '';
          let score = 0;

          if (language === 'en-gb') score += 50;
          if (language === 'en-us') score += 35;
          if (language.startsWith('en')) score += 20;
          if (name.includes('premium') || name.includes('enhanced')) score += 15;
          if (name.includes('neural') || name.includes('natural')) score += 15;
          if (name.includes('daniel') || name.includes('serena') || name.includes('samantha')) {
            score += 8;
          }

          return score;
        };

        const bestVoice = englishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
        if (mounted && bestVoice) {
          setPreferredVoice({
            identifier: bestVoice.voiceURI,
            name: bestVoice.name,
            language: bestVoice.lang,
          });
        }
      } catch {
        if (mounted) setPreferredVoice(null);
      }
    };

    loadPreferredVoice();

    return () => {
      mounted = false;
    };
  }, []);

  const getSpeechText = (text: string) =>
    text
      .replace(/\bPHOtograph\b/g, 'photograph')
      .replace(/\bphoTOgrapher\b/g, 'photographer')
      .replace(/\bTAble\b/g, 'table')
      .replace(/\baBOUT\b/g, 'about')
      .replace(/\bBEAUtiful\b/g, 'beautiful')
      .replace(/\btoMORrow\b/g, 'tomorrow')
      .replace(/\//g, '')
      .replace(/[ɪːæʌ]/g, '')
      .replace(/\bPHO-to-graph\b/i, 'photograph')
      .replace(/\bphoTOgrapher\b/i, 'photographer')
      .replace(/\bpho-TO-graph\b/i, 'photographer')
      .trim();

  const speak = async (text: string) => {
    const speechText = getSpeechText(text);
    if (!speechText) return;

    setSpeakingText(text);
    void markPracticeActivityToday(`pronunciation:${lesson.title}:${text}`);

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof SpeechSynthesisUtterance !== 'undefined' &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      const voice = window.speechSynthesis
        .getVoices()
        .find((candidate) => candidate.voiceURI === preferredVoice?.identifier);

      utterance.lang = 'en-GB';
      utterance.voice = voice ?? null;
      utterance.rate = 0.78;
      utterance.pitch = 1;
      utterance.onend = () => setSpeakingText(null);
      utterance.onerror = () => setSpeakingText(null);
      window.speechSynthesis.speak(utterance);
      return;
    }

    setTimeout(() => setSpeakingText(null), 450);
  };

  const openImageModal = () => {
    if (!imageSource) return;

    navigation.navigate('FullImageModal', {
      source: imageSource,
      uri: lesson.imageUrl,
    });
  };

  const selectPracticeItem = (index: number) => {
    const itemCount = mainPracticeItems.length;
    if (itemCount === 0) return;
    setSelectedPracticeIndex((index + itemCount) % itemCount);
  };

  return (
    <DesktopTypographyProvider mode="scroll">
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        {
          paddingTop: topContentInset,
          paddingBottom: insets.bottom + 24,
        },
        isDesktopWeb && styles.desktopContentWrap,
        isDesktopWeb && { maxWidth: desktopContentMaxWidth },
      ]}
    >
      <BackButton label="Back to Pronunciation" onPress={() => navigation.goBack()} />

      <View
        style={[
          styles.practicePanel,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? colors.border : '#d9e2ec',
          },
        ]}
      >
        <View style={styles.practiceHeader}>
          <View style={styles.titleBlock}>
            <Text style={[styles.practiceLabel, { color: colors.secondaryText }]}>
              {lesson.category}
            </Text>
            <Text style={[styles.practiceTitle, { color: colors.text }]}>
              {lesson.title}
            </Text>
          </View>
          <View style={[styles.soundBadge, { backgroundColor: accentColor }]}>
            <MaterialIcons name="volume-up" size={Math.round(24 * desktopScale)} color="#ffffff" />
          </View>
        </View>

        <Text style={[styles.practiceSubtitle, { color: colors.secondaryText }]}>
          {lesson.subtitle}
        </Text>
        <Text style={[styles.voiceText, { color: colors.secondaryText }]}>
          Voice: {preferredVoice ? `${preferredVoice.name} (${preferredVoice.language})` : 'device default'}
        </Text>

        {imageSource && (
          <View style={styles.imageSection}>
            <ImageWithCredit
              source={imageSource}
              uri={lesson.imageUrl}
              onPress={openImageModal}
              style={[styles.lessonImage, { height: imageHeight }]}
            />
          </View>
        )}

        <View
          style={[
            styles.goalBox,
            {
              backgroundColor: isDarkMode ? colors.successSoft : '#effaf5',
              borderColor: isDarkMode ? colors.success : '#cbeedd',
            },
          ]}
        >
          <MaterialIcons name="flag" size={Math.round(21 * desktopScale)} color={isDarkMode ? colors.success : '#31A87C'} />
          <View style={styles.goalContent}>
            <Text style={[styles.goalLabel, { color: isDarkMode ? colors.success : '#31A87C' }]}>Today I can</Text>
            <Text style={[styles.goalText, { color: colors.text }]}>{lesson.goal}</Text>
          </View>
        </View>

        <View style={[styles.focusBox, { backgroundColor: colors.buttonBackground }]}>
          <Text style={styles.focusLabel}>Focus</Text>
          <Text style={styles.focusText}>{lesson.focus}</Text>
        </View>

        <Text style={[styles.tipText, { color: colors.text }]}>{lesson.tip}</Text>

        {usefulPhrases.length > 0 && (
          <View style={styles.phraseSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Useful phrases</Text>
            {usefulPhrases.map((phrase) => (
              <TouchableOpacity
                key={phrase}
                style={[
                  styles.phraseButton,
                  {
                    backgroundColor: speakingText === phrase
                      ? colors.buttonBackground
                      : isDarkMode
                        ? colors.surface
                        : '#f8fafc',
                    borderColor: speakingText === phrase
                      ? colors.buttonBackground
                      : isDarkMode
                        ? colors.border
                        : '#e6edf5',
                  },
                ]}
                onPress={() => {
                  const practiceIndex = mainPracticeItems.indexOf(phrase);
                  if (practiceIndex >= 0) setSelectedPracticeIndex(practiceIndex);
                  speak(phrase);
                }}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityLabel={`Listen to "${phrase}"`}
              >
                <MaterialIcons
                  name={speakingText === phrase ? 'volume-up' : 'play-arrow'}
                  size={Math.round(20 * desktopScale)}
                  color={speakingText === phrase ? '#ffffff' : colors.primary}
                />
                <Text
                  style={[
                    styles.phraseText,
                    { color: speakingText === phrase ? '#ffffff' : colors.text },
                  ]}
                >
                  {phrase}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!lesson.ruleCards?.length && (
          <View style={styles.ruleSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How it works</Text>
            {lesson.ruleCards.map((rule) => (
              <View
                key={rule.title}
                style={[
                  styles.ruleCard,
                  {
                    backgroundColor: isDarkMode ? colors.surface : '#f8fafc',
                    borderColor: isDarkMode ? colors.border : '#e6edf5',
                  },
                ]}
              >
                <View style={[styles.ruleBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.ruleBadgeText}>{rule.title}</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={[styles.ruleDescription, { color: colors.text }]}>
                    {rule.description}
                  </Text>
                  <View style={styles.ruleExamples}>
                    {rule.examples.map((word) => (
                      <TouchableOpacity
                        key={word}
                        style={[
                          styles.ruleExampleChip,
                          speakingText === word && styles.wordChipActive,
                          {
                            backgroundColor: speakingText === word
                              ? colors.buttonBackground
                              : isDarkMode
                                ? colors.surfaceAlt
                                : '#ecf6ff',
                            borderColor: speakingText === word
                              ? colors.buttonBackground
                              : isDarkMode
                                ? colors.borderStrong
                                : '#d0e7fb',
                          },
                        ]}
                        onPress={() => speak(word)}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={`Listen to "${word}"`}
                      >
                        <MaterialIcons
                          name={speakingText === word ? 'volume-up' : 'play-arrow'}
                          size={Math.round(16 * desktopScale)}
                          color={speakingText === word ? '#ffffff' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.ruleExampleText,
                            speakingText === word && styles.wordChipTextActive,
                            { color: speakingText === word ? '#ffffff' : isDarkMode ? colors.text : '#134975' },
                          ]}
                        >
                          {word}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!!lesson.commonMistake && (
          <View
            style={[
              styles.mistakeBox,
              {
                backgroundColor: isDarkMode ? colors.dangerSoft : '#fff1f1',
                borderColor: isDarkMode ? colors.danger : '#EF6F6C',
              },
            ]}
          >
            <MaterialIcons name="error-outline" size={Math.round(21 * desktopScale)} color={isDarkMode ? colors.danger : '#EF6F6C'} />
            <Text style={[styles.mistakeText, { color: colors.text }]}>
              {lesson.commonMistake}
            </Text>
          </View>
        )}

        <View style={styles.soundPracticeSection}>
          {usefulPhrases.length > 0 && (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound practice</Text>
          )}
          <View style={styles.exampleRow}>
            {lesson.examples.map((word) => (
              <TouchableOpacity
                key={word}
                style={[
                  styles.wordChip,
                  speakingText === word && styles.wordChipActive,
                  {
                    backgroundColor: speakingText === word
                      ? colors.buttonBackground
                      : isDarkMode
                        ? colors.surfaceAlt
                        : '#ecf6ff',
                    borderColor: speakingText === word
                      ? colors.buttonBackground
                      : isDarkMode
                        ? colors.borderStrong
                        : '#d0e7fb',
                  },
                ]}
                onPress={() => speak(word)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Listen to "${word}"`}
              >
                <MaterialIcons
                  name={speakingText === word ? 'volume-up' : 'play-arrow'}
                  size={Math.round(18 * desktopScale)}
                  color={speakingText === word ? '#ffffff' : colors.primary}
                />
                <Text
                  style={[
                    styles.wordChipText,
                    speakingText === word && styles.wordChipTextActive,
                    { color: speakingText === word ? '#ffffff' : isDarkMode ? colors.text : '#134975' },
                  ]}
                >
                  {word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.tryBox,
            {
              backgroundColor: isDarkMode ? colors.surface : '#f8fafc',
              borderColor: isDarkMode ? colors.border : '#e6edf5',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Try it</Text>
          <Text style={[styles.tryText, { color: colors.secondaryText }]}>
            Listen once, repeat twice, then say the phrase with your own information.
          </Text>
          <View style={styles.practiceSwitchRow}>
            <TouchableOpacity
              style={[
                styles.practiceSwitchButton,
                { borderColor: accentColor },
              ]}
              onPress={() => selectPracticeItem(selectedPracticeIndex - 1)}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel="Previous phrase"
            >
              <MaterialIcons name="chevron-left" size={Math.round(22 * desktopScale)} color={accentColor} />
              <Text style={[styles.practiceSwitchText, { color: accentColor }]}>Previous</Text>
            </TouchableOpacity>
            <Text style={[styles.practiceCounter, { color: colors.secondaryText }]}>
              {selectedPracticeIndex + 1} / {mainPracticeItems.length}
            </Text>
            <TouchableOpacity
              style={[
                styles.practiceSwitchButton,
                { borderColor: accentColor },
              ]}
              onPress={() => selectPracticeItem(selectedPracticeIndex + 1)}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel="Next phrase"
            >
              <Text style={[styles.practiceSwitchText, { color: accentColor }]}>Next</Text>
              <MaterialIcons name="chevron-right" size={Math.round(22 * desktopScale)} color={accentColor} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.tryPhraseButton,
              {
                borderColor: accentColor,
                backgroundColor: speakingText === practiceStarter ? accentColor : 'transparent',
              },
            ]}
            onPress={() => speak(practiceStarter)}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={`Listen to "${practiceStarter}"`}
          >
            <MaterialIcons
              name={speakingText === practiceStarter ? 'volume-up' : 'play-arrow'}
              size={Math.round(20 * desktopScale)}
              color={speakingText === practiceStarter ? '#ffffff' : accentColor}
            />
            <Text
              style={[
                styles.tryPhraseText,
                { color: speakingText === practiceStarter ? '#ffffff' : colors.text },
              ]}
            >
              {practiceStarter}
            </Text>
          </TouchableOpacity>
          <View style={styles.checkRow}>
            <View style={[styles.checkDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.checkText, { color: colors.text }]}>Keep the important word strong.</Text>
          </View>
          <View style={styles.checkRow}>
            <View style={[styles.checkDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.checkText, { color: colors.text }]}>Finish the final sound clearly.</Text>
          </View>
          <View style={styles.checkRow}>
            <View style={[styles.checkDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.checkText, { color: colors.text }]}>Use it once in class or revision.</Text>
          </View>
        </View>

      </View>
    </ScrollView>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContentWrap: { width: '100%', alignSelf: 'center' },
  practicePanel: {
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  practiceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: { flex: 1, paddingRight: 12 },
  practiceLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  practiceTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  soundBadge: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  practiceSubtitle: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  voiceText: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  imageSection: {
    marginTop: 16,
  },
  lessonImage: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  goalBox: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
  },
  goalContent: {
    flex: 1,
    marginLeft: 8,
  },
  goalLabel: {
    color: '#31A87C',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  goalText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  focusBox: {
    backgroundColor: '#1671B6',
    borderRadius: 8,
    marginTop: 16,
    padding: 14,
  },
  focusLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  focusText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  tipText: { fontSize: 16, lineHeight: 22, marginTop: 14 },
  phraseSection: {
    marginTop: 18,
  },
  phraseButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  phraseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginLeft: 8,
  },
  ruleSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  ruleCard: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  ruleBadge: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginRight: 12,
    minHeight: 42,
    minWidth: 48,
    paddingHorizontal: 8,
  },
  ruleBadgeText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  ruleContent: {
    flex: 1,
  },
  ruleDescription: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  ruleExamples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    marginTop: 8,
  },
  ruleExampleChip: {
    alignItems: 'center',
    backgroundColor: '#ecf6ff',
    borderColor: '#d0e7fb',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 3,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  ruleExampleText: {
    color: '#134975',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 3,
  },
  mistakeBox: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 6,
    padding: 12,
  },
  mistakeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 4,
  },
  soundPracticeSection: { marginTop: 14 },
  wordChip: {
    alignItems: 'center',
    backgroundColor: '#ecf6ff',
    borderColor: '#d0e7fb',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  wordChipActive: {
    backgroundColor: '#1671B6',
    borderColor: '#1671B6',
  },
  wordChipText: { color: '#134975', fontSize: 15, fontWeight: '700', marginLeft: 3 },
  wordChipTextActive: { color: '#ffffff' },
  tryBox: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  tryText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 10,
  },
  practiceSwitchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  practiceSwitchButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 38,
    paddingHorizontal: 9,
  },
  practiceSwitchText: {
    fontSize: 13,
    fontWeight: '900',
  },
  practiceCounter: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  tryPhraseButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tryPhraseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginLeft: 6,
  },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 7,
  },
  checkDot: {
    borderRadius: 999,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  checkText: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 19 },
});
