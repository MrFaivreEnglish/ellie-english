import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import BackButton from '../components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { 
    isDarkMode, 
    toggleTheme, 
    colors,
    isGrammarGameMode,
    toggleGrammarGameMode,
    isVocabTimerMode,
    toggleVocabTimerMode
  } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 0) : 0 // iOS only; Android uses status bar space
        }
      ]}
    >      <BackButton label="Back to Home" onPress={() => navigation.navigate('Home')} />
      
      <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      
      <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
        <View style={styles.settingTextContainer}>
          <MaterialIcons name="brightness-6" size={24} color={colors.text} />
          <Text style={[styles.settingText, { color: colors.text }]}>Night Mode</Text>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: '#1671B6' }}
          thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
        <View style={styles.settingTextContainer}>
          <MaterialIcons name="sports-esports" size={24} color={colors.text} />
          <Text style={[styles.settingText, { color: colors.text }]}>Grammar Game Mode</Text>
        </View>
        <Switch
          value={isGrammarGameMode}
          onValueChange={toggleGrammarGameMode}
          trackColor={{ false: '#767577', true: '#9575CD' }}
          thumbColor={isGrammarGameMode ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
        <View style={styles.settingTextContainer}>
          <MaterialIcons name="timer" size={24} color={colors.text} />
          <Text style={[styles.settingText, { color: colors.text }]}>Vocabulary Timer Mode</Text>
        </View>
        <Switch
          value={isVocabTimerMode}
          onValueChange={toggleVocabTimerMode}
          trackColor={{ false: '#767577', true: '#FFB74D' }}
          thumbColor={isVocabTimerMode ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Game Mode: Play grammar exercises with 3 lives
        </Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Timer Mode: Race against the clock in vocabulary exercises
        </Text>
      </View>

      {/* Credits Section */}
      <View style={styles.creditsContainer}>
        <Text style={[styles.creditsTitle, { color: colors.text }]}>Credits</Text>
        <Text style={[styles.creditsText, { color: colors.secondaryText }]}>
          • Application concept & development: Mr Faivre{"\n"}
          • Images: Mr Faivre with icons from Flaticon{"\n"}
          • Built with React Native & Expo
        </Text>
      </View>
    </View>
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
    fontWeight: '600',
    marginLeft: 4,
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
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  infoContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // New styles for credits section
  creditsContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  creditsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  creditsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});