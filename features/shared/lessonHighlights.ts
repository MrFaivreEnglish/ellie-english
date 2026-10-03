import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LESSON_HIGHLIGHT_DAYS,
  lessonHighlights,
  type LessonHighlightKind,
  type LessonHighlightSection,
} from '../../content/lessons/lessonHighlights';

export type { LessonHighlightKind, LessonHighlightSection };

type HighlightableLesson = { id?: string | number; isCustom?: boolean } | null | undefined;

// "section:id" -> date (YYYY-MM-DD) the student opened that lesson while it was highlighted.
type SeenHighlights = Record<string, string>;

const STORAGE_KEY = 'lessonHighlightsSeen:v1';
const DAY_MS = 24 * 60 * 60 * 1000;

let seen: SeenHighlights = {};
let loadStarted = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const ensureLoaded = () => {
  if (loadStarted) return;
  loadStarted = true;
  AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        // Anything marked seen before the load finished wins over the stored copy.
        seen = { ...parsed, ...seen };
        emit();
      }
    })
    .catch(() => {});
};

const subscribe = (listener: () => void) => {
  ensureLoaded();
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

const getSnapshot = () => seen;

const isActive = (since: string, now: number) => {
  const start = Date.parse(since);
  return !Number.isNaN(start) && now - start <= LESSON_HIGHLIGHT_DAYS * DAY_MS;
};

const kindFor = (
  section: LessonHighlightSection,
  id: string,
  seenMap: SeenHighlights,
  now: number
): LessonHighlightKind | undefined => {
  const highlight = lessonHighlights[section]?.[id];
  if (!highlight || !isActive(highlight.since, now)) return undefined;

  // ISO dates compare correctly as strings.
  const seenOn = seenMap[`${section}:${id}`];
  if (seenOn && seenOn >= highlight.since) return undefined;

  return highlight.kind;
};

export const getLessonHighlightKind = (
  section: LessonHighlightSection,
  lesson: HighlightableLesson,
  seenMap: SeenHighlights = seen,
  now = Date.now()
): LessonHighlightKind | undefined => {
  if (!lesson || lesson.isCustom || lesson.id == null) return undefined;
  return kindFor(section, String(lesson.id), seenMap, now);
};

// The badge a whole section (a tab, a home tile) should show: "new" beats "updated".
export const getSectionHighlightKind = (
  section: LessonHighlightSection,
  seenMap: SeenHighlights = seen,
  now = Date.now()
): LessonHighlightKind | undefined => {
  const kinds = Object.keys(lessonHighlights[section] ?? {}).map((id) => kindFor(section, id, seenMap, now));
  return kinds.includes('new') ? 'new' : kinds.includes('updated') ? 'updated' : undefined;
};

export const markLessonHighlightSeen = (section: LessonHighlightSection, lesson: HighlightableLesson) => {
  ensureLoaded();
  if (!getLessonHighlightKind(section, lesson)) return;

  seen = { ...seen, [`${section}:${String(lesson!.id)}`]: new Date().toISOString().slice(0, 10) };
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen)).catch(() => {
    // Not critical: the badge just shows again next launch.
  });
};

// Re-renders the caller whenever a lesson is marked seen anywhere in the app.
export const useSeenLessonHighlights = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
