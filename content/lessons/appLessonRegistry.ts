import { grammarLessons } from './grammarRegistry';
import type {
  ChapterAppLinkDefinition,
  MaterialIconName,
  ResolvedChapterAppLink,
} from './lessonTypes';
import { vocabularyLessons } from './vocabularyRegistry';
import type { GrammarLesson, VocabularyLesson } from '../../types/lessonTypes';

const normalizeTitle = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const defaultIconByTarget: Record<ChapterAppLinkDefinition['target'], MaterialIconName> = {
  vocabulary: 'style',
  grammar: 'edit',
  pronunciation: 'record-voice-over',
};

export const resolveChapterAppLink = (
  appLink: ChapterAppLinkDefinition,
  options: { vocabularyLessons?: VocabularyLesson[]; grammarLessons?: GrammarLesson[] } = {}
): ResolvedChapterAppLink | null => {
  const wantedTitle = normalizeTitle(appLink.lessonTitle);

  if (appLink.target === 'vocabulary') {
    const pool = [...(options.vocabularyLessons ?? []), ...vocabularyLessons];
    const wantedId = appLink.lessonId?.trim();
    const lesson = (wantedId
      ? pool.find((item) => String(item.id ?? '') === wantedId)
      : null) ?? pool.find((item) => normalizeTitle(item.title) === wantedTitle);
    if (!lesson) return null;

    return {
      label: appLink.label,
      icon: appLink.icon ?? defaultIconByTarget.vocabulary,
      target: appLink.target,
      lesson,
    };
  }

  if (appLink.target === 'grammar') {
    const pool = [...(options.grammarLessons ?? []), ...grammarLessons];
    const wantedId = appLink.lessonId?.trim();
    const lesson = (wantedId
      ? pool.find((item) => String(item.id ?? '') === wantedId)
      : null) ?? pool.find((item) => normalizeTitle(item.title) === wantedTitle);
    if (!lesson) return null;

    return {
      label: appLink.label,
      icon: appLink.icon ?? defaultIconByTarget.grammar,
      target: appLink.target,
      lesson,
    };
  }

  return null;
};
