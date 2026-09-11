import { Alert, Platform } from 'react-native';

export const copyTextToClipboard = async (text: string) => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('Clipboard export is only available on web.');
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textArea);
  }
};

export const pickTextFile = async (): Promise<{ contents: string; name?: string } | null> => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    Alert.alert('Import unavailable', 'File import is only available in the web admin tool.');
    return null;
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.csv,text/plain,text/csv,application/json';
    input.style.display = 'none';

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      cleanup();

      if (!file) {
        resolve(null);
        return;
      }

      try {
        resolve({
          contents: await file.text(),
          name: file.name,
        });
      } catch {
        resolve(null);
      }
    }, { once: true });

    document.body.appendChild(input);
    input.click();
  });
};
