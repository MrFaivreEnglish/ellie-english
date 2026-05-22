export type MenuLanguage = 'mix' | 'en' | 'fr';

export const ACTIVE_MENU_LANGUAGE: MenuLanguage = 'en';
export const menuLanguageOptions: MenuLanguage[] = ['en', 'mix', 'fr'];

export const isMenuLanguage = (value: string | null): value is MenuLanguage =>
  value === 'mix' || value === 'en' || value === 'fr';

type HomeCategoryCopy = {
  grammarTitle: string;
  grammarDescription: string;
  vocabularyTitle: string;
  vocabularyDescription: string;
  lessonsTitle: string;
  lessonsDescription: string;
  settingsTitle: string;
  settingsDescription: string;
};

type MenuCopy = {
  common: {
    back: string;
    backToHome: string;
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
    languageOptions: Record<MenuLanguage, string>;
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
    resetBestTimesTitle: string;
    resetBestTimesDescription: string;
    reset: string;
    resetConfirmTitle: string;
    resetConfirmMessage: string;
    cancel: string;
    exactTypingTitle: string;
    exactTypingDescription: string;
    grammarGameModeTitle: string;
    grammarGameModeDescription: string;
    soundEffectsTitle: string;
    soundEffectsDescription: string;
    hapticsTitle: string;
    hapticsDescription: string;
    hapticsWebDescription: string;
    shinyEllieTitle: string;
    shinyEllieDescription: string;
    creditsConcept: string;
    creditsImages: string;
    creditsBuiltWith: string;
    version: string;
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
    copied: string;
    copyFailed: string;
    practice: string;
  };
  vocabulary: {
    header: string;
    category: string;
    abc: string;
    showByCategory: string;
    showAlphabetically: string;
    useListLayout: string;
    useTileLayout: string;
    chooseLevel: string;
    allLevels: string;
    showAllLevels: string;
    showLevel: string;
    searchPlaceholder: string;
    clearSearch: string;
    noLessonTitle: string;
    noLessonText: string;
    lessonSingular: string;
    lessonPlural: string;
    wordSingular: string;
    wordPlural: string;
  };
  grammar: {
    header: string;
    searchPlaceholder: string;
    lessonSingular: string;
    lessonPlural: string;
    savedAnswerSingular: string;
    savedAnswerPlural: string;
  };
};

const copies: Record<MenuLanguage, MenuCopy> = {
  mix: {
    common: {
      back: 'Back',
      backToHome: 'Back to Home',
      backToSettings: 'Back to Settings',
      backToGrammar: 'Back to Grammar',
      backToVocabulary: 'Back to Vocabulary',
      backToChapters: 'Back to Chapters',
      open: 'Open',
      expand: 'Expand',
      collapse: 'Collapse',
    },
    home: {
      welcome: 'Welcome! \uD83D\uDE0A',
      subtitle: 'Choisis une catégorie pour commencer!',
      today: 'Today',
      todayLogged: 'Your saved progress for today.',
      todayStart: 'Answer grammar questions or mark vocabulary words as learnt.',
      itemsToday: 'Grammar answers correct',
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
      grammarDescription: 'Révise tes leçons de grammaire avec des exercices interactifs!',
      vocabularyTitle: 'Vocabulary',
      vocabularyDescription: 'Apprends du vocabulaire par catégories et révise avec des cartes interactives!',
      lessonsTitle: 'Chapters & Resources',
      lessonsDescription: 'Retrouve les Digipad, liens utiles et outils pour le cours!',
      settingsTitle: 'Settings',
      settingsDescription: 'Ajuste les préférences de l’app.',
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
        mix: 'Mix',
        en: 'English',
        fr: 'Français',
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
      resetBestTimesTitle: 'Clear Best Times',
      resetBestTimesDescription: 'Delete your saved matching times.',
      reset: 'Reset',
      resetConfirmTitle: 'Clear Saved Times?',
      resetConfirmMessage: 'This deletes all saved matching times on this device.',
      cancel: 'Cancel',
      exactTypingTitle: 'Typing Hard Mode',
      exactTypingDescription: 'The answer must be exactly correct.',
      grammarGameModeTitle: 'Grammar Game Mode',
      grammarGameModeDescription: 'Use 3 lives in grammar practice.',
      soundEffectsTitle: 'Sounds',
      soundEffectsDescription: 'Play sounds for correct answers and finished lessons.',
      hapticsTitle: 'Vibrations',
      hapticsDescription: 'Use small vibrations when you tap or answer.',
      hapticsWebDescription: 'Use small vibrations if your browser allows it.',
      shinyEllieTitle: 'Shiny Ellie',
      shinyEllieDescription: 'A Shiny Ellie appeared!',
      creditsConcept: 'Application concept & development: Mr Faivre',
      creditsImages: 'Images: Mr Faivre with icons from Flaticon',
      creditsBuiltWith: 'Built with React Native & Expo',
      version: 'Ellie Version 2.2',
      adminAccessTitle: 'Teacher Area',
      adminAccessDescription: 'Enter the teacher PIN to open Lesson Studio.',
      wrongPin: 'Wrong PIN',
      pinPlaceholder: 'PIN',
      openAdmin: 'Open',
    },
    lessons: {
      header: 'Chapters & Resources',
      chapters: 'Chapters',
      resources: 'Resources',
      showChapters: 'Show chapters',
      showResources: 'Show resources',
      chapterSingular: 'chapter',
      chapterPlural: 'chapters',
      linkSingular: 'link',
      linkPlural: 'links',
      chapterFallback: 'Chapter',
      cannotOpenUrl: 'Cannot open this URL',
      openUrlError: 'An error occurred while opening the link',
      copied: 'Link copied to clipboard',
      copyFailed: 'Failed to copy link',
      practice: 'Practice',
    },
    vocabulary: {
      header: 'Vocabulary',
      category: 'Category',
      abc: 'ABC',
      showByCategory: 'Show vocabulary by category',
      showAlphabetically: 'Show vocabulary alphabetically',
      useListLayout: 'Use list layout',
      useTileLayout: 'Use tile layout',
      chooseLevel: 'Choose vocabulary level',
      allLevels: 'All Levels',
      showAllLevels: 'Show all vocabulary levels',
      showLevel: 'Show level',
      searchPlaceholder: 'Search lessons...',
      clearSearch: 'Clear vocabulary search',
      noLessonTitle: 'No lesson found',
      noLessonText: 'Try another word or choose a different level.',
      lessonSingular: 'lesson',
      lessonPlural: 'lessons',
      wordSingular: 'word',
      wordPlural: 'words',
    },
    grammar: {
      header: 'Grammar',
      searchPlaceholder: 'Search lessons...',
      lessonSingular: 'lesson',
      lessonPlural: 'lessons',
      savedAnswerSingular: 'answer saved',
      savedAnswerPlural: 'answers saved',
    },
  },
  en: {
    common: {
      back: 'Back',
      backToHome: 'Back to Home',
      backToSettings: 'Back to Settings',
      backToGrammar: 'Back to Grammar',
      backToVocabulary: 'Back to Vocabulary',
      backToChapters: 'Back to Chapters',
      open: 'Open',
      expand: 'Expand',
      collapse: 'Collapse',
    },
    home: {
      welcome: 'Welcome! \uD83D\uDE0A',
      subtitle: 'Choose a category to start.',
      today: 'Today',
      todayLogged: 'Your saved progress for today.',
      todayStart: 'Answer grammar questions or mark vocabulary words as learnt.',
      itemsToday: 'Grammar answers correct',
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
      grammarDescription: 'Review grammar lessons with interactive exercises.',
      vocabularyTitle: 'Vocabulary',
      vocabularyDescription: 'Learn vocabulary by topic and review with cards.',
      lessonsTitle: 'Chapters & Resources',
      lessonsDescription: 'Find class chapters, useful links, and course tools.',
      settingsTitle: 'Settings',
      settingsDescription: 'Change how the app looks and works.',
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
        mix: 'Mixed',
        en: 'English',
        fr: 'French',
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
      resetBestTimesTitle: 'Clear Best Times',
      resetBestTimesDescription: 'Delete your saved matching times.',
      reset: 'Reset',
      resetConfirmTitle: 'Clear Saved Times?',
      resetConfirmMessage: 'This deletes all saved matching times on this device.',
      cancel: 'Cancel',
      exactTypingTitle: 'Typing Hard Mode',
      exactTypingDescription: 'The answer must be exactly correct.',
      grammarGameModeTitle: 'Grammar Game Mode',
      grammarGameModeDescription: 'Use 3 lives in grammar practice.',
      soundEffectsTitle: 'Sounds',
      soundEffectsDescription: 'Play sounds for correct answers and finished lessons.',
      hapticsTitle: 'Vibrations',
      hapticsDescription: 'Use small vibrations when you tap or answer.',
      hapticsWebDescription: 'Use small vibrations if your browser allows it.',
      shinyEllieTitle: 'Shiny Ellie',
      shinyEllieDescription: 'A Shiny Ellie appeared!',
      creditsConcept: 'Application concept & development: Mr Faivre',
      creditsImages: 'Images: Mr Faivre with icons from Flaticon',
      creditsBuiltWith: 'Built with React Native & Expo',
      version: 'Ellie Version 2.2',
      adminAccessTitle: 'Teacher Area',
      adminAccessDescription: 'Enter the teacher PIN to open Lesson Studio.',
      wrongPin: 'Wrong PIN',
      pinPlaceholder: 'PIN',
      openAdmin: 'Open',
    },
    lessons: {
      header: 'Chapters & Resources',
      chapters: 'Chapters',
      resources: 'Resources',
      showChapters: 'Show chapters',
      showResources: 'Show resources',
      chapterSingular: 'chapter',
      chapterPlural: 'chapters',
      linkSingular: 'link',
      linkPlural: 'links',
      chapterFallback: 'Chapter',
      cannotOpenUrl: 'Cannot open this URL',
      openUrlError: 'An error occurred while opening the link',
      copied: 'Link copied to clipboard',
      copyFailed: 'Failed to copy link',
      practice: 'Practice',
    },
    vocabulary: {
      header: 'Vocabulary',
      category: 'Category',
      abc: 'ABC',
      showByCategory: 'Show vocabulary by category',
      showAlphabetically: 'Show vocabulary alphabetically',
      useListLayout: 'Use list layout',
      useTileLayout: 'Use tile layout',
      chooseLevel: 'Choose vocabulary level',
      allLevels: 'All Levels',
      showAllLevels: 'Show all vocabulary levels',
      showLevel: 'Show level',
      searchPlaceholder: 'Search lessons...',
      clearSearch: 'Clear vocabulary search',
      noLessonTitle: 'No lesson found',
      noLessonText: 'Try another word or choose a different level.',
      lessonSingular: 'lesson',
      lessonPlural: 'lessons',
      wordSingular: 'word',
      wordPlural: 'words',
    },
    grammar: {
      header: 'Grammar',
      searchPlaceholder: 'Search lessons...',
      lessonSingular: 'lesson',
      lessonPlural: 'lessons',
      savedAnswerSingular: 'answer saved',
      savedAnswerPlural: 'answers saved',
    },
  },
  fr: {
    common: {
      back: 'Retour',
      backToHome: 'Retour à l’accueil',
      backToSettings: 'Retour aux paramètres',
      backToGrammar: 'Retour à la grammaire',
      backToVocabulary: 'Retour au vocabulaire',
      backToChapters: 'Retour aux chapitres',
      open: 'Ouvrir',
      expand: 'Ouvrir',
      collapse: 'Fermer',
    },
    home: {
      welcome: 'Bienvenue ! \uD83D\uDE0A',
      subtitle: 'Choisis une categorie pour commencer.',
      today: 'Aujourd’hui',
      todayLogged: 'Ta progression sauvegardée aujourd’hui.',
      todayStart: 'Réponds à des questions de grammaire ou marque des mots comme appris.',
      itemsToday: 'Réponses de grammaire correctes',
      learntToday: 'Mots de vocabulaire appris',
      dailyGoal: 'Sauvegardé aujourd’hui',
      dailyTargetReached: 'Objectif de progression atteint',
      noPracticeYet: 'Aucune progression sauvegardée aujourd’hui',
      practiceItemSingular: 'réponse',
      practiceItemPlural: 'réponses',
      practiceRemainingSingular: 'élément sauvegardé restant',
      practiceRemainingPlural: 'éléments sauvegardés restants',
      savedItemSingular: 'élément sauvegardé',
      savedItemPlural: 'éléments sauvegardés',
      wordSingular: 'mot',
      wordPlural: 'mots',
      toDailyTarget: 'aujourd’hui',
      grammarTitle: 'Grammaire',
      grammarDescription: 'Révise tes leçons de grammaire avec des exercices interactifs.',
      vocabularyTitle: 'Vocabulaire',
      vocabularyDescription: 'Apprends le vocabulaire par theme et revise avec des cartes.',
      lessonsTitle: 'Chapitres et ressources',
      lessonsDescription: 'Retrouve les chapitres, les liens utiles et les outils du cours.',
      settingsTitle: 'Parametres',
      settingsDescription: 'Change l’affichage et les options de l’app.',
    },
    settings: {
      header: 'Paramètres',
      appearance: 'Affichage',
      home: 'Accueil',
      vocabulary: 'Vocabulaire',
      flashcards: 'Cartes',
      matching: 'Association',
      typing: 'Écriture',
      grammar: 'Grammaire',
      interaction: 'Interaction',
      extras: 'Extras',
      credits: 'Crédits',
      darkModeTitle: 'Mode sombre',
      darkModeDescription: 'Rends l’app plus agréable à lire dans le noir.',
      androidStatusBarTitle: 'Barre Android',
      androidStatusBarDescription: 'Affiche l heure, la batterie et les notifications.',
      languageTitle: 'Langue des menus',
      languageDescription: 'Choisis la langue utilisée dans les menus.',
      languageOptions: {
        mix: 'Mixte',
        en: 'Anglais',
        fr: 'Français',
      },
      todayCardTitle: 'Carte du jour',
      todayCardDescription: 'Affiche les réponses de grammaire et les mots de vocabulaire sauvegardés aujourd’hui.',
      vocabularyLayoutTitle: 'Affichage du vocabulaire',
      vocabularyLayoutDescription: 'Choisis comment les leçons de vocabulaire sont affichées.',
      list: 'Liste',
      tiles: 'Tuiles',
      timerModeTitle: 'Association chronometree',
      timerModeDescription: 'Option pour travailler le vocabulaire avec un chrono.',
      saveBestTimesTitle: 'Sauvegarder les records',
      saveBestTimesDescription: 'Garde tes meilleurs temps sur cet appareil.',
      resetBestTimesTitle: 'Réinitialiser les records',
      resetBestTimesDescription: 'Efface tes temps sauvegardés en vocabulaire.',
      reset: 'Effacer',
      resetConfirmTitle: 'Effacer les meilleurs temps ?',
      resetConfirmMessage: 'Cela efface tous les records de vocabulaire sur cet appareil.',
      cancel: 'Annuler',
      exactTypingTitle: 'Écriture exacte',
      exactTypingDescription: 'Vérifie exactement l’orthographe, les accents et la ponctuation.',
      grammarGameModeTitle: 'Mode jeu en grammaire',
      grammarGameModeDescription: 'Travaille la grammaire avec 3 vies.',
      soundEffectsTitle: 'Sons',
      soundEffectsDescription: 'Joue de petits sons pour les bonnes reponses et les fins d exercice.',
      hapticsTitle: 'Vibrations',
      hapticsDescription: 'Utilise de petites vibrations pour les taps et les reponses.',
      hapticsWebDescription: 'Utilise de petites vibrations quand le navigateur le permet.',
      shinyEllieTitle: 'Shiny Ellie',
      shinyEllieDescription: 'Une Ellie shiny apparaît!',
      creditsConcept: 'Concept et développement : Mr Faivre',
      creditsImages: 'Images : Mr Faivre avec des icônes de Flaticon',
      creditsBuiltWith: 'Créé avec React Native et Expo',
      version: 'Ellie Version 2.2',
      adminAccessTitle: 'Accès admin',
      adminAccessDescription: 'Entre le code admin pour ouvrir Lesson Studio.',
      wrongPin: 'Code incorrect',
      pinPlaceholder: 'Code',
      openAdmin: 'Ouvrir',
    },
    lessons: {
      header: 'Chapitres et ressources',
      chapters: 'Chapitres',
      resources: 'Ressources',
      showChapters: 'Afficher les chapitres',
      showResources: 'Afficher les ressources',
      chapterSingular: 'chapitre',
      chapterPlural: 'chapitres',
      linkSingular: 'lien',
      linkPlural: 'liens',
      chapterFallback: 'Chapitre',
      cannotOpenUrl: 'Impossible d’ouvrir ce lien',
      openUrlError: 'Une erreur est survenue en ouvrant le lien',
      copied: 'Lien copié',
      copyFailed: 'Impossible de copier le lien',
      practice: 'Travailler',
    },
    vocabulary: {
      header: 'Vocabulaire',
      category: 'Catégories',
      abc: 'ABC',
      showByCategory: 'Afficher le vocabulaire par catégorie',
      showAlphabetically: 'Afficher le vocabulaire par ordre alphabétique',
      useListLayout: 'Utiliser l’affichage en liste',
      useTileLayout: 'Utiliser l’affichage en tuiles',
      chooseLevel: 'Choisir le niveau de vocabulaire',
      allLevels: 'Tous les niveaux',
      showAllLevels: 'Afficher tous les niveaux',
      showLevel: 'Afficher le niveau',
      searchPlaceholder: 'Chercher une lecon...',
      clearSearch: 'Effacer la recherche',
      noLessonTitle: 'Aucune leçon trouvée',
      noLessonText: 'Essaie un autre mot ou un autre niveau.',
      lessonSingular: 'leçon',
      lessonPlural: 'leçons',
      wordSingular: 'mot',
      wordPlural: 'mots',
    },
    grammar: {
      header: 'Grammaire',
      searchPlaceholder: 'Chercher une leçon...',
      lessonSingular: 'leçon',
      lessonPlural: 'leçons',
      savedAnswerSingular: 'réponse sauvegardée',
      savedAnswerPlural: 'réponses sauvegardées',
    },
  },
};

export const getMenuCopy = (language: MenuLanguage = ACTIVE_MENU_LANGUAGE) => copies[language] ?? copies[ACTIVE_MENU_LANGUAGE];
