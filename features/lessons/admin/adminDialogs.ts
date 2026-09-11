import { Alert, Platform } from 'react-native';

export const confirmDestructive = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
) => {
  // React Native web does not reliably present native Alert dialogs.
  if (Platform.OS === 'web') {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`${title}\n\n${message}`)
      : true;

    if (confirmed) void onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Continue',
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
};





export const notify = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};
