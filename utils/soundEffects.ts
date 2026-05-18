import { preload } from 'expo-audio';
import type { AudioPlayerOptions } from 'expo-audio';

export const SUCCESS_SOUND = require('../assets/success.mp3');
export const BIG_SUCCESS_SOUND = require('../assets/bigsuccess.mp3');
export const BEST_SUCCESS_SOUND = require('../assets/bestsuccess.mp3');

export const SOUND_EFFECT_OPTIONS: AudioPlayerOptions = {
  downloadFirst: true,
  keepAudioSessionActive: true,
  updateInterval: 1000,
  preferredForwardBufferDuration: 0,
};

[SUCCESS_SOUND, BIG_SUCCESS_SOUND, BEST_SUCCESS_SOUND].forEach((source) => {
  try {
    const maybePromise = preload(source, { preferredForwardBufferDuration: 1 });
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => {});
    }
  } catch {}
});

export const replaySoundEffect = (player: { currentTime?: number; seekTo: (seconds: number, toleranceMillisBefore?: number, toleranceMillisAfter?: number) => Promise<void>; play: () => void }) => {
  try {
    if ((player.currentTime ?? 0) > 0.02) {
      void player.seekTo(0, 50, 50);
    }

    player.play();
  } catch {}
};
