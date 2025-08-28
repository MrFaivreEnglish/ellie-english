import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Dimensions, Platform, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinchZoomImage from '../components/PinchZoomImage';
import * as Haptics from 'expo-haptics';
import BackButton from '../components/BackButton';
import GrammarCategoryList from './GrammarCategoryList';
import GrammarQuiz from './GrammarQuiz';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const GrammarScreen: React.FC = () => {
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  return selectedLesson ? (
    <GrammarQuiz lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />
  ) : (
    <GrammarCategoryList onSelectLesson={setSelectedLesson} />
  );
};

export default GrammarScreen;

const styles = StyleSheet.create({
  explanationContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  correctExplanation: {    backgroundColor: '#E8F7FA',
    borderColor: '#1671B6',
  },
  incorrectExplanation: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  container: {
    flex: 1,
    paddingHorizontal: 8, // Keep horizontal padding for content breathing room
  },
  backButton: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16, // Reduced from 24 to 16
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  categoryContainer: {
    marginBottom: 16,
    marginHorizontal: 8, // Reduced from 16 to 8 to increase horizontal width
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  lessonsContainer: {
    padding: 16,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lessonThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 16,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#666',
  },
  lessonImage: {
    width: '100%',
    height: 330, // Increased from 270 to 350
    marginTop: 2,
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  exerciseContainer: {
    padding: 24,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',    backgroundColor: '#1671B6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  feedbackContainer: {
    position: 'absolute',
    top: -16, // Increased top position from -8 to -16
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12, // Increased border radius
    marginTop: 8,
  },
  successFeedback: {
    backgroundColor: 'rgba(76, 175, 80, 0.95)', // Less transparent
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 16, // Larger border radius for a softer look
    paddingVertical: 24, // Increased padding to control height
    paddingHorizontal: 24,
    marginVertical: 12,
    width: '80%', // Occupy more width
    alignItems: 'center', // Ensure text inside is centered
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  errorFeedback: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF5350',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  successText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#C62828',
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: 24, // Increased from 16 to make it more prominent
    fontWeight: 'bold',
  },
  exercise: {
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    borderColor: '#1671B6',
  },
  incorrectOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  incorrectOptionText: {
    color: '#C62828',
  },
  correctAnswer: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  correctAnswerText: {
    color: 'white',
  },
  wrongAnswerText: {
    color: 'white',
  },
  completionContainer: {
    marginTop: 32,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  completionSubText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  completionButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    gap: 12,
  },
  restartButton: {
    marginTop: 8,
    backgroundColor: '#1671B6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9c27b0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  gameButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameButtonIcon: {
    marginRight: 8,
  },
  livesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lifeIcon: {
    marginHorizontal: 4,
  },
  gameOverContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  gameOverSubText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});