import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncProgressItemToCloudIfSignedIn, type CloudProgressItem } from '../account/accountStorage';

export const SHINY_ELLIE_UNLOCKED_KEY = '@shiny_ellie_unlocked';
export const SHINY_ELLIE_MODE_KEY = '@shiny_ellie_mode';
export const SHINY_ELLIE_COLOR_VARIANT_KEY = '@shiny_ellie_color_variant';
export const SHINY_ELLIE_PRESENTATION_MODE_KEY = '@shiny_ellie_presentation_mode';
const SHINY_ELLIE_CLOUD_KEY = 'shiny_ellie';

export type ShinyEllieColorVariant = 'cool' | 'warm';

export type ShinyEllieProgress = {
  unlocked: boolean;


  mode: boolean;
  colorVariant: ShinyEllieColorVariant;

  presentationMode: boolean;
};

const buildCloudItem = (progress: ShinyEllieProgress): CloudProgressItem => ({
  type: 'achievement',
  itemKey: SHINY_ELLIE_CLOUD_KEY,
  value: {
    unlocked: progress.unlocked,
    mode: progress.mode,
    colorVariant: progress.colorVariant,
    presentationMode: progress.presentationMode,
  },
});

export const getShinyEllieProgress = async (): Promise<ShinyEllieProgress> => {
  try {
    const [savedUnlocked, savedMode, savedColorVariant, savedPresentationMode] = await Promise.all([
      AsyncStorage.getItem(SHINY_ELLIE_UNLOCKED_KEY),
      AsyncStorage.getItem(SHINY_ELLIE_MODE_KEY),
      AsyncStorage.getItem(SHINY_ELLIE_COLOR_VARIANT_KEY),
      AsyncStorage.getItem(SHINY_ELLIE_PRESENTATION_MODE_KEY),
    ]);

    const unlocked = savedUnlocked === 'true';
    return {
      unlocked,


      mode: unlocked && (savedMode === null || savedMode === 'true'),
      colorVariant: unlocked && savedColorVariant !== 'cool' ? 'warm' : 'cool',
      presentationMode: unlocked && (savedPresentationMode === null || savedPresentationMode === 'true'),
    };
  } catch {
    return {
      unlocked: false,
      mode: false,
      colorVariant: 'cool',
      presentationMode: false,
    };
  }
};

export const saveShinyEllieProgress = async (
  progress: ShinyEllieProgress,
  options: { syncCloud?: boolean } = {}
) => {
  const syncCloud = options.syncCloud ?? true;

  await Promise.all([
    AsyncStorage.setItem(SHINY_ELLIE_UNLOCKED_KEY, progress.unlocked ? 'true' : 'false'),
    AsyncStorage.setItem(SHINY_ELLIE_MODE_KEY, progress.mode ? 'true' : 'false'),
    AsyncStorage.setItem(SHINY_ELLIE_COLOR_VARIANT_KEY, progress.colorVariant),
    AsyncStorage.setItem(SHINY_ELLIE_PRESENTATION_MODE_KEY, progress.presentationMode ? 'true' : 'false'),
  ]);

  if (syncCloud && progress.unlocked) {
    void syncProgressItemToCloudIfSignedIn(buildCloudItem(progress));
  }
};

export const clearShinyEllieProgress = async () => {
  await saveShinyEllieProgress(
    { unlocked: false, mode: false, colorVariant: 'cool', presentationMode: false },
    { syncCloud: false }
  );
};

export const getShinyEllieCloudItems = async (): Promise<CloudProgressItem[]> => {
  const progress = await getShinyEllieProgress();

  return progress.unlocked ? [buildCloudItem(progress)] : [];
};

export const mergeShinyEllieCloudItems = async (
  items: CloudProgressItem[],
  options: { resetIfMissing?: boolean } = {}
): Promise<ShinyEllieProgress> => {
  const shinyItem = items.find((item) => item.type === 'achievement' && item.itemKey === SHINY_ELLIE_CLOUD_KEY);

  if (!shinyItem) {
    if (options.resetIfMissing) {
      await clearShinyEllieProgress();
      return { unlocked: false, mode: false, colorVariant: 'cool', presentationMode: false };
    }

    return getShinyEllieProgress();
  }

  // A cloud row is not proof that the Easter egg was found. Only the natural
  // splash discovery writes this explicit flag, so incomplete/legacy rows
  // must remain locked.
  const unlocked = shinyItem.value?.unlocked === true;
  const progress = {
    unlocked,
    mode: unlocked && (typeof shinyItem.value?.mode === 'boolean' ? shinyItem.value.mode : true),
    colorVariant: unlocked && shinyItem.value?.colorVariant !== 'cool' ? 'warm' as const : 'cool' as const,
    presentationMode: unlocked
      && (typeof shinyItem.value?.presentationMode === 'boolean' ? shinyItem.value.presentationMode : true),
  };

  await saveShinyEllieProgress(progress, { syncCloud: false });
  return progress;
};
