import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncProgressItemToCloudIfSignedIn, type CloudProgressItem } from './accountStorage';

export const SHINY_ELLIE_UNLOCKED_KEY = '@shiny_ellie_unlocked';
export const SHINY_ELLIE_MODE_KEY = '@shiny_ellie_mode';
const SHINY_ELLIE_CLOUD_KEY = 'shiny_ellie';

export type ShinyEllieProgress = {
  unlocked: boolean;
  mode: boolean;
};

const buildCloudItem = (progress: ShinyEllieProgress): CloudProgressItem => ({
  type: 'achievement',
  itemKey: SHINY_ELLIE_CLOUD_KEY,
  value: {
    unlocked: progress.unlocked,
    mode: progress.mode,
  },
});

export const getShinyEllieProgress = async (): Promise<ShinyEllieProgress> => {
  try {
    const [savedUnlocked, savedMode] = await Promise.all([
      AsyncStorage.getItem(SHINY_ELLIE_UNLOCKED_KEY),
      AsyncStorage.getItem(SHINY_ELLIE_MODE_KEY),
    ]);

    return {
      unlocked: savedUnlocked === 'true',
      mode: savedMode === 'true',
    };
  } catch {
    return {
      unlocked: false,
      mode: false,
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
  ]);

  if (syncCloud && progress.unlocked) {
    void syncProgressItemToCloudIfSignedIn(buildCloudItem(progress));
  }
};

export const clearShinyEllieProgress = async () => {
  await saveShinyEllieProgress({ unlocked: false, mode: false }, { syncCloud: false });
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
      return { unlocked: false, mode: false };
    }

    return getShinyEllieProgress();
  }

  const progress = {
    unlocked: shinyItem.value?.unlocked !== false,
    mode: shinyItem.value?.mode === true,
  };

  await saveShinyEllieProgress(progress, { syncCloud: false });
  return progress;
};
