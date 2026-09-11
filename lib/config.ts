import Constants from 'expo-constants';




export type FeatureToggles = {

  showGrammarExerciseCount: boolean;
};

export const featureToggles: FeatureToggles = {

  showGrammarExerciseCount: false,
};

type AppExtraConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const appExtra = (Constants.expoConfig?.extra ?? {}) as AppExtraConfig;

export const supabaseUrl = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  appExtra.supabaseUrl ??
  ''
).trim();

export const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  appExtra.supabaseAnonKey ??
  ''
).trim();
