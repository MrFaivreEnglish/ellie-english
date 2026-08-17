export const HOME_MENU_CARD_COLORS = {
  grammar: '#4EA7F5',
  vocabulary: '#35C8B5',
  lessons: '#A996EA',
  settings: '#8FA4B8',
} as const;

export const HOME_MENU_CARD_GRADIENT_ENDS = {
  grammar: '#1D6EC9',
  vocabulary: '#1A9585',
  lessons: '#7055CC',
  settings: '#627A92',
} as const;

export const SHINY_HOME_MENU_CARD_GRADIENT_ENDS = {
  grammar: '#C4312B',
  vocabulary: '#C98A1A',
  lessons: '#249A50',
  settings: '#1D6EC9',
} as const;

export const DEFAULT_SPLASH_BACKGROUND = '#1F7AD1';
export const SHINY_SPLASH_BACKGROUND = '#F4B942';

export const SHINY_HOME_MENU_CARD_COLORS = {
  grammar: '#F46F68',
  vocabulary: '#F2BF5C',
  lessons: '#52C978',
  settings: '#4EA7F5',
} as const;

export const TODAY_CARD_COLORS = {
  normal: {
    solid: '#D64938',
    shadow: '#B32517',
    text: '#FFFFFF',
    mutedText: 'rgba(255,255,255,0.85)',
    subtleText: 'rgba(255,255,255,0.75)',
    faintText: 'rgba(255,255,255,0.7)',
    surface: 'rgba(255,255,255,0.14)',
    strongSurface: 'rgba(255,255,255,0.18)',
    ringTrack: 'rgba(255,255,255,0.25)',
    decoration: 'rgba(255,255,255,0.08)',
  },
  shiny: {
    solid: '#A56A00',
    shadow: '#7A4B00',
    text: '#FFFFFF',
    mutedText: 'rgba(255,255,255,0.85)',
    subtleText: 'rgba(255,255,255,0.75)',
    faintText: 'rgba(255,255,255,0.7)',
    surface: 'rgba(255,255,255,0.14)',
    strongSurface: 'rgba(255,255,255,0.18)',
    ringTrack: 'rgba(255,255,255,0.25)',
    decoration: 'rgba(255,255,255,0.08)',
  },
} as const;

export const HOME_MENU_ROUTE_COLORS = {
  Grammar: HOME_MENU_CARD_COLORS.grammar,
  Vocabulary: HOME_MENU_CARD_COLORS.vocabulary,
  Lessons: HOME_MENU_CARD_COLORS.lessons,
  Settings: HOME_MENU_CARD_COLORS.settings,
} as const;

export const SHINY_HOME_MENU_ROUTE_COLORS = {
  Grammar: SHINY_HOME_MENU_CARD_COLORS.grammar,
  Vocabulary: SHINY_HOME_MENU_CARD_COLORS.vocabulary,
  Lessons: SHINY_HOME_MENU_CARD_COLORS.lessons,
  Settings: SHINY_HOME_MENU_CARD_COLORS.settings,
} as const;

export const SHINY_TAB_IDENTITY_SOFT_COLORS = {
  Grammar: 'rgba(244,111,104,0.3)',
  Vocabulary: 'rgba(242,191,92,0.3)',
  Lessons: 'rgba(95,203,131,0.3)',
  Settings: 'rgba(104,184,244,0.3)',
} as const;

export const SHINY_TAB_IDENTITY_BORDER_COLORS = {
  Grammar: 'rgba(244,111,104,0.54)',
  Vocabulary: 'rgba(242,191,92,0.54)',
  Lessons: 'rgba(95,203,131,0.54)',
  Settings: 'rgba(104,184,244,0.54)',
} as const;

export const HOME_MENU_TEXT_COLOR = '#FFFFFF';
export const SHINY_HOME_MENU_TEXT_COLOR = '#FFFFFF';
