type HomeCategoryCopy = {
  grammarTitle: string;
  grammarDescription: string;
  vocabularyTitle: string;
  vocabularyDescription: string;
  lessonsTitle: string;
  lessonsTitleCompact: string;
  lessonsDescription: string;
  settingsTitle: string;
  settingsDescription: string;
};

type MenuCopy = {
  common: {
    back: string;
    backToHome: string;
    newBadge: string;
    updatedBadge: string;
    backToSettings: string;
    backToGrammar: string;
    backToVocabulary: string;
    backToChapters: string;
    open: string;
    expand: string;
    collapse: string;
  };
  home: HomeCategoryCopy & {
    welcome: string;
    subtitle: string;
    today: string;
    todayLogged: string;
    todayStart: string;
    itemsToday: string;
    learntToday: string;
    dailyGoal: string;
    dailyTargetReached: string;
    noPracticeYet: string;
    practiceItemSingular: string;
    practiceItemPlural: string;
    practiceRemainingSingular: string;
    practiceRemainingPlural: string;
    savedItemSingular: string;
    savedItemPlural: string;
    wordSingular: string;
    wordPlural: string;
    toDailyTarget: string;
  };
  settings: {
    header: string;
    appearance: string;
    home: string;
    vocabulary: string;
    flashcards: string;
    matching: string;
    typing: string;
    grammar: string;
    interaction: string;
    extras: string;
    credits: string;
    darkModeTitle: string;
    darkModeDescription: string;
    androidStatusBarTitle: string;
    androidStatusBarDescription: string;
    languageTitle: string;
    languageDescription: string;
    languageOptions: Record<string, string>;
    todayCardTitle: string;
    todayCardDescription: string;
    vocabularyLayoutTitle: string;
    vocabularyLayoutDescription: string;
    list: string;
    tiles: string;
    timerModeTitle: string;
    timerModeDescription: string;
    saveBestTimesTitle: string;
    saveBestTimesDescription: string;
    cancel: string;
    exactTypingTitle: string;
    exactTypingDescription: string;
    grammarGameModeTitle: string;
    grammarGameModeDescription: string;
    grammarSpeechTitle: string;
    grammarSpeechDescription: string;
    soundEffectsTitle: string;
    soundEffectsDescription: string;
    reduceAnimationsTitle: string;
    reduceAnimationsDescription: string;
    hapticsTitle: string;
    hapticsDescription: string;
    hapticsWebDescription: string;
    shinyEllieTitle: string;
    shinyEllieDescription: string;
    shinyElliePresentationTitle: string;
    shinyElliePresentationDescription: string;
    shinyEllieLookTitle: string;
    shinyEllieLookDescription: string;
    shinyElliePaletteTitle: string;
    shinyElliePaletteDescription: string;
    creditsConcept: string;
    creditsImages: string;
    creditsBuiltWith: string;
    version: string;
    creditsSchool: string;
    adminAccessTitle: string;
    adminAccessDescription: string;
    wrongPin: string;
    pinPlaceholder: string;
    openAdmin: string;
  };
  lessons: {
    header: string;
    chapters: string;
    resources: string;
    showChapters: string;
    showResources: string;
    chapterSingular: string;
    chapterPlural: string;
    linkSingular: string;
    linkPlural: string;
    chapterFallback: string;
    cannotOpenUrl: string;
    openUrlError: string;
    practice: string;
    mixedGrammarPractice: string;
  };
  vocabulary: {
    header: string;
    category: string;
    abc: string;
    showByCategory: string;
    showAlphabetically: string;
    useListLayout: string;
    useTileLayout: string;
    openFilters: string;
    layoutLabel: string;
    chooseLevel: string;
    allLevels: string;
    showAllLevels: string;
    showLevel: string;
    levelLabels: string[];
    searchPlaceholder: string;
    clearSearch: string;
    noLessonTitle: string;
    noLessonText: string;
    noSearchTitle: string;
    noSearchText: string;
    lessonSingular: string;
    lessonPlural: string;
    wordSingular: string;
    wordPlural: string;
    mixedPracticeTitle: string;
    mixedPracticeSubtitle: string;
    selectLessons: string;
    cancelSelection: string;
    selectionCount: string;
    startMixedPractice: string;
    selectedMixTitle: string;
    clearSelection: string;
  };
  grammar: {
    header: string;
    searchPlaceholder: string;
    noLessonTitle: string;
    noLessonText: string;
    noSearchTitle: string;
    noSearchText: string;
    lessonSingular: string;
    lessonPlural: string;
    savedAnswerSingular: string;
    savedAnswerPlural: string;
    mixedPracticeTitle: string;
    mixedPracticeSubtitle: string;
    selectLessons: string;
    cancelSelection: string;
    selectionCount: string;
    startMixedPractice: string;
    selectedMixTitle: string;
    clearSelection: string;
  };
};

const englishCopy: MenuCopy = {
  common: {
    back: 'Back',
    backToHome: 'Home',
    newBadge: 'New',
    updatedBadge: 'Updated',
    backToSettings: 'Back to Settings',
    backToGrammar: 'Back to Grammar',
    backToVocabulary: 'Back to Vocabulary',
    backToChapters: 'Back to Chapters',
    open: 'Open',
    expand: 'Expand',
    collapse: 'Collapse',
  },
  home: {
    welcome: 'Welcome! 😊',
    subtitle: 'Choose a category to start.',
    today: 'Today',
    todayLogged: 'Your saved progress for today.',
    todayStart: 'Answer grammar questions or mark vocabulary words as learnt.',
    itemsToday: 'Grammar practised',
    learntToday: 'Vocabulary words learnt',
    dailyGoal: 'Saved today',
    dailyTargetReached: 'Daily saved-progress goal complete',
    noPracticeYet: 'No saved progress today',
    practiceItemSingular: 'answer',
    practiceItemPlural: 'answers',
    practiceRemainingSingular: 'saved item left',
    practiceRemainingPlural: 'saved items left',
    savedItemSingular: 'saved item',
    savedItemPlural: 'saved items',
    wordSingular: 'word',
    wordPlural: 'words',
    toDailyTarget: 'for today',
    grammarTitle: 'Grammar',
    grammarDescription: 'Sharpen your grammar skills',
    vocabularyTitle: 'Vocabulary',
    vocabularyDescription: 'Build your word bank',
    lessonsTitle: 'Chapters & Links',
    // Narrow layouts use the short form — the full name wraps to two lines on a phone,
    // which knocks the card's icon off-centre.
    lessonsTitleCompact: 'Chapters',
    lessonsDescription: 'Everything from class',
    settingsTitle: 'Settings',
    settingsDescription: 'Make Ellie yours',
  },
  settings: {
    header: 'Settings',
    appearance: 'Look',
    home: 'Home Screen',
    vocabulary: 'Vocabulary',
    flashcards: 'Flashcards',
    matching: 'Matching',
    typing: 'Typing',
    grammar: 'Grammar',
    interaction: 'Sound And Touch',
    extras: 'Extras',
    credits: 'Credits',
    darkModeTitle: 'Dark Mode',
    darkModeDescription: 'Use dark colors. Good at night.',
    androidStatusBarTitle: 'Phone Top Bar',
    androidStatusBarDescription: 'Show time, battery, and notifications.',
    languageTitle: 'Menu Language',
    languageDescription: 'Choose the language for buttons and menus.',
    languageOptions: {
      en: 'English',
    },
    todayCardTitle: 'Today Card',
    todayCardDescription: 'Show what you did today.',
    vocabularyLayoutTitle: 'Vocabulary Default',
    vocabularyLayoutDescription: 'Choose the default view for the Vocabulary list.',
    list: 'List',
    tiles: 'Tiles',
    timerModeTitle: 'Matching Timer Mode',
    timerModeDescription: 'Use a timer in the matching game.',
    saveBestTimesTitle: 'Save Best Times',
    saveBestTimesDescription: 'Save your best matching times here.',
    cancel: 'Cancel',
    exactTypingTitle: 'Typing Hard Mode',
    exactTypingDescription: 'Accents and punctuation required. Hints disabled.',
    grammarGameModeTitle: 'Grammar Game Mode',
    grammarGameModeDescription: 'Use 3 lives in grammar practice.',
    grammarSpeechTitle: 'Read Answers Aloud',
    grammarSpeechDescription: 'Speak correct answers after you submit them.',
    soundEffectsTitle: 'Sounds',
    soundEffectsDescription: 'Play sounds for correct answers and finished lessons.',
    reduceAnimationsTitle: 'Fewer Animations',
    reduceAnimationsDescription: 'Turn off bouncing, shaking, and moving effects.',
    hapticsTitle: 'Vibrations',
    hapticsDescription: 'Use small vibrations when you tap or answer.',
    hapticsWebDescription: 'Use small vibrations if your browser allows it.',
    shinyEllieTitle: 'Shiny Ellie',
    shinyEllieDescription: 'A Shiny Ellie appeared! Mix any presentation, style, and palette.',
    shinyElliePresentationTitle: 'Ellie mode',
    shinyElliePresentationDescription: 'Choose classic or Shiny Home cards and splash.',
    shinyEllieLookTitle: 'Visual style',
    shinyEllieLookDescription: 'Swap the finish without changing the layout.',
    shinyElliePaletteTitle: 'Color variant',
    shinyElliePaletteDescription: 'Choose the cool blue or warm beige palette.',
    creditsConcept: 'Application concept & development: Mr Faivre',
    creditsImages: 'Images: Mr Faivre with icons from Flaticon',
    creditsBuiltWith: 'Built with React Native & Expo',
    version: 'Ellie Version 3.0',
    creditsSchool: 'Mr Faivre - Collège Jean Jacques Rousseau - Voujeaucourt',
    adminAccessTitle: 'Teacher Area',
    adminAccessDescription: 'Enter the teacher PIN to open Lesson Studio.',
    wrongPin: 'Wrong PIN',
    pinPlaceholder: 'PIN',
    openAdmin: 'Open',
  },
  lessons: {
    header: 'Chapters & Links',
    chapters: 'Chapters',
    resources: 'Links',
    showChapters: 'Show chapters',
    showResources: 'Show links',
    chapterSingular: 'chapter',
    chapterPlural: 'chapters',
    linkSingular: 'link',
    linkPlural: 'links',
    chapterFallback: 'Chapter',
    cannotOpenUrl: 'Cannot open this URL',
    openUrlError: 'An error occurred while opening the link',
    practice: 'Practice',
    mixedGrammarPractice: 'Grammar mix',
  },
  vocabulary: {
    header: 'Vocabulary',
    category: 'Category',
    abc: 'ABC',
    showByCategory: 'Show vocabulary by category',
    showAlphabetically: 'Show vocabulary alphabetically',
    useListLayout: 'Use list layout',
    useTileLayout: 'Use tile layout',
    openFilters: 'Filters',
    layoutLabel: 'Layout',
    chooseLevel: 'Choose vocabulary level',
    allLevels: 'All Levels',
    showAllLevels: 'Show all vocabulary levels',
    showLevel: 'Show level',
    levelLabels: ['Beginner', 'Intermediate', 'Advanced'],
    searchPlaceholder: 'Search lessons...',
    clearSearch: 'Clear vocabulary search',
    noLessonTitle: 'No lesson found',
    noLessonText: 'Try another word or choose a different level.',
    noSearchTitle: 'No lessons found',
    noSearchText: 'Try another word, category, or level.',
    lessonSingular: 'lesson',
    lessonPlural: 'lessons',
    wordSingular: 'word',
    wordPlural: 'words',
    mixedPracticeTitle: 'Vocabulary mix',
    mixedPracticeSubtitle: '{count} lessons together',
    selectLessons: 'Select lessons',
    cancelSelection: 'Cancel',
    selectionCount: '{count} selected',
    startMixedPractice: 'Start mix',
    selectedMixTitle: 'Selected lessons',
    clearSelection: 'Clear selection',
  },
  grammar: {
    header: 'Grammar',
    searchPlaceholder: 'Search lessons...',
    noLessonTitle: 'No grammar lessons available',
    noLessonText: 'Check the lesson content and try again.',
    noSearchTitle: 'No lessons found',
    noSearchText: 'Try a different word or topic.',
    lessonSingular: 'lesson',
    lessonPlural: 'lessons',
    savedAnswerSingular: 'answer saved',
    savedAnswerPlural: 'answers saved',
    mixedPracticeTitle: 'Mixed practice',
    mixedPracticeSubtitle: '{count} lessons together',
    selectLessons: 'Select lessons',
    cancelSelection: 'Cancel',
    selectionCount: '{count} selected',
    startMixedPractice: 'Start mix',
    selectedMixTitle: 'Selected lessons',
    clearSelection: 'Clear selection',
  },
};

export const getMenuCopy = () => englishCopy;
