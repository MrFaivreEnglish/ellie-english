import type { CustomVocabularyLesson } from '../customLessonStorage';

export type EditableWord = {
  english: string;
  french: string;
};

export const emptyWord = (): EditableWord => ({ english: '', french: '' });

export const createEmptyDraft = () => ({
  id: `custom-${Date.now()}`,
  title: '',
  description: '',
  imageUrl: '',
  category: 'Custom',
  flashcards: [emptyWord()],
  createdAt: undefined as string | undefined,
});

export const parseDelimitedLines = (text: string, delimiter: string): EditableWord[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split(delimiter).map((part) => part.trim());
      if (parts.length < 2) return null;

      return {
        english: parts[0] ?? '',
        french: parts[1] ?? '',
      };
    })
    .filter((value): value is EditableWord => !!value)
    .filter((word, index) => {
      if (index !== 0) return true;

      const english = word.english.toLowerCase();
      const french = word.french.toLowerCase();

      return !(
        (english === 'english' || english === 'en') &&
        (french === 'french' || french === 'fr')
      );
    })
    .filter((word) => word.english && word.french);
};

export const parseImportedPairs = (text: string, fileName?: string): EditableWord[] => {
  const trimmed = text.trim();
  const lowerName = fileName?.toLowerCase() ?? '';

  if (!trimmed) return [];

  if (lowerName.endsWith('.json')) {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (Array.isArray(entry) && entry.length >= 2) {
            return {
              english: String(entry[0] ?? '').trim(),
              french: String(entry[1] ?? '').trim(),
            };
          }

          if (entry && typeof entry === 'object') {
            return {
              english: String((entry as any).english ?? (entry as any).en ?? '').trim(),
              french: String((entry as any).french ?? (entry as any).fr ?? '').trim(),
            };
          }

          return null;
        })
        .filter((value): value is EditableWord => !!value)
        .filter((word) => word.english && word.french);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).flashcards)) {
      return (parsed as any).flashcards
        .map((entry: any) => ({
          english: String(entry?.english ?? '').trim(),
          french: String(entry?.french ?? '').trim(),
        }))
        .filter((word: EditableWord) => word.english && word.french);
    }
  }

  if (trimmed.includes('\t')) {
    return parseDelimitedLines(trimmed, '\t');
  }

  if ((trimmed.match(/;/g) || []).length > (trimmed.match(/,/g) || []).length) {
    return parseDelimitedLines(trimmed, ';');
  }

  return parseDelimitedLines(trimmed, ',');
};

export const exportableLesson = (lesson: CustomVocabularyLesson) => ({
  id: lesson.id,
  title: lesson.title,
  description: lesson.description ?? '',
  imageUrl: lesson.imageUrl ?? '',
  category: lesson.category ?? 'Custom',
  flashcards: lesson.flashcards.map((word) => ({
    english: word.english,
    french: word.french,
  })),
});
