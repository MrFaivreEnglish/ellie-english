import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getLocalLessonImage, getLessonImage } from '../utils/vocabularyUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';

// Import vocabulary modules
import LoveVocab from '../vocabulary/LoveVocab';
import SpaceVocab from '../vocabulary/SpaceVocab';
import ClothesVocab from '../vocabulary/ClothesVocab';
import DetectiveVocab from '../vocabulary/DetectiveVocab';
import SchoolLvl2Vocab from '../vocabulary/SchoolLvl2Vocab';
import BodyVocab from '../vocabulary/BodyVocab';
import FoodVocab from '../vocabulary/FoodVocab';
import CookingVocab from '../vocabulary/CookingVocab';
import CityTravelVocab from '../vocabulary/CityTravelVocab';
import EmotionsVocab from '../vocabulary/EmotionsVocab';
import EmotionsLevel2Vocab from '../vocabulary/EmotionsLevel2Vocab';
import BreakfastVocab from '../vocabulary/BreakfastVocab';
import GeographyVocab from '../vocabulary/GeographyVocab';
import InternetVocab from '../vocabulary/InternetVocab';
import OpinionLevel1Vocab from '../vocabulary/OpinionLevel1Vocab';
import OpinionLevel2Vocab from '../vocabulary/OpinionLevel2Vocab';
import PersonalityLevel1Vocab from '../vocabulary/PersonalityLevel1Vocab';
import PersonalityLevel2Vocab from '../vocabulary/PersonalityLevel2Vocab';
import FurnitureVocab from '../vocabulary/FurnitureVocab';
import EcologyVocab from '../vocabulary/EcologyVocab';
import RobotsVocab from '../vocabulary/RobotsVocab';
import VideoGamesVocab from '../vocabulary/VideoGamesVocab';
import VideoGamePowersVocab from '../vocabulary/VideoGamePowersVocab';
import CinemaVocab from '../vocabulary/CinemaVocab';
import LegendsVocab from '../vocabulary/LegendsVocab';
import UKVocab from '../vocabulary/UKVocab';
import ActivityVocab from '../vocabulary/ActivityVocab';
import AnimalsVocab from '../vocabulary/AnimalsVocab';
import ClassroomEnglishVocab from '../vocabulary/ClassroomEnglishVocab';
import BullyingVocab from '../vocabulary/BullyingVocab';
import ExtremeSportsVocab from '../vocabulary/ExtremeSportsVocab';
import SegregationVocab from '../vocabulary/SegregationVocab';
import JobsVocab from '../vocabulary/JobsVocab';
import GettingAJobVocab from '../vocabulary/GettingAJobVocab';
import TypesOfDocumentsVocab from '../vocabulary/TypesOfDocumentsVocab';
import NourritureVocab from '../vocabulary/NourritureVocab';
import FrequencyAdverbsVocab from '../vocabulary/FrequencyAdverbsVocab';
import AtSchoolVocab from '../vocabulary/AtSchoolVocab';
import InstructionsVocab from '../vocabulary/InstructionsVocab';
import ColoursVocab from '../vocabulary/ColoursVocab';
import PhysicalDescriptionVocab from '../vocabulary/PhysicalDescriptionVocab';
import TheBlitzVocab from '../vocabulary/TheBlitzVocab';

// New standalone imports from ExtraVocab
import NationalityVocab from '../vocabulary/NationalityVocab';
import DailyRoutineVocab from '../vocabulary/DailyRoutineVocab';
import DateVocab from '../vocabulary/DateVocab';
import DailyQuestionsVocab from '../vocabulary/DailyQuestionsVocab';
import QuestionWordsVocab from '../vocabulary/QuestionWordsVocab';
import TastesVocab from '../vocabulary/TastesVocab';
import DescribingPictureVocab from '../vocabulary/DescribingPictureVocab';
import LocationVocab from '../vocabulary/LocationVocab';
import TimeVocab from '../vocabulary/TimeVocab';
import HouseVocab from '../vocabulary/HouseVocab';
import FamilyVocab from '../vocabulary/FamilyVocab';

// Lazy load vocabulary modules
const CATEGORY_EMOJI_MAP: { [key: string]: string } = {
  'Grammar & Useful Vocab': '📘',
  'People': '👥',
  'Life / School': '🏫',
  'Food & Cooking': '🍽️',
  'Culture / Hobbies': '🎭',
  'Science / Nature / Space': '🌌',
  'Objects / Places': '🏠',
  'Social Issues / Society': '⚖️',
  'Essentials': '🌱',
  // Add new Grammar category emoji
  'Grammar': '📘',
  // New History & Literatureé category emoji
  'History & Literatureé': '📜',
  'History & Literature': '📜',
  // Ensure current titles map to emojis
  'Science & Nature': '🌌',
  'Society': '⚖️',
};

const useVocabularyLessons = () => {
  // Return categories in the exact order requested. Each category contains an array
  // of lesson modules (imported above). Inside each category lessons are alphabetized
  // by their title before being returned.
  const categories = useMemo(() => {
    const groups = [
      {
        title: 'In the classroom',
        lessons: [
          ClassroomEnglishVocab,
          DailyQuestionsVocab,
          InstructionsVocab,
          TypesOfDocumentsVocab,
          DescribingPictureVocab,

        ],
      },
      {
        title: 'Essentials',
        lessons: [
          // Moved Frequency Adverbs and Question Words to Grammar
          TimeVocab,
          ColoursVocab,
          DateVocab,
          UKVocab,
        ],
      },
      {
        title: 'Presenting People',
        lessons: [
          EmotionsVocab,
          EmotionsLevel2Vocab,
          FamilyVocab,
          NationalityVocab,
          OpinionLevel2Vocab,
          OpinionLevel1Vocab,
          PersonalityLevel1Vocab,
          PersonalityLevel2Vocab,
          TastesVocab,
          JobsVocab,
          PhysicalDescriptionVocab,
          LoveVocab,
          // Added Body here from Objects / Places
          BodyVocab,
        ],
      },
      {
        title: 'Life / School',
        lessons: [
          DailyRoutineVocab,
          AtSchoolVocab,
          SchoolLvl2Vocab,
          // Moved Clothes, House, Furniture here from Objects / Places
          ClothesVocab,
          HouseVocab,
          FurnitureVocab,
        ],
      },
      {
        title: 'Food & Cooking',
        lessons: [
          FoodVocab,
          BreakfastVocab,
          CookingVocab,
          NourritureVocab,
        ],
      },
      {
        title: 'Culture / Hobbies',
        lessons: [
          ActivityVocab,
          CinemaVocab,
          CityTravelVocab,
          // Detective and Legends moved to History & Literatureé
          ExtremeSportsVocab,
          // LegendsVocab,
          VideoGamePowersVocab,
          VideoGamesVocab,
        ],
      },
      {
        title: 'History & Literature',
        lessons: [
          DetectiveVocab,
          LegendsVocab,
          SegregationVocab,
          TheBlitzVocab,
        ],
      },
      {
        title: 'Science & Nature',
        lessons: [
          AnimalsVocab,
          EcologyVocab,
          SpaceVocab,
          GeographyVocab,
          // Moved Robots here from Objects / Places
          RobotsVocab,
        ],
      },
      {
        title: 'Grammar',
        lessons: [
          FrequencyAdverbsVocab,
          QuestionWordsVocab,
          LocationVocab,
        ],
      },
      // Removed Objects / Places category since all its lessons were redistributed
      {
        title: 'Society',
        lessons: [
          BullyingVocab,
          // Segregation moved to History & Literatureé
          InternetVocab,
          GettingAJobVocab,
          // TheBlitz moved to History & Literatureé
        ],
      },
    ];

    // Clean up and sort the lessons alphabetically by their published title.
    return groups.map(group => ({
      title: group.title,
      lessons: group.lessons
        .filter(Boolean)
        .sort((a, b) => {
          const ta = (a.title || '');
          const tb = (b.title || '');

          // Ensure "Basics" precedes "+" within the same base (e.g., Opinion, Personality)
          const baseA = ta.split(' ')[0];
          const baseB = tb.split(' ')[0];
          if (baseA === baseB) {
            const isABasics = /\bBasics\b/i.test(ta);
            const isBBasics = /\bBasics\b/i.test(tb);
            const isAPlus = /\+/.test(ta);
            const isBPlus = /\+/.test(tb);

            if (isABasics && isBPlus) return -1; // Basics before Plus
            if (isAPlus && isBBasics) return 1;  // Plus after Basics
          }

          // Default alphabetical order
          return ta.localeCompare(tb);
        }),
    }));
  }, []);

  return categories;
};

export default function VocabularyScreen() {
  const categories = useVocabularyLessons();
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'abc'>('category');
  const [toggleWidth, setToggleWidth] = useState(0);
  const thumbX = useRef(new Animated.Value(0)).current;
  const segmentPadding = 8; // increased from 4 to make the toggle taller and roomier

  const filterLessonsByDifficulty = (lessonArray) => {
    if (!selectedDifficulty) return lessonArray;

    const difficultyMap = {
      // Exact mappings from provided list
      'Activities': 2,
      'Animals': 1,
      'American Dishes': 2,
      'Body': 1,
      'Breakfast': 1,
      'Bullying': 3,
      'Cinema': 3,
      'City Travel': 2,
      'Classroom English': 1,
      'Clothes': 1,
      'Colours': 1,
      'Cooking': 2,
      'Daily questions': 2,
      'Daily Routine': 1,
      'Date': 1,
      'Describing a picture': 2,
      'Detective': 2,
      'Ecology': 2,
      'Emotions': 1,
      'Emotions +': 3,
      'Extreme Sports': 3,
      'Family': 1,
      'Food Basics': 1,
      'Furniture': 1,
      'Geography': 2,
      'Getting a job': 3,
      'House': 1,
      'Instructions': 1,
      'Internet': 3,
      'Jobs': 2,
      'Legends': 2,
      'Location': 1,
      'Love': 3,
      'Nationality': 1,
      'Opinion Basics': 1,
      'Opinion +': 3,
      'Personality Basics': 1,
      'Personality +': 3,
      'Physical Description': 1,
      'Question Words': 1,
      'Robots': 2,
      'School Basics': 1,
      'School life': 2,
      'Segregation': 3,
      'Space': 3,
      'Tastes': 1,
      'The UK': 1,
      'Time': 1,
      'Types of documents': 2,
      'Video game powers': 2,
      'Video Games': 2,
      'The Blitz': 3,
    };

    return lessonArray.filter(lesson => {
      const cleanTitle = (lesson.title || '').replace(/\s*\d+$/, '');
      return difficultyMap[cleanTitle] === selectedDifficulty;
    });
  };

  const handleDifficultySelect = (level) => {
    setSelectedDifficulty(level === selectedDifficulty ? null : level);
    setShowDifficultyMenu(false);
  };

  const allLessons = useMemo(() => {
    // Flatten all lessons across categories and sort alphabetically by title
    const flat = categories.flatMap(cat => cat.lessons || []);
    return flat
      .filter(Boolean)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [categories]);

  // Animate the sliding thumb when view mode changes or width is measured
  useEffect(() => {
    const half = Math.max(0, (toggleWidth - segmentPadding * 2) / 2);
    const toValue = viewMode === 'category' ? 0 : half;
    Animated.timing(thumbX, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [viewMode, toggleWidth, thumbX]);

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colors.background }
      ]}
      contentContainerStyle={{
        paddingTop: Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 0) : 0 // iOS safe area; let Android draw behind status bar
      }}
      // Ensure the dropdown is not clipped by the ScrollView
      removeClippedSubviews={false}
      windowSize={5} // Reduce the number of rendered items
    >
      <BackButton label="Back to Home" onPress={() => navigation.navigate('Home')} />
      
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Vocabulary</Text>

        {/* Controls row: left segmented view toggle, right difficulty dropdown */}
        <View style={styles.controlsRow}>
          <View
            onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
            style={[
              styles.modeToggle,
              isDarkMode
                ? {
                    backgroundColor: colors.card,
                    borderColor: '#415a77',
                    borderWidth: 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: 5,
                  }
                : {
                    borderColor: '#d9e2ec',
                    backgroundColor: '#f6f9fc',
                    borderWidth: 1,
                  }
            ]}
          >
            {/* Sliding thumb */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: segmentPadding,
                bottom: segmentPadding,
                left: segmentPadding,
                width: Math.max(0, (toggleWidth - segmentPadding * 2) / 2),
                borderRadius: 16, // increased to match larger control
                backgroundColor: isDarkMode ? 'rgba(22,113,182,0.12)' : '#1671B6',
                borderWidth: isDarkMode ? 2 : 0,
                borderColor: '#1671B6',
                transform: [{ translateX: thumbX }],
                zIndex: 0,
              }}
            />

            {/* Options */}
            <TouchableOpacity
              style={[styles.modeOption]}
              onPress={() => setViewMode('category')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.modeOptionText,
                  viewMode === 'category'
                    ? (isDarkMode ? { color: colors.text } : { color: '#fff' })
                    : { color: colors.text },
                ]}
              >
                Category
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeOption]}
              onPress={() => setViewMode('abc')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.modeOptionText,
                  viewMode === 'abc'
                    ? (isDarkMode ? { color: colors.text } : { color: '#fff' })
                    : { color: colors.text },
                ]}
              >
                ABC
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerControls}>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(22,113,182,0.12)' : '#ffffff',
                  borderColor: '#1671B6',
                  shadowColor: isDarkMode ? '#000' : '#1671B6'
                }
              ]}
              onPress={() => setShowDifficultyMenu(!showDifficultyMenu)}
              activeOpacity={0.9}
            >
              <Text style={[styles.difficultyButtonText, { color: isDarkMode ? '#ffffff' : '#1671B6' }]}>  
                {selectedDifficulty ? '⭐'.repeat(selectedDifficulty) : 'Choose a level'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={22} color={'#1671B6'} />
            </TouchableOpacity>
            {showDifficultyMenu && (
              <View
                style={[
                  styles.difficultyMenu,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDarkMode ? '#415a77' : '#e5e7eb',
                  },
                ]}
              >  
                <TouchableOpacity 
                  style={[styles.difficultyMenuItem, { borderBottomColor: isDarkMode ? '#415a77' : '#f0f0f0' }, selectedDifficulty === null && { backgroundColor: isDarkMode ? 'rgba(22,113,182,0.15)' : '#E8F7FA' }]} 
                  onPress={() => handleDifficultySelect(null)}
                >
                  <Text style={[styles.difficultyMenuText, { color: colors.text }]}>All Levels</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.difficultyMenuItem, 
                    { borderBottomColor: isDarkMode ? '#415a77' : '#f0f0f0' },
                    selectedDifficulty === 1 && { backgroundColor: isDarkMode ? 'rgba(22,113,182,0.15)' : '#E8F7FA' }
                  ]}
                  onPress={() => handleDifficultySelect(1)}
                >
                  <Text style={[styles.difficultyMenuText, { color: colors.text }]}>⭐</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.difficultyMenuItem, 
                    { borderBottomColor: isDarkMode ? '#415a77' : '#f0f0f0' },
                    selectedDifficulty === 2 && { backgroundColor: isDarkMode ? 'rgba(22,113,182,0.15)' : '#E8F7FA' }
                  ]}
                  onPress={() => handleDifficultySelect(2)}
                >
                  <Text style={[styles.difficultyMenuText, { color: colors.text }]}>⭐⭐</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.difficultyMenuItem, 
                    { borderBottomColor: isDarkMode ? '#415a77' : '#f0f0f0' },
                    selectedDifficulty === 3 && { backgroundColor: isDarkMode ? 'rgba(22,113,182,0.15)' : '#E8F7FA' }
                  ]}
                  onPress={() => handleDifficultySelect(3)}
                >
                  <Text style={[styles.difficultyMenuText, { color: colors.text }]}>⭐⭐⭐</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Render either grouped-by-category or alphabetized grid */}
      {viewMode === 'category' ? (
        // Category mode
        categories.map((category) => {
          const filteredLessons = filterLessonsByDifficulty(category.lessons);
          if (selectedDifficulty && filteredLessons.length === 0) {
            return null; // Hide subcategory with no lessons for the selected difficulty
          }
          return (
            <View key={`cat-${category.title}`} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <View style={styles.categoryHeaderRow}>
                <Text style={styles.categoryEmoji}>{(CATEGORY_EMOJI_MAP[category.title] || '📚')}</Text>
                <Text style={[styles.categoryHeader, { color: colors.text }]}>{category.title}</Text>
              </View>
              <View style={styles.lessonsContainer}>
                {filteredLessons
                  .map((lesson, index) => (
                    <TouchableOpacity
                      key={`lesson-${lesson.id || lesson.title}-${index}`}  
                      style={[styles.lessonCard, { 
                        backgroundColor: colors.card,
                        borderColor: isDarkMode ? '#415a77' : 'rgba(0,0,0,0.05)',
                        borderWidth: 2,
                        shadowColor: isDarkMode ? '#000' : '#000',
                        shadowOpacity: isDarkMode ? 0.3 : 0.15,
                      }]}
                      onPress={() => {
                        if (lesson) {
                          navigation.navigate('VocabularyLesson', { lesson });
                        }
                      }}
                    >
                      <Image
                        // Prefer local bundled thumbnails when available; fallback to imgbb remote images
                        source={getLocalLessonImage(lesson.title) ? getLocalLessonImage(lesson.title) : { uri: getLessonImage(lesson.title) }}
                        style={styles.lessonImage}
                      />
                      <Text style={[styles.lessonTitle, { color: colors.text }]}>{(lesson.title || '').replace(/\s*\d+/, '')}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          );
        })
      ) : (
        // ABC mode
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={styles.lessonsContainer}>
            {filterLessonsByDifficulty(allLessons).map((lesson, index) => (
              <TouchableOpacity
                key={`abc-lesson-${lesson.id || lesson.title}-${index}`}
                style={[styles.lessonCard, { 
                  backgroundColor: colors.card,
                  borderColor: isDarkMode ? '#415a77' : 'rgba(0,0,0,0.05)',
                  borderWidth: 2,
                  shadowColor: isDarkMode ? '#000' : '#000',
                  shadowOpacity: isDarkMode ? 0.3 : 0.15,
                }]}
                onPress={() => {
                  if (lesson) {
                    navigation.navigate('VocabularyLesson', { lesson });
                  }
                }}
              >
                <Image
                  source={getLocalLessonImage(lesson.title) ? getLocalLessonImage(lesson.title) : { uri: getLessonImage(lesson.title) }}
                  style={styles.lessonImage}
                />
                <Text style={[styles.lessonTitle, { color: colors.text }]}>{(lesson.title || '').replace(/\s*\d+/, '')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 34,
    marginRight: 8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 44, // larger overall control height
    width: 175,
    marginRight: 8,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modeOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: -4,
    // Allow children (dropdown) to overflow and be visible above other content
    overflow: 'visible',
    zIndex: 9999,
  },
  categoryHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  container: {
    flex: 1,
  },
  lessonsContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lessonCard: {
    width: '48%',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  lessonImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingRight: 16,
    marginBottom: 10,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  aaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  aaImage: {
    width: 78,
    height: 78,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#fff',
  },
  aaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  aaSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    opacity: 0.95,
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  difficultyMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  difficultyMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyMenuText: {
    fontSize: 16,
    fontWeight: '600',
  },
});