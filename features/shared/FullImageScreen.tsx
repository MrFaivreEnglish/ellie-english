import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinchZoomImage from './PinchZoomImage';

export default function FullImageScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { source, uri } = route.params || {};

  const content = (
    <View style={styles.container}>
      {/* Backdrop is handled by PinchZoomImage's container; ensure we respect safe-area for close button */}
      <PinchZoomImage
        source={source}
        uri={uri}
        onClose={() => navigation.goBack()}
        speedPreset="fast"
        doubleTapZoom={2.5}
        maxScale={5}
      />
      {/* small spacer to ensure bottom insets don't hide content on some devices */}
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
