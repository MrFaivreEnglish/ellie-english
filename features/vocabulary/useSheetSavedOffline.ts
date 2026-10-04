import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getLessonSheetImageUris } from './vocabularyUtils';

// True once every hosted sheet of a lesson is in the phone's disk cache, so the lesson's
// pictures open without a connection. Lessons with only bundled pictures need nothing
// saved, so they show no marker either way. Not available on the web.
export function useSheetSavedOffline(lesson: any): boolean {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    let active = true;
    const uris = getLessonSheetImageUris(lesson);
    if (uris.length === 0 || typeof ExpoImage.getCachePathAsync !== 'function') {
      setSaved(false);
      return undefined;
    }

    Promise.all(uris.map((uri) => ExpoImage.getCachePathAsync(uri)))
      .then((paths) => {
        if (active) setSaved(paths.every((path) => !!path));
      })
      .catch(() => {
        if (active) setSaved(false);
      });

    return () => {
      active = false;
    };
  }, [lesson]);

  return saved;
}
