import { View, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinchZoomImage from './PinchZoomImage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'FullImageModal'>;

export default function FullImageScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { source, uri } = route.params || {};

  const content = (
    <View style={styles.container}>
      <PinchZoomImage
        source={source}
        uri={uri}
        onClose={() => navigation.goBack()}
        speedPreset="fast"
        doubleTapZoom={2.5}
        maxScale={5}
      />
      <View style={{ height: insets.bottom }} />
    </View>
  );

  if (Platform.OS === 'web') return content;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {content}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
});
