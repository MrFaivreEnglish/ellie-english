// Shared desktop-web layout tokens for Grammar and Vocabulary exercise screens
// (Quiz/Fill/Reorder/Translate, Cards/Match/Write). Composes the existing design
// primitives (uiRadii/getSoftShadow) rather than inventing new ones, so every
// exercise's "answer panel" shares one radius/shadow/width recipe instead of each
// screen picking its own numbers.
import { uiRadii, getSoftShadow } from './uiPrimitives';

// Prompt/answer column width (Fill, Reorder, Translate, Quiz options, lesson text).
export const EXERCISE_CONTENT_MAX_WIDTH = 760;

// Narrower tray for flowing word/chip banks (Reorder/Translate word banks) — a
// chip tray reads better narrower than a full text column.
export const WORD_TRAY_MAX_WIDTH = 640;

// Quiz's options are single words/short phrases, not prose — the 760 prose width left
// each option pill mostly empty space next to a few characters of text.
export const QUIZ_OPTIONS_MAX_WIDTH = 560;

// The panel that hosts the interactive controls for an exercise (Fill's input+
// button card, Reorder/Translate's build area, Write's answer card).
export const EXERCISE_PANEL_RADIUS = uiRadii.exerciseCard; // 20
export const getExercisePanelShadow = getSoftShadow;

// Pre-scale px; multiply by webLessonScale at the call site.
export const PROMPT_ANSWER_GAP_DESKTOP = 16;

// Mobile-web + native/APK counterparts of the desktop tokens above. Both share one
// value — the two platforms differ by how much *room* is available (measured
// viewport height/width, already handled by getWebLessonScale), not by a separate
// design language, so there's one number here, not two.
// Pre-scale px; multiply by the caller's mobile webLessonScale at the call site.
export const EXERCISE_MOBILE_HORIZONTAL_PADDING = 18;
export const EXERCISE_MOBILE_BOTTOM_SAFE_GAP = 16;

// Replaces Reorder's 0.9 and Translate's 0.8. Those factors predated the fix that actually
// threads this scale into the chips/Check button (see getChipPreset/getCheckButtonMetrics) —
// before that fix the chips silently ignored the dampening and rendered at full scale, so a
// real 0.85 here reads noticeably smaller than what either screen looked like before. Left at
// 1 (no dampening) to match Quiz/Fill, which don't dampen their controls either.
export const CHIP_DESKTOP_SCALE_ADJUSTMENT = 1;
