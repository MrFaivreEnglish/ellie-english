import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ellie_first_visit_seen_v1';

export async function checkAndMarkFirstVisit(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(KEY);
    if (seen) return false;
    await AsyncStorage.setItem(KEY, '1');
    return true;
  } catch {
    return false;
  }
}
