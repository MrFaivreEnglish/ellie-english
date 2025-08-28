import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../components/BackButton';
import PresentSimpleGrammar from '../grammar/PresentSimpleGrammar';
import PresentNegativeGrammar from '../grammar/PresentNegativeGrammar';
import PreteritGrammar from '../grammar/PreteritGrammar';
import PresentIngGrammar from '../grammar/PresentIngGrammar';
import PastPerfectGrammar from '../grammar/PastPerfectGrammar';
import PresentPerfectGrammar from '../grammar/PresentPerfectGrammar';
import ComparativeGrammar from '../grammar/ComparativeGrammar';
import SuperlativeGrammar from '../grammar/SuperlativeGrammar';
import MustGrammar from '../grammar/MustGrammar';
import ShouldGrammar from '../grammar/ShouldGrammar';
import WouldLikeGrammar from '../grammar/WouldLikeGrammar';
import LikeGrammar from '../grammar/LikeGrammar';
import PastIngGrammar from '../grammar/PastIngGrammar';
import BeGoingToGrammar from '../grammar/BeGoingToGrammar';
import FutureWillGrammar from '../grammar/FutureWillGrammar';
import Conditional1Grammar from '../grammar/Conditional1Grammar';
import Conditional2Grammar from '../grammar/Conditional2Grammar';
import CanGrammar from '../grammar/CanGrammar';
import BePreteritGrammar from '../grammar/BePreteritGrammar';
import SuperlativeInferiorityGrammar from '../grammar/SuperlativeInferiorityGrammar';
import PresentIngInterrogativeGrammar from '../grammar/PresentIngInterrogativeGrammar';
import ImperativeGrammar from '../grammar/ImperativeGrammar';
import HypothesesGrammar from '../grammar/HypothesesGrammar';
import MustHaveToGrammar from '../grammar/MustHaveToGrammar';
import SinceForGrammar from '../grammar/SinceForGrammar';
import CanBeAbleToGrammar from '../grammar/CanBeAbleToGrammar';
import ComparativeInferiorityEqualityGrammar from '../grammar/ComparativeInferiorityEqualityGrammar';
import CouldGrammar from '../grammar/CouldGrammar';
import HadToWasAllowedToGrammar from '../grammar/HadToWasAllowedToGrammar';
import FrequencyGrammar from '../grammar/FrequencyGrammar';
import PassivePresGrammar from '../grammar/PassivePresGrammar';
import PassivePastGrammar from '../grammar/PassivePastGrammar';
import PresentPerfectNIGrammar from '../grammar/PresentPerfectNIGrammar';
import PreteritNIGrammar from '../grammar/PreteritNIGrammar';
// New grammar lessons (added so they show in the UI)
import ArticlesGrammar from '../grammar/ArticlesGrammar';
import BeVerbGrammar from '../grammar/BeVerbGrammar';
import GenitiveGrammar from '../grammar/GenitiveGrammar';
import PossessivesGrammar from '../grammar/PossessivesGrammar';
import RelativePronounsGrammar from '../grammar/RelativePronounsGrammar';
import WordTypesGrammar from '../grammar/WordTypesGrammar';
import HaveHaveGotGrammar from '../grammar/HaveHaveGotGrammar';

const sectionTitles = ['🌱 Essentials', '🌿 Developing', '🌳 Growing strong'];
const grammarCategories = [
  {
    group: '🌱 Essentials', title: '🌱 Essentials', icon: '🌱', color: '#AED581',
    subcategories: [
      // Requested Essentials order
      { title: 'Bases de grammaire', lessons: [WordTypesGrammar, ArticlesGrammar] },
      { title: 'Temps du présent', lessons: [PresentSimpleGrammar, PresentNegativeGrammar, PresentIngGrammar, PresentIngInterrogativeGrammar] },
      { title: 'Parler de soi', lessons: [LikeGrammar, BeVerbGrammar, HaveHaveGotGrammar] },
      { title: 'La possession', lessons: [GenitiveGrammar, PossessivesGrammar] },
      { title: 'Pouvoir / Devoir', lessons: [CanGrammar, MustGrammar] },
      { title: 'Fréquence', lessons: [FrequencyGrammar] },
    ]
  },
  {
    group: '🌿 Developing', title: '🌿 Developing', icon: '🌿', color: '#4FC3F7',
    subcategories: [
      // Requested Developing order and Modaux lesson ordering
      { title: 'Temps du passé', lessons: [PreteritGrammar, BePreteritGrammar, PreteritNIGrammar, PastIngGrammar] },
      { title: 'Futur', lessons: [FutureWillGrammar, BeGoingToGrammar] },
      { title: 'Modaux', lessons: [CanBeAbleToGrammar, MustHaveToGrammar, HypothesesGrammar, WouldLikeGrammar] },
      { title: 'Comparaisons', lessons: [ComparativeGrammar, ComparativeInferiorityEqualityGrammar, SuperlativeGrammar, SuperlativeInferiorityGrammar] },
           { title: 'Ordres/Conseils', lessons: [ShouldGrammar, ImperativeGrammar] },
      // 'Since et For' moved to Growing strong as requested
    ]
  },
  {
    group: '🌳 Growing strong', title: '🌳 Growing strong', icon: '🌳', color: '#FFB74D',
    subcategories: [
      // Include Since et For in Temps parfaits per request
      { title: 'Temps parfaits', lessons: [PresentPerfectGrammar, PresentPerfectNIGrammar, PastPerfectGrammar, SinceForGrammar] },
      { title: 'Voix passive', lessons: [PassivePresGrammar, PassivePastGrammar] },
      { title: 'Pronoms', lessons: [RelativePronounsGrammar] },
      { title: 'Modaux avancés', lessons: [HadToWasAllowedToGrammar, CouldGrammar] },
      { title: 'Conditions', lessons: [Conditional1Grammar, Conditional2Grammar] },
    ]
  }
];

// Define unique colors for subcategories (cycle through LessonScreen palette)
const subColors = ['#E57373', '#64B5F6', '#FFB74D', '#81C784', '#BA68C8', '#4DD0E1'];

// Map each subcategory title to a corresponding emoji
const subEmojiMap: Record<string, string> = {
  'Temps du présent': '⏰', // alarm clock
  'Se présenter': '👋', // greeting
  'Fréquence': '🔁', // repeat symbol
  'Temps du passé': '📅', // calendar
  'Comparaisons': '⚖️',
  'Futur': '🔮', // crystal ball
  'Since et For': '📆',
  'Hypothèses': '❓',
  'Temps parfaits': '✔️', // tick
  'Voix passive': '🤐',
  'Modaux avancés': '🔧',
  'Conditions': '🎲', // dice
  'Ordres/Conseils': '💡',
  'Pouvoir / Devoir': '💪',
  'Modaux': '🛠️',
  // Added per request:
  'Bases de grammaire': '🏁',
  'La possession': '🐱'
};

// Flatten all subcategories to assign colors/emojis consistently
const allSubs = grammarCategories.reduce((acc, lvl) => acc.concat(lvl.subcategories), [] as { title: string; lessons: any[] }[]);

const GrammarCategoryList: React.FC<{ onSelectLesson: (lesson: any) => void }> = ({ onSelectLesson }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});

  const toggleSub = (key: string) => setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ 
        paddingTop: Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 0) : 0
      }}
    >
      <BackButton label="Back to Home" onPress={() => navigation.goBack()} />
      <Text style={[styles.headerTitle, { color: colors.text }]}>Grammar</Text>

      {grammarCategories.map((level) => (
        <View key={level.group} style={{ marginBottom: 32 }}>
          {/* Level header, plain title */}
          <Text style={[styles.levelTitle, { color: colors.text }]}>{level.title}</Text>
          {level.subcategories.map((sub, si) => {
            const key = `${level.group}-${si}`;
            const open = expandedSub[key];
            // Determine unique color and emoji for this subcategory
            const subIdx = allSubs.findIndex(ss => ss === sub);
            const subColor = subColors[subIdx % subColors.length];
            const emoji = subEmojiMap[sub.title] || '📚';
            return (
              <View key={key} style={[styles.categoryContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? '#000' : '#000', shadowOpacity: isDarkMode ? 0.2 : 0.1 }]}>                
                <TouchableOpacity style={[styles.categoryHeader, { backgroundColor: subColor }]} onPress={() => toggleSub(key)}>
                  <Text style={styles.categoryTitle}>{`${emoji} ${sub.title}`}</Text>
                  <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.text} />
                </TouchableOpacity>
                {open && (
                  <View style={styles.lessonsContainer}>
                    {sub.lessons.map((lesson: any, li: number) => (
                      <TouchableOpacity
                        key={li}
                        style={[styles.lessonItem, { borderBottomColor: isDarkMode ? '#444444' : '#eeeeee' }]}
                        onPress={() => onSelectLesson(lesson)}
                      >
                        <Image
                          source={typeof lesson.imageUrl === 'string' ? { uri: lesson.imageUrl } : lesson.imageUrl}
                          style={styles.lessonThumbnail}
                        />
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                          <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>{lesson.exercises.length} exercises</Text>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={16} color={colors.secondaryText} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

export default GrammarCategoryList;

const styles = StyleSheet.create({
  levelTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 8, 
    marginBottom: 16, 
    marginHorizontal: 16
  },
  container: {
    flex: 1,
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginVertical: 8, 
    marginHorizontal: 16
  },
  sectionDivider: { 
    height: 1, 
    marginHorizontal: 16,
    marginBottom: 8 
  },
  categoryContainer: { 
    marginBottom: 16, 
    marginHorizontal: 16,
    borderRadius: 16, 
    overflow: 'hidden', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 4, 
    elevation: 3 
  },
  categoryHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    justifyContent: 'space-between' 
  },
  categoryIcon: { fontSize: 24 },
  categoryTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 12 },
  lessonsContainer: { padding: 16 },
  lessonItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1
  },
  lessonThumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 8 },
  lessonInfo: { flex: 1, marginLeft: 16 },
  lessonTitle: { fontSize: 18, fontWeight: 'bold' },
  exerciseCount: { fontSize: 14, color: '#666' },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});