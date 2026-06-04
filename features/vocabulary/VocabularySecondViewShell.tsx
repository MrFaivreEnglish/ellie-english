import React from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

type VocabularySecondViewShellProps = {
  backgroundColor: string;
  headerTopPadding: number;
  headerBottomPadding?: number;
  minHeight: number;
  modeBar: React.ReactNode;
  children: React.ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  onHeaderLayout?: (event: LayoutChangeEvent) => void;
};

export function VocabularySecondViewShell({
  backgroundColor,
  headerTopPadding,
  headerBottomPadding = 14,
  minHeight,
  modeBar,
  children,
  onLayout,
  onHeaderLayout,
}: VocabularySecondViewShellProps) {
  return (
    <View
      style={[styles.screen, { backgroundColor, minHeight }]}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.modeHeader,
          { backgroundColor, paddingTop: headerTopPadding, paddingBottom: headerBottomPadding },
        ]}
        onLayout={onHeaderLayout}
      >
        {modeBar}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
  },
  modeHeader: {
    position: 'relative',
    zIndex: 30,
    elevation: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
});
