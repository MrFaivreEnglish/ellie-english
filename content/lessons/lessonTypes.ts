import type React from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type AppLessonTarget = 'vocabulary' | 'grammar' | 'pronunciation';
export type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export type ChapterAppLinkDefinition = {
  label: string;
  target: AppLessonTarget;
  lessonTitle: string;
  icon?: MaterialIconName;
};

export type ResolvedChapterAppLink = {
  label: string;
  icon: MaterialIconName;
  target: AppLessonTarget;
  lesson: any;
  categoryColor?: string;
};

export type ChapterLesson = {
  title: string;
  url: string;
  appLinks?: ChapterAppLinkDefinition[];
};

export type ChapterCategory = {
  title: string;
  icon: string;
  color: string;
  lessons: ChapterLesson[];
};

export type ResourceLink = {
  title: string;
  description: string;
  url: string;
};

export type ResourceCategory = {
  title: string;
  icon: string;
  color: string;
  resources: ResourceLink[];
};
