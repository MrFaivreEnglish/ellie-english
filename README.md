# Ellie — Class Revision Companion

Ellie is a mobile-first revision app for language learners working with a teacher. Students use Ellie alongside their class; the teacher controls which vocabulary sets and grammar lessons appear in the app by editing two TypeScript registry files.

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- [Expo Go](https://expo.dev/go) on your phone (for quick preview), or Xcode / Android Studio for a full build

### Install

```bash
git clone <repo-url>
cd ellie-english
npm install
```

### Run on device / simulator

```bash
# Start the dev server — scan the QR code with Expo Go
npm start

# Or open directly in a simulator
npm run ios       # requires Xcode on macOS
npm run android   # requires Android Studio
npm run web       # opens in browser
```

### Type-check

```bash
npm run typecheck
```

### Tests

```bash
npm test
```

Runs Jest smoke tests for Home, Account, Vocabulary lesson, and Grammar quiz screens. Uses `jest-expo` and `@testing-library/react-native`.

---

## Release

### Web (GitHub Pages)

```bash
npm run deploy
```

Exports the Expo web build, rewrites generated asset paths so the app works from GitHub Pages subpaths, and pushes `dist/` to the `gh-pages` branch via [`gh-pages`](https://github.com/tschaub/gh-pages).

If you need an absolute base path instead of relative paths, set it before exporting:

```powershell
$env:EXPO_WEB_BASE_PATH = "/ellie"
npm run predeploy
```

### Android / iOS (EAS Build)

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Build: `eas build --platform android` (or `ios`)
4. Download the `.apk` / `.ipa` from the EAS dashboard and share with students.

> Local APK preview (no EAS account needed): run `npm run android` with Android Studio open.

Android release builds no longer use the debug keystore. For a local release build, provide signing values as Gradle properties or environment variables:

```powershell
$env:ANDROID_KEYSTORE_PATH = "C:\path\to\upload-keystore.jks"
$env:ANDROID_KEYSTORE_PASSWORD = "..."
$env:ANDROID_KEY_ALIAS = "..."
$env:ANDROID_KEY_PASSWORD = "..."
$env:ANDROID_VERSION_CODE = "2"
$env:ANDROID_VERSION_NAME = "2.2.0"
```

---

## Teacher workflow

Ellie's content lives in two registry files — no CMS, no backend, just TypeScript arrays. Edit a file, push, and students see the change on next app load.

### Adding a vocabulary lesson

Edit `content/lessons/vocabularyRegistry.ts` and add an entry:

```ts
{
  id: 'cafe-vocab',
  title: 'At the café',
  imageUrl: 'https://example.com/cafe.jpg',   // optional
  flashcards: [
    { english: 'a coffee',    french: 'un café' },
    { english: 'a croissant', french: 'un croissant' },
  ],
}
```

### Adding a grammar lesson

Edit `content/lessons/grammarRegistry.ts` and add an entry:

```ts
{
  id: 'articles-definite',
  title: 'Definite articles',
  imageUrl: 'https://example.com/grammar.jpg', // optional
  exercises: [
    {
      type: 'choice',
      question: '___ chat est sur la table.',
      answer: 'Le',
      options: ['Le', 'La', 'Les', 'Un'],
    },
    {
      type: 'fill',
      question: '___ maison est grande.',
      answer: 'La',
    },
    {
      type: 'reorder',
      question: 'Put the words in order',
      words: ['chat', 'le', 'table', 'sur', 'la', 'est'],
      answer: 'le chat est sur la table',
    },
    {
      type: 'translate',
      question: 'The dog is in the garden.',
      answer: 'Le chien est dans le jardin',
      distractors: ['un chien', 'dans la maison'],
    },
  ],
}
```

**Exercise types:**

| Type | `question` | `answer` | Extra fields |
|------|-----------|--------|-------------|
| `choice` | Sentence with blank | correct option | `options: string[]` |
| `fill` | Sentence with `___` | word that fills the blank | — |
| `reorder` | Instruction text | correct word order (space-separated) | `words: string[]` |
| `translate` | English sentence | French answer | `distractors?: string[]` |

### Removing a lesson

Delete or comment out its entry in the relevant registry file. Students lose access on next reload.

### Mixed / review lessons

Set `isMixedGrammarLesson: true` and populate `sourceLessonProgressKeys` with the IDs of source lessons. Ellie combines their exercises into a single review deck.

---

## Optional accounts

Supabase account setup is documented in [docs/supabase-accounts.md](docs/supabase-accounts.md).

---

## Project structure (key files)

```
content/
  lessons/
    grammarRegistry.ts       ← add grammar lessons here
    vocabularyRegistry.ts    ← add vocabulary lessons here
features/
  grammar/
    GrammarQuiz.tsx          main quiz screen
    useGrammarQuizLayout.ts  layout hook (extracted)
  vocabulary/
    VocabularyLessonScreen.tsx
  account/
    AccountPanel.tsx
    useAccountStats.ts       XP / streak / progress hook
  home/
    HomeScreen.tsx
  settings/
    ThemeContext.tsx          dark mode + feature flags
__tests__/                   smoke tests
```
