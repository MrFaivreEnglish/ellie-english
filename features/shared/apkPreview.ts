import { Platform } from 'react-native';

const truthyValues = new Set(['1', 'true', 'yes', 'on']);

const readWebPreviewParam = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  const searches = [
    window.location.search,
    window.location.hash.includes('?')
      ? window.location.hash.slice(window.location.hash.indexOf('?'))
      : '',
  ].filter(Boolean);

  for (const search of searches) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const value = params.get('apkPreview') ?? params.get('androidPreview');

    if (value != null) return value.trim().toLowerCase();
  }

  return null;
};

export const isApkLayoutPreviewEnabled = () => {
  const value = readWebPreviewParam();
  return value != null && (value === '' || truthyValues.has(value));
};

export const getApkPreviewStatusBarInset = () => 24;

export const getApkPreviewContentMaxWidth = (windowWidth: number) => (
  isApkLayoutPreviewEnabled() && windowWidth > 640 ? 430 : undefined
);
