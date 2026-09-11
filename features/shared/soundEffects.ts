import { preload, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import type { AudioPlayerOptions } from 'expo-audio';

export const SUCCESS_SOUND = require('../../assets/success.mp3');
export const BIG_SUCCESS_SOUND = require('../../assets/bigsuccess.mp3');
export const BEST_SUCCESS_SOUND = require('../../assets/bestsuccess.mp3');

/**
 * No `downloadFirst` here, deliberately. It is meant for remote URLs, and on a bundled
 * require() asset it is what made the first sound of a lesson arrive late: it hands the
 * player a null source at construction, then downloads the asset to a tmp copy and swaps
 * it in from an effect. Until that lands the player has nothing loaded, so an early first
 * answer had to wait for the whole load. It also defeated the preload below, which is
 * keyed by the asset URI and so never matched the tmp copy.
 *
 * Resolving the source synchronously instead means the player starts loading at mount and
 * can claim the preloaded instance.
 */
export const SOUND_EFFECT_OPTIONS: AudioPlayerOptions = {
  keepAudioSessionActive: true,
  updateInterval: 1000,
  preferredForwardBufferDuration: 0,
};

const settle = (maybePromise: unknown) => {
  if (maybePromise && typeof (maybePromise as Promise<unknown>).catch === 'function') {
    (maybePromise as Promise<unknown>).catch(() => {});
  }
};

/**
 * Native keeps one preloaded, already-buffered player per source URI, and a newly
 * constructed player claims it — which also removes it. So this has to be called again
 * after players are built (see the screens that mount sound players), otherwise only the
 * very first player of the app run is warm and every lesson after that loads from cold.
 * Re-preloading an already-cached source is a native no-op.
 */
export const preloadSoundEffects = () => {
  [SUCCESS_SOUND, BIG_SUCCESS_SOUND, BEST_SUCCESS_SOUND].forEach((source) => {
    try {
      settle(preload(source, { preferredForwardBufferDuration: 1 }));
    } catch {}
  });
};

let soundEffectsPrimed = false;

/**
 * Until the audio session has been configured and activated, the first play() of the app
 * has to do that work itself — which is a native round trip the user hears as the sound
 * arriving late. Doing it at startup means the first correct answer is as fast as the rest.
 *
 * mixWithOthers keeps these short effects from stealing audio focus (and so from pausing
 * whatever the student already had playing) every time one fires.
 */
export const primeSoundEffects = () => {
  if (soundEffectsPrimed) return;
  soundEffectsPrimed = true;

  try {
    settle(
      setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
      })
    );
    settle(setIsAudioActiveAsync(true));
  } catch {}

  preloadSoundEffects();
};

primeSoundEffects();

let soundEffectsEnabled = true;

export const setSoundEffectsEnabled = (enabled: boolean) => {
  soundEffectsEnabled = enabled;
};

type SoundEffectPlayer = {
  currentTime?: number;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
  seekTo: (seconds: number, toleranceMillisBefore?: number, toleranceMillisAfter?: number) => Promise<void>;
  play: () => void;
  pause?: () => void;
};

const WARM_UP_MS = 120;
const warmUpTimers = new WeakMap<SoundEffectPlayer, ReturnType<typeof setTimeout>>();

const settleWarmUp = (player: SoundEffectPlayer, rewind: boolean) => {
  warmUpTimers.delete(player);
  try {
    player.pause?.();
    player.muted = false;
    player.volume = 1;
    if (rewind) void player.seekTo(0, 50, 50).catch(() => {});
  } catch {}
};

/**
 * Having the clip loaded is not the same as being ready to make a noise: the first real
 * play still pays to decode and to spin up the output route, which is what is left of the
 * lag on the first sound of a lesson. Playing it once silently at mount moves that cost to
 * a moment nobody is listening for.
 *
 * The player is left rewound and unmuted afterwards, so the first audible play is the fast
 * path (already parked at 0, no seek to await).
 */
export const warmUpSoundEffect = (player: SoundEffectPlayer | null | undefined) => {
  if (!player || warmUpTimers.has(player)) return;

  try {
    player.muted = true;
    player.volume = 0;
    player.play();
    warmUpTimers.set(
      player,
      setTimeout(() => settleWarmUp(player, true), WARM_UP_MS)
    );
  } catch {
    settleWarmUp(player, false);
  }
};

/**
 * An answer landing inside the warm-up window would otherwise play muted. Cutting the
 * warm-up short here costs that one play an awaited rewind, which is still audible and
 * correct — only not instant.
 */
const cancelWarmUp = (player: SoundEffectPlayer) => {
  const timer = warmUpTimers.get(player);
  if (timer === undefined) return;
  clearTimeout(timer);
  settleWarmUp(player, false);
};

/**
 * For sounds that retrigger rapidly (a correct answer, a matched pair).
 *
 * replaySoundEffect below has to await a rewind before replaying, which means every play
 * after the first one starts late. This alternates between voices instead: after playing
 * one, the voice that will be used next is rewound straight away, so by the time it's
 * needed it is already parked at 0 and can start immediately.
 *
 * The rewind is skipped while that voice is still audible (two triggers in quick
 * succession), since seeking mid-playback would jump the sound. In that case the next
 * play just falls back to the awaited rewind — correct, only not instant.
 */
export const replayPooledSoundEffect = (
  players: Array<SoundEffectPlayer | null | undefined>,
  cursor: { current: number }
) => {
  if (!soundEffectsEnabled) return;

  const voices = players.filter((player): player is SoundEffectPlayer => !!player);
  if (voices.length === 0) return;

  const player = voices[cursor.current % voices.length];
  cursor.current = (cursor.current + 1) % voices.length;

  cancelWarmUp(player);

  try {
    if ((player.currentTime ?? 0) > 0.02) {
      void player.seekTo(0, 50, 50).then(() => player.play()).catch(() => {});
    } else {
      player.play();
    }

    const next = voices[cursor.current % voices.length];
    if (next !== player && !next.playing && (next.currentTime ?? 0) > 0.02) {
      void next.seekTo(0, 50, 50).catch(() => {});
    }
  } catch {}
};

/**
 * For a sound that must never be heard twice, however far apart its triggers are.
 *
 * replaySoundEffect below branches on `currentTime` to decide whether a rewind is needed,
 * and rewinds by seeking a player it has not stopped. Two things make that unsafe for a
 * one-shot: SOUND_EFFECT_OPTIONS sets updateInterval to 1000ms, so `currentTime` can be a
 * second out of date, and seeking a player that has not settled can start it playing on its
 * own — after which the awaited play() starts it a second time and the clip is heard twice.
 *
 * Stopping first removes both hazards: there is nothing for the seek to resume, and the restart
 * no longer depends on a stale reading. The cost is an awaited rewind every time, which only
 * matters for sounds that retrigger faster than the clip lasts — those should use
 * replayPooledSoundEffect instead.
 */
export const restartSoundEffect = (player: SoundEffectPlayer | null | undefined) => {
  if (!soundEffectsEnabled || !player) return;

  cancelWarmUp(player);

  try {
    player.pause?.();
    void player
      .seekTo(0, 50, 50)
      .then(() => player.play())
      .catch(() => {});
  } catch {}
};

export const replaySoundEffect = (player: SoundEffectPlayer) => {
  if (!soundEffectsEnabled) return;

  cancelWarmUp(player);

  try {
    if ((player.currentTime ?? 0) > 0.02) {
      // Firing play() while the seek is still in flight let a rapid retrigger (e.g.
      // quick correct answers back to back) briefly play from the old position before
      // snapping to 0 — awaiting it first makes every replay start cleanly and instantly.
      void player.seekTo(0, 50, 50).then(() => player.play()).catch(() => {});
      return;
    }

    player.play();
  } catch {}
};
