import React, { useCallback, useEffect, useState } from 'react';
import GrammarCategoryList from './GrammarCategoryList';
import GrammarQuiz from './GrammarQuiz';
import { useTheme } from '../settings/ThemeContext';
import { getMenuCopy } from '../shared/menuCopy';

type SelectedLessonBack = {
  label: string;
  target?: string | null;
};

const GrammarScreen: React.FC<any> = ({ route, navigation }) => {
  const { menuLanguage } = useTheme();
  const commonCopy = getMenuCopy(menuLanguage).common;
  const defaultLessonBack: SelectedLessonBack = {
    label: commonCopy.backToGrammar,
    target: null,
  };
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [selectedLessonBack, setSelectedLessonBack] = useState<SelectedLessonBack>(defaultLessonBack);

  const openVocabularyPracticeLesson = useCallback((lesson: any, back: SelectedLessonBack) => {
    navigation.navigate('Vocabulary', {
      screen: 'VocabularyLesson',
      params: {
        lesson,
        backLabel: back.label,
        backTarget: back.target ?? 'Grammar',
      },
    });
  }, [navigation]);

  useEffect(() => {
    if (!route?.params?.lesson) return;

    const nextBack = {
      label: route.params.backLabel ?? defaultLessonBack.label,
      target: route.params.backTarget ?? null,
    };

    if (route.params.lesson?.practiceType === 'vocabulary') {
      setSelectedLesson(null);
      setSelectedLessonBack(nextBack);
      openVocabularyPracticeLesson(route.params.lesson, nextBack);
      return;
    }

    setSelectedLesson(route.params.lesson);
    setSelectedLessonBack(nextBack);
  }, [route?.params?.lesson, route?.params?.openKey, route?.params?.backLabel, route?.params?.backTarget, defaultLessonBack.label, openVocabularyPracticeLesson]);

  const handleSelectLesson = (lesson: any) => {
    if (lesson?.practiceType === 'vocabulary') {
      openVocabularyPracticeLesson(lesson, {
        label: commonCopy.backToGrammar,
        target: 'Grammar',
      });
      return;
    }

    setSelectedLessonBack(defaultLessonBack);
    setSelectedLesson(lesson);
  };

  const handleQuizBack = () => {
    const backTarget = selectedLessonBack.target;

    setSelectedLesson(null);

    if (backTarget) {
      navigation.navigate(backTarget);
    }
  };

  return selectedLesson ? (
    <GrammarQuiz
      lesson={selectedLesson}
      onBack={handleQuizBack}
      backLabel={selectedLessonBack.label}
    />
  ) : (
    <GrammarCategoryList onSelectLesson={handleSelectLesson} />
  );
};

export default GrammarScreen;
