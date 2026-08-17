import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticsAreSupported } from '../shared/haptics';
import { ENABLE_SHINY_ELLIE_COLOR_MODE } from '../../lib/featureFlags';
import {
  DEFAULT_ACCOUNT_AVATAR_COLOR_ID,
  DEFAULT_ACCOUNT_AVATAR_ID,
  isAccountAvatarColorId,
  isAccountAvatarId,
  loadAccountAvatarColorId,
  loadAccountAvatarId,
  saveAccountAvatarColorId,
  saveAccountAvatarId,
  type AccountAvatarColorId,
  type AccountAvatarId,
} from './accountAvatarStorage';
import {
  getSignedInAccountIdIfSignedIn,
  syncProgressItemToCloudIfSignedIn,
  type CloudProgressItem,
} from './accountStorage';

export const THEME_STORAGE_KEY = '@app_theme';
export const GRAMMAR_GAME_MODE_KEY = '@grammar_game_mode';
export const GRAMMAR_SPEECH_ENABLED_KEY = '@grammar_speech_enabled';
export const VOCAB_TIMER_MODE_KEY = '@vocab_timer_mode';
export const VOCAB_TIMER_RECORD_SAVING_KEY = '@vocab_timer_record_saving';
export const VOCAB_AUDIO_MATCH_MODE_KEY = '@vocab_audio_match_mode';
export const VOCAB_LESSON_CARD_VIEW_KEY = '@vocab_lesson_card_view';
export const TYPING_STRICT_MODE_KEY = '@typing_strict_mode';
export const HAPTICS_ENABLED_KEY = '@haptics_enabled';
export const SOUND_EFFECTS_ENABLED_KEY = '@sound_effects_enabled';
export const WEB_HAPTICS_RESTORED_KEY = '@web_haptics_restored';
export const TODAY_CARD_ENABLED_KEY = '@today_card_enabled';
export const TODAY_CARD_OPT_IN_KEY = '@today_card_opt_in';
export const ANDROID_STATUS_BAR_ENABLED_KEY = '@android_status_bar_enabled';

const ACCOUNT_PREFERENCES_CLOUD_KEY = 'account_preferences';

export type AccountPreferenceSnapshot = {
  version: 1;
  theme: 'light' | 'dark';
  grammarGameMode: boolean;
  vocabTimerMode: boolean;
  vocabTimerRecordSaving: boolean;
  vocabAudioMatchMode: boolean;
  vocabLessonCardView: 'list' | 'tile';
  typingStrictMode: boolean;
  hapticsEnabled: boolean;
  soundEffectsEnabled: boolean;
  todayCardEnabled: boolean;
  todayCardOptIn: boolean;
  androidStatusBarEnabled: boolean;
  shinyEllieMode: boolean;
  accountAvatarId: AccountAvatarId;
  accountAvatarColorId: AccountAvatarColorId;
  updatedAt: string;
};

const asBoolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : fallback;

const asTheme = (value: unknown): 'light' | 'dark' => value === 'dark' ? 'dark' : 'light';

const asVocabLessonCardView = (value: unknown): 'list' | 'tile' =>
  value === 'tile' ? 'tile' : 'list';

const normalizeSnapshot = (value: unknown): AccountPreferenceSnapshot => {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const rawAvatarId = typeof record.accountAvatarId === 'string' ? record.accountAvatarId : null;
  const rawAvatarColorId = typeof record.accountAvatarColorId === 'string' ? record.accountAvatarColorId : null;

  return {
    version: 1,
    theme: asTheme(record.theme),
    grammarGameMode: asBoolean(record.grammarGameMode),
    vocabTimerMode: asBoolean(record.vocabTimerMode),
    vocabTimerRecordSaving: asBoolean(record.vocabTimerRecordSaving),
    vocabAudioMatchMode: asBoolean(record.vocabAudioMatchMode),
    vocabLessonCardView: asVocabLessonCardView(record.vocabLessonCardView),
    typingStrictMode: asBoolean(record.typingStrictMode),
    hapticsEnabled: hapticsAreSupported && asBoolean(record.hapticsEnabled, hapticsAreSupported),
    soundEffectsEnabled: asBoolean(record.soundEffectsEnabled, true),
    todayCardEnabled: asBoolean(record.todayCardEnabled),
    todayCardOptIn: asBoolean(record.todayCardOptIn),
    androidStatusBarEnabled: asBoolean(record.androidStatusBarEnabled),
    shinyEllieMode: ENABLE_SHINY_ELLIE_COLOR_MODE && asBoolean(record.shinyEllieMode),
    accountAvatarId: isAccountAvatarId(rawAvatarId) ? rawAvatarId : DEFAULT_ACCOUNT_AVATAR_ID,
    accountAvatarColorId: isAccountAvatarColorId(rawAvatarColorId)
      ? rawAvatarColorId
      : DEFAULT_ACCOUNT_AVATAR_COLOR_ID,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
  };
};

export const getLocalAccountPreferenceSnapshot = async (
  accountId?: string | null
): Promise<AccountPreferenceSnapshot> => {
  const [
    savedTheme,
    savedGrammarMode,
    savedVocabMode,
    savedVocabTimerRecordSaving,
    savedVocabAudioMatchMode,
    savedVocabLessonCardView,
    savedTypingStrictMode,
    savedHapticsEnabled,
    savedSoundEffectsEnabled,
    savedTodayCardEnabled,
    savedTodayCardOptIn,
    savedAndroidStatusBarEnabled,
    savedShinyEllieMode,
    accountAvatarId,
    accountAvatarColorId,
  ] = await Promise.all([
    AsyncStorage.getItem(THEME_STORAGE_KEY),
    AsyncStorage.getItem(GRAMMAR_GAME_MODE_KEY),
    AsyncStorage.getItem(VOCAB_TIMER_MODE_KEY),
    AsyncStorage.getItem(VOCAB_TIMER_RECORD_SAVING_KEY),
    AsyncStorage.getItem(VOCAB_AUDIO_MATCH_MODE_KEY),
    AsyncStorage.getItem(VOCAB_LESSON_CARD_VIEW_KEY),
    AsyncStorage.getItem(TYPING_STRICT_MODE_KEY),
    AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
    AsyncStorage.getItem(SOUND_EFFECTS_ENABLED_KEY),
    AsyncStorage.getItem(TODAY_CARD_ENABLED_KEY),
    AsyncStorage.getItem(TODAY_CARD_OPT_IN_KEY),
    AsyncStorage.getItem(ANDROID_STATUS_BAR_ENABLED_KEY),
    AsyncStorage.getItem('@shiny_ellie_mode'),
    loadAccountAvatarId(accountId),
    loadAccountAvatarColorId(accountId),
  ]);

  return {
    version: 1,
    theme: savedTheme === 'dark' ? 'dark' : 'light',
    grammarGameMode: savedGrammarMode === 'true',
    vocabTimerMode: savedVocabMode === 'true',
    vocabTimerRecordSaving: savedVocabTimerRecordSaving === 'true',
    vocabAudioMatchMode: savedVocabAudioMatchMode === 'true',
    vocabLessonCardView: savedVocabLessonCardView === 'tile' ? 'tile' : 'list',
    typingStrictMode: savedTypingStrictMode === 'true',
    hapticsEnabled: hapticsAreSupported && savedHapticsEnabled !== 'false',
    soundEffectsEnabled: savedSoundEffectsEnabled !== 'false',
    todayCardEnabled: savedTodayCardOptIn === 'true' && savedTodayCardEnabled === 'true',
    todayCardOptIn: savedTodayCardOptIn === 'true',
    androidStatusBarEnabled: savedAndroidStatusBarEnabled === 'true',
    shinyEllieMode: ENABLE_SHINY_ELLIE_COLOR_MODE && savedShinyEllieMode === 'true',
    accountAvatarId,
    accountAvatarColorId,
    updatedAt: new Date().toISOString(),
  };
};

export const saveLocalAccountPreferenceSnapshot = async (
  snapshot: AccountPreferenceSnapshot,
  accountId?: string | null
) => {
  await Promise.all([
    AsyncStorage.multiSet([
      [THEME_STORAGE_KEY, snapshot.theme],
      [GRAMMAR_GAME_MODE_KEY, snapshot.grammarGameMode ? 'true' : 'false'],
      [VOCAB_TIMER_MODE_KEY, snapshot.vocabTimerMode ? 'true' : 'false'],
      [VOCAB_TIMER_RECORD_SAVING_KEY, snapshot.vocabTimerRecordSaving ? 'true' : 'false'],
      [VOCAB_AUDIO_MATCH_MODE_KEY, snapshot.vocabAudioMatchMode ? 'true' : 'false'],
      [VOCAB_LESSON_CARD_VIEW_KEY, snapshot.vocabLessonCardView],
      [TYPING_STRICT_MODE_KEY, snapshot.typingStrictMode ? 'true' : 'false'],
      [HAPTICS_ENABLED_KEY, snapshot.hapticsEnabled ? 'true' : 'false'],
      [SOUND_EFFECTS_ENABLED_KEY, snapshot.soundEffectsEnabled ? 'true' : 'false'],
      [TODAY_CARD_OPT_IN_KEY, snapshot.todayCardOptIn ? 'true' : 'false'],
      [TODAY_CARD_ENABLED_KEY, snapshot.todayCardEnabled ? 'true' : 'false'],
      [ANDROID_STATUS_BAR_ENABLED_KEY, snapshot.androidStatusBarEnabled ? 'true' : 'false'],
      ['@shiny_ellie_mode', snapshot.shinyEllieMode ? 'true' : 'false'],
    ]),
    saveAccountAvatarId(accountId, snapshot.accountAvatarId),
    saveAccountAvatarColorId(accountId, snapshot.accountAvatarColorId),
  ]);
};

export const buildAccountPreferencesCloudItem = (
  snapshot: AccountPreferenceSnapshot
): CloudProgressItem => ({
  type: 'achievement',
  itemKey: ACCOUNT_PREFERENCES_CLOUD_KEY,
  value: snapshot,
});

export const getAccountPreferencesCloudItems = async (
  accountId?: string | null
): Promise<CloudProgressItem[]> => {
  const resolvedAccountId = accountId === undefined ? await getSignedInAccountIdIfSignedIn() : accountId;
  return [buildAccountPreferencesCloudItem(await getLocalAccountPreferenceSnapshot(resolvedAccountId))];
};

export const findAccountPreferenceSnapshot = (items: CloudProgressItem[]) => {
  const item = items.find(
    (candidate) => candidate.type === 'achievement' && candidate.itemKey === ACCOUNT_PREFERENCES_CLOUD_KEY
  );

  return item ? normalizeSnapshot(item.value) : null;
};

export const syncAccountPreferencesToCloudIfSignedIn = async () => {
  try {
    const accountId = await getSignedInAccountIdIfSignedIn();
    if (!accountId) return null;

    const snapshot = await getLocalAccountPreferenceSnapshot(accountId);
    await syncProgressItemToCloudIfSignedIn(buildAccountPreferencesCloudItem(snapshot));
    return snapshot;
  } catch {
    return null;
  }
};
