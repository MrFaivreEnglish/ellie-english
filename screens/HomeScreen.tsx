import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const categories = [
  {
    title: 'Grammar',
    icon: 'edit',
    description: 'Révise tes leçons de grammaire avec des exercices interactifs!',
    color: '#45B7D1',
    route: 'Grammar'
  },
  {
    title: 'Vocabulary',
    icon: 'style',
    description: 'Apprends du vocabulaire par catégories et révise avec des cartes interactives!',
    color: '#4ECDC4',
    route: 'Vocabulary'
  },
  {
    title: 'Lessons',
    icon: 'menu-book',
    description: 'Retrouve tous les Digipad pour ne rien louper des cours!',    color: '#b29cd9',
    route: 'Lessons'
  },
  {
    title: 'Settings',
    icon: 'settings',
    description: 'Ajuste les préférences (mode sombre, etc.).',
    color: '#91a3b0', // A neutral color for settings
    route: 'Settings'
  }
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Treat widths >= 640px on web as "desktop" for a multi-column layout
  const isDesktop = Platform.OS === 'web' && width >= 640;

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colors.background }
      ]}
    >      
      <View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.card,
            paddingTop: Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 24) : 16
          }
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Welcome! 😊</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Choisis une catégorie pour commencer!</Text>
      </View>
      
      <View style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryCard,
              { backgroundColor: category.color }
            ]}
            onPress={() => navigation.navigate('MainTabs', { screen: category.route })}
          >
            <MaterialIcons name={category.icon} size={32} color="white" />
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </TouchableOpacity>        ))}
      </View>
      <Text style={[styles.attribution, { color: colors.secondaryText }]}>An app proudly made by Mr Faivre</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },  header: {
    padding: 24,
    // backgroundColor injected dynamically
  },
  headerSpacer: {
    height: 24,
  },
  headerTitle: {    fontSize: 36,
    fontWeight: 'bold',
    // color: 'white', // Removed static color
  },
  subtitle: {
    fontSize: 16,
    // color: 'white', // Removed static color
    marginTop: 8,
  },  categoriesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  categoriesContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attribution: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },  categoryCard: {
    padding: 24,
    paddingBottom: 32,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardDesktop: {
    width: '48%', // roughly two cards per row with spacing
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
    opacity: 0.9,
  },
});