import { useCallback, useEffect, useMemo, useState } from 'react';
import GrammarCategoryList from './GrammarCategoryList';
import GrammarQuiz from './GrammarQuiz';
import { getMenuCopy } from '../shared/menuCopy';
import ErrorBoundary from '../shared/ErrorBoundary';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TabParamList, RootStackParamList } from '../../types/navigationTypes';
import type { GrammarLesson, VocabularyLesson } from '../../types/lessonTypes';
import { getSerializableVocabularyLesson } from '../vocabulary/vocabularyUtils';

type GrammarScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Grammar'>,
  NativeStackScreenProps<RootStackParamList>
>;

type SelectedLessonBack = {
  label: string;
  target?: string | null;
};

const GrammarScreen = ({ route, navigation }: GrammarScreenProps) => {
  const commonCopy = getMenuCopy().common;
  const defaultLessonBack = useMemo<SelectedLessonBack>(() => ({
    label: commonCopy.backToGrammar,
    target: null,
  }), [commonCopy.backToGrammar]);
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);
  const [selectedLessonBack, setSelectedLessonBack] = useState<SelectedLessonBack>(defaultLessonBack);

  const openVocabularyPracticeLesson = useCallback((lesson: VocabularyLesson, back: SelectedLessonBack) => {
    navigation.navigate('Vocabulary', {
      screen: 'VocabularyLesson',
      params: {
        lesson: getSerializableVocabularyLesson(lesson),
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
      openVocabularyPracticeLesson(route.params.lesson as unknown as VocabularyLesson, nextBack);
      return;
    }

    setSelectedLesson(route.params.lesson ?? null);
    setSelectedLessonBack(nextBack);
  }, [route?.params?.lesson, route?.params?.openKey, route?.params?.backLabel, route?.params?.backTarget, defaultLessonBack.label, openVocabularyPracticeLesson]);

  const handleSelectLesson = useCallback((lesson: GrammarLesson) => {
    if (lesson?.practiceType === 'vocabulary') {
      openVocabularyPracticeLesson(lesson as unknown as VocabularyLesson, {
        label: commonCopy.backToGrammar,
        target: 'Grammar',
      });
      return;
    }

    setSelectedLessonBack(defaultLessonBack);
    setSelectedLesson(lesson);
  }, [openVocabularyPracticeLesson, commonCopy.backToGrammar, defaultLessonBack]);

  const handleQuizBack = useCallback(() => {
    const backTarget = selectedLessonBack.target;

    setSelectedLesson(null);

    if (backTarget) {
      navigation.navigate(backTarget as keyof TabParamList);
    }
  }, [selectedLessonBack.target, navigation]);

  return selectedLesson ? (
    <ErrorBoundary onBack={handleQuizBack} onHome={() => navigation.navigate('Home')}>
      <GrammarQuiz
        lesson={selectedLesson}
        onBack={handleQuizBack}
        backLabel={selectedLessonBack.label}
      />
    </ErrorBoundary>
  ) : (
    <GrammarCategoryList onSelectLesson={handleSelectLesson} />
  );
};

export default GrammarScreen;
