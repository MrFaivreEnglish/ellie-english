import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_CHAPTER_LINK_OVERRIDES_KEY = 'CUSTOM_CHAPTER_LINK_OVERRIDES_V1';

export type ChapterLinkOverride = {
  id: string;
  categoryTitle: string;
  lessonTitle: string;
  displayTitle: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export const makeChapterLinkOverrideId = (categoryTitle: string, lessonTitle: string) =>
  `${categoryTitle.trim()}::${lessonTitle.trim()}`;

export const normalizeChapterLinkOverride = (value: any): ChapterLinkOverride | null => {
  if (!value || typeof value !== 'object') return null;

  const categoryTitle = String(value.categoryTitle ?? '').trim();
  const lessonTitle = String(value.lessonTitle ?? '').trim();
  const displayTitle = String(value.displayTitle ?? value.title ?? lessonTitle).trim();
  const url = String(value.url ?? '').trim();

  if (!categoryTitle || !lessonTitle || !url) return null;

  const now = new Date().toISOString();

  return {
    id: typeof value.id === 'string' && value.id.trim()
      ? value.id.trim()
      : makeChapterLinkOverrideId(categoryTitle, lessonTitle),
    categoryTitle,
    lessonTitle,
    displayTitle: displayTitle || lessonTitle,
    url,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  };
};

export const normalizeChapterLinkOverrides = (values: any): ChapterLinkOverride[] => {
  if (!Array.isArray(values)) return [];

  return values
    .map(normalizeChapterLinkOverride)
    .filter((value): value is ChapterLinkOverride => !!value);
};

const sortOverrides = (overrides: ChapterLinkOverride[]) =>
  [...overrides].sort((a, b) => {
    const categoryCompare = a.categoryTitle.localeCompare(b.categoryTitle, undefined, { sensitivity: 'base' });
    if (categoryCompare !== 0) return categoryCompare;
    return a.lessonTitle.localeCompare(b.lessonTitle, undefined, { sensitivity: 'base' });
  });

const readOverrides = async (): Promise<ChapterLinkOverride[]> => {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_CHAPTER_LINK_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return sortOverrides(normalizeChapterLinkOverrides(parsed));
  } catch {
    return [];
  }
};

const writeOverrides = async (overrides: ChapterLinkOverride[]) => {
  await AsyncStorage.setItem(CUSTOM_CHAPTER_LINK_OVERRIDES_KEY, JSON.stringify(sortOverrides(overrides)));
};

export const getCustomChapterLinkOverrides = async () => readOverrides();

export const saveCustomChapterLinkOverride = async (
  override: Omit<ChapterLinkOverride, 'createdAt' | 'updatedAt'> & { createdAt?: string }
): Promise<ChapterLinkOverride[]> => {
  const existing = await readOverrides();
  const now = new Date().toISOString();
  const nextOverride: ChapterLinkOverride = {
    id: override.id || makeChapterLinkOverrideId(override.categoryTitle, override.lessonTitle),
    categoryTitle: override.categoryTitle.trim(),
    lessonTitle: override.lessonTitle.trim(),
    displayTitle: override.displayTitle.trim() || override.lessonTitle.trim(),
    url: override.url.trim(),
    createdAt: override.createdAt ?? now,
    updatedAt: now,
  };

  const nextOverrides = existing.filter((item) => item.id !== nextOverride.id);
  nextOverrides.push(nextOverride);
  await writeOverrides(nextOverrides);
  return sortOverrides(nextOverrides);
};

export const deleteCustomChapterLinkOverride = async (id: string): Promise<ChapterLinkOverride[]> => {
  const existing = await readOverrides();
  const nextOverrides = existing.filter((override) => override.id !== id);
  await writeOverrides(nextOverrides);
  return nextOverrides;
};
