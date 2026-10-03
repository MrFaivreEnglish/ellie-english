import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ImageSourcePropType } from 'react-native';
import type { GrammarLesson, VocabularyLesson } from './lessonTypes';



export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Account: { openAvatarPicker?: boolean } | undefined;
  MyWords: undefined;
  FullImageModal: { source?: ImageSourcePropType; uri?: string };
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  AdminLessonPreview: undefined;
};



export type TabParamList = {
  Grammar: { lesson?: GrammarLesson; backLabel?: string; backTarget?: string; openKey?: number } | undefined;
  Vocabulary: NavigatorScreenParams<VocabularyStackParamList> | undefined;
  Lessons: undefined;
  Settings: undefined;
};



export type VocabularyStackParamList = {
  VocabularyList: undefined;
  VocabularyLesson: {
    lesson: VocabularyLesson;
    backLabel?: string;
    backTarget?: string;
    initialMode?: string;
  };
  VocabRush: undefined;
};



declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
