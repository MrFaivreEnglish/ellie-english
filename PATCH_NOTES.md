# Ellie English Patch Notes

Major work catalogued through May 27, 2026. Current app version: 2.2.0.

## Highlights

- Expanded Ellie from a simple practice app into a fuller learning hub for grammar, vocabulary, pronunciation, progress tracking, and account backup.
- Added a more polished first-view lesson layout for both Grammar and Vocabulary, with matching image placement, mode buttons, and second-view practice navigation.
- Added irregular verb lessons as a full grammar-linked practice set, including an all-verbs hub and individual group lessons.
- Reworked XP, level progress, daily activity, and account profile systems.
- Improved Android APK/web behavior, Expo configuration, content validation, and deployment readiness.

## Learning Content

- Added 51 grammar screen entries:
  - 42 standard grammar lessons.
  - 9 irregular verb entries: one all-verbs hub plus 8 individual verb groups.
- Added 55 vocabulary lessons.
- Added irregular verb groups:
  - Irregular Verbs 1: special/unique verbs.
  - Irregular Verbs 2: endings in -D.
  - Irregular Verbs 3: no change.
  - Irregular Verbs 4: GHT.
  - Irregular Verbs 5: past participle in -EN.
  - Irregular Verbs 6: EW / OWN.
  - Irregular Verbs 7: endings in -T.
  - Irregular Verbs 8: i -> a -> u.
- Added the all-irregular-verbs hub with multi-group selection.
- Connected irregular verb lessons from Grammar and Lessons.
- Added irregular verb lesson images and per-group thumbnails.
- Improved lesson registry handling for generated grammar modes, translate exercises, reorder exercises, and vocabulary-style grammar lessons.

## Content Scale

- Grammar playable mode entries: 3,114.
- Unique XP-awardable grammar answers: 3,111.
- Regular vocabulary card instances: 1,239.
- Regular unique vocabulary pairs: 1,131.
- Unique irregular verb cards: 62.
- Total unique vocabulary-style cards including irregular verbs: 1,193.

## Grammar

- Reworked the Grammar lesson screen first view to align with Vocabulary.
- Added clearer mode controls for Quiz, Fill, Reorder, and Translate.
- Improved fill, reorder, and translate exercise layouts.
- Added a second-view sticky navigation row with stable Back, mode, and Image controls.
- Added lesson image access from the practice view.
- Improved feedback card styling and restored consistent corners.
- Improved grammar completion summaries with XP/level progress.
- Added save-last-lesson support for Grammar.
- Reduced heavy image load in grammar category lists by separating irregular verbs and improving thumbnail loading behavior.
- Improved category list scrolling performance, especially around past-tense and irregular verb sections.

## Vocabulary

- Reworked Vocabulary lesson first view to match Grammar.
- Moved category controls to the top of the practice/second view instead of the first view.
- Added multi-category selection support for grouped vocabulary lessons.
- Added a cleaner second-view navigation row with Back, mode controls, and Image.
- Added Save words mode for flashcards, replacing the old Know It label.
- Added flashcard progress storage and review flow support.
- Added irregular verb-specific flashcard labels:
  - Verb.
  - Conjugation.
- Added reverse-direction support for irregular verb lessons.
- Improved flashcard layout, controls, progress, and review actions.
- Improved typing practice reward feedback, strict mode handling, and completion summary.
- Improved matching mode:
  - Restored visible word progress.
  - Added Words, Round, and XP summary.
  - Improved progress bar placement.
  - Improved timer/best-time display.
  - Added matching review word support.
- Improved vocabulary completion modal with XP and level progress.

## Progress, XP, and Levels

- Added shared level-progress presentation, now handled directly by completion and account surfaces.
- Added XP reward tuning for grammar, typing, matching, timer, and review flows.
- Added one-time grammar answer XP tracking.
- Added daily vocabulary typing XP limits.
- Added matching XP activity keys for practice/timer modes.
- Added level progress display in grammar, typing, matching completion, and account surfaces.
- Kept level 100 at 18,600 XP.
- Added post-level-100 treatment:
  - Level 100 displays as `Level 100 - Ellie Master`.
  - Levels continue past 100.
  - Levels after 100 display as Master tiers, such as `Level 110 - Master II`.
  - Added `Level 100+` gold badge styling and master stars.
- Added last-lesson storage so the home screen can offer a Continue action.

## Account, Cloud, and Profiles

- Improved the account panel with local profile display, avatar/color customization, and saved-work summaries.
- Added account profile unlocks tied to level.
- Added cloud backup status UI.
- Added Supabase configuration fallbacks.
- Improved local/account progress handling for grammar answers, learnt words, XP, and best matching times.
- Added clearer sync, backup, and offline account states.
- Added master-level profile styling.

## Home Screen

- Added account avatar pill with level-aware unlocks.
- Added master badge treatment on the account pill after level 100.
- Added daily progress card improvements.
- Added Continue lesson card using last saved Grammar/Vocabulary lesson.
- Improved home card colors and layout consistency.

## Navigation

- Fixed irregular verb lessons opened from Grammar so Back returns to Grammar instead of Vocabulary.
- Fixed bottom tab highlighting so grammar-linked irregular verb lessons keep Grammar active.
- Fixed bottom-tab behavior after leaving borrowed irregular verb lessons.
- Improved second-view navigation in Grammar and Vocabulary with an extra Back control inside the sticky mode row.
- Stabilized mode rows so controls do not jump when Back/Image buttons appear.
- Improved Android bottom navigation appearance so it reads as one strip instead of stacked bars.

## Settings and Install

- Added a discreet Install Ellie area in Settings.
- Added Android and Apple install actions.
- Added compact title-row install entry point.
- Added clearer install guidance for web/iOS shortcut access and Android APK distribution.
- Added platform-appropriate icon treatment for Android and Apple.

## Platform and Build

- Updated project dependencies around Expo 55 / React Native 0.83.
- Added `metro.config.js` extending Expo Metro config to satisfy Expo Doctor.
- Improved Android immersive/navigation bar handling.
- Added app config fallbacks for APK/cloud builds.
- Added GitLab Pages/export pipeline work.
- Added `npm run check` combining TypeScript and content validation.
- Expanded content validation coverage.
- Updated audio feedback assets.

## Pronunciation

- Refined pronunciation screen and pronunciation lesson layout.
- Improved pronunciation navigation and visual consistency with the rest of Ellie.

## Quality and Validation

- Added/kept TypeScript validation with `tsc --noEmit`.
- Added content validation through `scripts/validate-content.js`.
- Current verification command:

```bash
npm run check
```

## Notes

- XP totals are not a strict lifetime cap because vocabulary typing and matching use daily/activity-based XP rules.
- Timer best bonuses are variable and can increase totals beyond baseline content calculations.
- Irregular verbs are stored as vocabulary-style practice lessons but surfaced under Grammar and Lessons.
- Custom/local teacher content is not included in the bundled content counts above.
