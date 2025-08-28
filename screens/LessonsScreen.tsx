import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import BackButton from '../components/BackButton';
import { toast } from 'sonner-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const lessonCategories = [  {    title: '6e',    icon: '❤️',  // Heart emoji
    color: '#E57373', // Rouge doux
    lessons: [
      { title: "Unit 0 : Welcome to the English Class", url: 'https://digipad.app/p/1212467/6b87b8ceeec43' },
      { title: "Unit 1 : That's me!", url: 'https://digipad.app/p/1212468/a0fed9d2764f5' },
      { title: "Unit 2 : Amazing families!", url: 'https://digipad.app/p/1212469/64d0f0c0f50de' },
      { title: "Mini Unit 1 : Spooky Halloween!", url: 'https://digipad.app/p/1212484/e66796260e5d7' },
      { title: "Mini Unit 2 : Thanksgiving", url: 'https://digipad.app/p/1212485/de34521838b7b' },
      { title: "Unit 3 : School in the UK", url: 'https://digipad.app/p/1212470/cc606bdae2a54' },
      { title: "Unit 4 : Christmas in the UK", url: 'https://digipad.app/p/1212472/2568a09a7fe0b' },
      { title: "Unit 5 : Superheroes", url: 'https://digipad.app/p/1212482/1edf4446b3e37' },
      { title: "Unit 6 : My House", url: 'https://digipad.app/p/1212473/6b253f881752f' },
      { title: "Unit 7 : Animals in London", url: 'https://digipad.app/p/1212474/42b1b83781081' },
      { title: "Unit 8 : Holidays in the USA", url: 'https://digipad.app/p/1212476/add6b50ad4ff1' },
      { title: "Unit 9 : Welcome to the Highlands!", url: 'https://digipad.app/p/1212480/fb69c6155bdbb' },
      { title: "Unit 10 : Have fun with food!", url: 'https://digipad.app/p/1212483/7aa72e822b5fb' },
      { title: "Unit 11 : British legends", url: 'https://digipad.app/p/1212486/213041759c181' },
    ]
  },  {    title: '5e',
    icon: '🏅',  // Medal emoji
    color: '#64B5F6', // Bleu doux
    lessons: [
      { title: 'Unit 1: That\'s me!', url: 'https://digipad.app/p/807000/eb9227f5d2c64' },
      { title: 'Unit 2: Let\'s play!', url: 'https://digipad.app/p/550899/eda29ef422829' },
      { title: 'Unit 3: New York, New York!', url: 'https://digipad.app/p/559800/60a65979c163e' },
      { title: 'Unit 4: Welcome to America!', url: 'https://digipad.app/p/612010/25fed7858664c' },
      { title: 'Unit 5: British legends!', url: 'https://digipad.app/p/1137677/939d59f52cfce' },
      { title: 'Unit 6: My robot friend!', url: 'https://digipad.app/p/682343/0383f7f84da3b' },
      { title: 'Unit 7: Off to summer camp!', url: 'https://digipad.app/p/788075/d020a51c8716a' }
    ]
  },  {    title: '4e',
    icon: '🏆',  // Trophy emoji
    color: '#FFB74D', // Orange doux
    lessons: [
      { title: 'Unit 1: Eating American Style!', url: 'https://digipad.app/p/837534/5a2b877226b53' },
      { title: 'Unit 2: Enjoy the trip!', url: 'https://digipad.app/p/557680/6bc5305145694' },
      { title: 'Unit 3: Welcome to the team', url: 'https://digipad.app/p/1274332/481b20f6faa2f' },
      { title: 'Unit 4: Like and Subscribe!', url: 'https://digipad.app/p/611916/4717d2cec34cb' },
      { title: 'Unit 5: Who\'s the culprit?', url: 'https://digipad.app/p/639127/54ba8570d288c' },
      { title: 'Unit 6: Space Oddity', url: 'https://digipad.app/p/1136904/cb4695e57bb79' },
      { title: 'Unit 7: Fashion the world!', url: 'https://digipad.app/p/1274380/77e7923aa1453' },
    ]
  },  {    title: '3e',    icon: '⭐',  // Star emoji
    color: '#81C784', // Vert doux
    lessons: [      { title: 'Unit 1: Once upon a time in Hollywood!', url: 'https://digipad.app/p/837442/f004b8c5852b4' },
      { title: 'Unit 2: Blitz Britain', url: 'https://digipad.app/p/557684/12588426f4da1' },
      { title: 'Unit 3: Hire me!', url: 'https://digipad.app/p/594612/757688673ed14' },
      { title: 'Unit 4: Us versus the world!', url: 'https://digipad.app/p/929952/8168a61b6f0cf' },
      { title: 'Unit 5: Love is in the air!', url: 'https://digipad.app/p/639123/9407c817aed48' },
      { title: 'Unit 6: I want to break free!', url: 'https://digipad.app/p/710125/a8ab3ac9284d9' },
    ]
  },  {    title: 'SEGPA',
    icon: '🎯',  // Target emoji
    color: '#BA68C8', // Violet doux
    lessons: [
      { title: 'Unit 1: That\'s me!', url: 'https://digipad.app/p/1274335/1390481b5587c' },
      { title: 'Unit 2: Let\'s play!', url: 'https://digipad.app/p/573547/9c25a461f960d' },
      { title: 'Unit 3: My dream job!', url: 'https://digipad.app/p/782151/a76b33edb3af2' },
      { title: 'Unit 4: New York, New York!', url: 'https://digipad.app/p/1052736/71549e46c028d' },
      { title: 'Unit 5: Eating American style!', url: 'https://digipad.app/p/659867/d2e470e9402cb' },
      { title: 'Unit 6: My digital footprint!', url: 'https://digipad.app/p/621801/05d06e8bcbc0a' },
      { title: 'Unit 7: California dreaming!', url: 'https://digipad.app/p/1274340/0dde28307cb46' }
    ]
  },
  {    title: 'Irregular Verbs',
    icon: '✨',  // Sparkles emoji
    color: '#4DD0E1', // Turquoise doux
    lessons: [
      { title: 'All Irregular Verbs', url: 'https://digipad.app/p/573582/69f8ed4f2129d' }
    ]
  },
];

// Inline placeholder configuration (4 hidden spots per category).
// Toggle visible: true and optionally set title/url to show them.
// If url is empty, the item appears dimmed and is not clickable.
export type PlaceholderSlot = {
  visible: boolean;
  title?: string;
  url?: string;
};

const inlinePlaceholders: Record<string, PlaceholderSlot[]> = {
  '6e': [
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
  ],
  '5e': [
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
  ],
  '4e': [
    { visible: false, title: 'Unit 2: Join the club!', url: 'https://digipad.app/p/807030/54a9568f66dca' },
    { visible: false, title: 'Unit 7: Earth Day, everyday!', url: 'https://digipad.app/p/774864/257068f355307' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
  ],
  '3e': [
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
  ],
  'SEGPA': [
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
  ],
  'Irregular Verbs': [
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
    { visible: false, title: '', url: '' },
  ],
};

export default function LessonsScreen() {
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {    toast('Cannot open this URL', {
        type: 'error'
      });
      }
    } catch (err) {    toast('An error occurred while opening the link', {
        type: 'error'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      toast('Link copied to clipboard', { type: 'success' });
    } catch (err) {
      toast('Failed to copy link', { type: 'error' });
    }
  };

  const showLink = (url) => {
    setSelectedLink(url);
    openLink(url);
  };

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colors.background }
      ]}
      contentContainerStyle={{
        paddingTop: Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 0) : 0 // iOS only; Android draws behind status bar
      }}
    >
      <BackButton label="Back to Home" onPress={() => navigation.navigate('Home')} />
      <Text style={[styles.headerTitle, { color: colors.text }]}>Lessons</Text>
      {lessonCategories.map((category, index) => (
        <View key={index} style={[styles.categoryContainer, { 
          backgroundColor: colors.card,
          shadowColor: isDarkMode ? '#000000' : '#000000',
          shadowOpacity: isDarkMode ? 0.2 : 0.1,
        }]}>
          <TouchableOpacity
            style={[styles.categoryHeader, { backgroundColor: category.color }]}
            onPress={() => setSelectedCategory(selectedCategory === index ? null : index)}
          >            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <MaterialIcons 
              name={selectedCategory === index ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          {selectedCategory === index && (
            <View style={styles.lessonsContainer}>
              {category.lessons.map((lesson, lessonIndex) => (
                <TouchableOpacity
                  key={lessonIndex}
                  style={[styles.lessonItem, { 
                    borderBottomColor: isDarkMode ? '#444444' : '#eeeeee' 
                  }]}                  onPress={() => openLink(lesson.url)}
                >
                  <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                  <MaterialIcons name="arrow-forward-ios" size={16} color={colors.secondaryText} />
                </TouchableOpacity>
              ))}
              {/* Placeholder unit spots (up to 4 per category). Now configured inline above. */}
              {(inlinePlaceholders[category.title] || []).filter((p: PlaceholderSlot) => p.visible).slice(0, 4).map((spot, idx) => {
                const clickable = !!spot.url;
                return (
                  <TouchableOpacity
                    key={`ph-${idx}`}
                    style={[styles.lessonItem, {
                      borderBottomColor: isDarkMode ? '#444444' : '#eeeeee',
                      opacity: clickable ? 1 : 0.6,
                    }]}
                    onPress={() => clickable && spot.url ? openLink(spot.url) : undefined}
                    disabled={!clickable}
                  >
                    <Text style={[styles.lessonTitle, { color: colors.text }]}>
                      {spot.title && spot.title.trim().length > 0 ? spot.title : 'Unit spot'}
                    </Text>
                    <MaterialIcons name="arrow-forward-ios" size={16} color={colors.secondaryText} />
                  </TouchableOpacity>
                );
              })}
            </View>          )}
        </View>
      ))}
      
      {selectedLink && (
        <View style={[styles.linkContainer, { 
          backgroundColor: colors.card,
          shadowColor: isDarkMode ? '#000000' : '#000000',
          shadowOpacity: isDarkMode ? 0.2 : 0.1,
        }]}>
          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => copyToClipboard(selectedLink)}
          >
            <Text style={[styles.linkText, { color: colors.text }]}>{selectedLink}</Text>
            <MaterialIcons name="content-copy" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({  container: {
    flex: 1,
  },  backButton: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },  categoryIcon: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lessonTitle: {
    fontSize: 16,
    flex: 1,
  },
  linkContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
});