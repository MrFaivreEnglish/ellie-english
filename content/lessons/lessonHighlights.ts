// "New" / "Updated" badges shown on lessons across the app. The data lives in
// lessonHighlights.json, which `npm run ota` fills in automatically by comparing
// the lessons against lessonSnapshot.json (the state at the previous update).
// You can also edit the JSON by hand: { "<section>": { "<lesson id>": { kind, since } } }.
// A badge clears for a student once they open the lesson, and for everyone
// LESSON_HIGHLIGHT_DAYS after `since`.
import highlightData from './lessonHighlights.json';

export type LessonHighlightKind = 'new' | 'updated';
export type LessonHighlightSection = 'vocabulary' | 'grammar';

export type LessonHighlight = {
  kind: LessonHighlightKind;
  since: string; // YYYY-MM-DD
};

export const LESSON_HIGHLIGHT_DAYS = 30;

export const lessonHighlights = highlightData as Partial<
  Record<LessonHighlightSection, Record<string, LessonHighlight>>
>;
