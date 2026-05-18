// Centralized application configuration and feature flags
// Adjust these toggles to enable/disable features without exposing UI switches

export type FeatureToggles = {
  // Controls whether the Grammar list shows the number of exercises per lesson
  showGrammarExerciseCount: boolean;
};

export const featureToggles: FeatureToggles = {
  // Hidden toggle: when false, the exercise count text in Grammar will be hidden
  showGrammarExerciseCount: false,
};

export const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
export const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
