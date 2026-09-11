import React, { useCallback, useMemo } from 'react';
import { Platform, View, StyleSheet, TouchableOpacity } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import type { ThemeColors } from '../settings/ThemeContext';
import { getPanelStyle } from '../shared/uiPrimitives';
import { useSpringPress } from '../shared/useSpringPress';
import type { VocabularyLesson, VocabGroup } from '../../types/lessonTypes';
import type { getMenuCopy } from '../shared/menuCopy';
import { getVocabularySelectionCardHeight } from './vocabularySelectionCardLayout';
import { useDesktopTypographyScale } from '../shared/DesktopTypography';

const STAR = '★';

const getLessonWordCount = (lesson: VocabularyLesson): number => {
  const { flashcards } = lesson;
  if (!flashcards.length) return 0;
  const first = flashcards[0];
  if ('words' in first) {
    return (flashcards as VocabGroup[]).reduce((total, group) => total + group.words.length, 0);
  }
  return flashcards.length;
};

type VocabularyCopy = ReturnType<typeof getMenuCopy>['vocabulary'];

export type VocabularyLessonCardProps = {
  lesson: VocabularyLesson;
  rowIndex: number;
  cardView: 'list' | 'tile';
  compactTile: boolean;
  selectionMode: boolean;
  selected: boolean;
  imageFailed: boolean;
  imageSource: ImageSourcePropType | undefined;
  difficulty: number | undefined;
  categoryEmoji: string;
  colors: ThemeColors;
  isDarkMode: boolean;
  copy: VocabularyCopy;
  onOpenLesson: (lesson: VocabularyLesson) => void;
  onToggleLesson: (lesson: VocabularyLesson) => void;
  onImageError: (key: string) => void;
};

const VocabularyLessonCard = React.memo(({
  lesson,
  rowIndex,
  cardView,
  compactTile,
  selectionMode,
  selected,
  imageFailed,
  imageSource,
  difficulty,
  categoryEmoji,
  colors,
  isDarkMode,
  copy,
  onOpenLesson,
  onToggleLesson,
  onImageError,
}: VocabularyLessonCardProps) => {
  const lessonTitle = useMemo(
    () => (lesson.title || '').replace(/\s*\d+/, ''),
    [lesson.title]
  );
  const lessonImageKey = String(lesson.id || lesson.title || lessonTitle || rowIndex);
  const wordCount = getLessonWordCount(lesson);
  const isTile = cardView === 'tile';
  const isCompactTile = isTile && compactTile;
  const desktopScale = useDesktopTypographyScale();

  const handlePress = useCallback(() => {
    if (selectionMode) {
      onToggleLesson(lesson);
      return;
    }
    onOpenLesson(lesson);
  }, [lesson, onOpenLesson, onToggleLesson, selectionMode]);

  const handleImageError = useCallback(() => {
    onImageError(lessonImageKey);
  }, [lessonImageKey, onImageError]);
  const cardPress = useSpringPress();

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(rowIndex, 10) * 40).duration(300)}
      style={isTile ? [styles.lessonTileWrap, isCompactTile && styles.lessonTileWrapCompact] : undefined}
    >
      <Animated.View style={cardPress.animatedStyle}>
        <TouchableOpacity
          style={[
            styles.lessonCard,
            getPanelStyle(colors, isDarkMode, 'soft'),
            styles.lessonCardNoShadow,
            isTile ? styles.lessonCardTile : styles.lessonCardList,
            isCompactTile && styles.lessonCardTileCompact,
            selectionMode && (isTile ? styles.lessonCardTileSelectionMode : styles.lessonCardSelectionMode),
            selectionMode && {
              height: Math.round(getVocabularySelectionCardHeight(cardView, compactTile, colors.visualStyle) * desktopScale),
            },
            desktopScale > 1 && {
              borderRadius: Math.round(16 * desktopScale),
              marginBottom: Math.round(10 * desktopScale),
              padding: Math.round(10 * desktopScale),
              paddingRight: Math.round((selectionMode && !isTile ? 46 : 10) * desktopScale),
              minHeight: Math.round((isTile ? (isCompactTile ? 136 : 148) : 82) * desktopScale),
              paddingTop: Math.round((selectionMode && isTile ? 20 : isTile ? (isCompactTile ? 8 : 10) : 10) * desktopScale),
              paddingBottom: Math.round((isTile ? (isCompactTile ? 9 : 10) : 10) * desktopScale),
            },
            {
              backgroundColor: selected ? colors.primarySoft : colors.card,
              borderColor: selected ? colors.primary : colors.border,
              borderBottomColor: selected ? colors.primary : colors.border,
              borderBottomWidth: selected ? 3 : 2,
              borderWidth: selected ? 2 : 1.5,
            },
            isTile && { width: '100%' as const },
          ]}
          onPress={handlePress}
          onPressIn={cardPress.onPressIn}
          onPressOut={cardPress.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`Open ${lessonTitle}`}
          accessibilityState={selectionMode ? { selected } : undefined}
        >
      {selectionMode && (
        <View
          style={[
            styles.lessonSelectBadge,
            isTile && styles.lessonSelectBadgeTile,
            desktopScale > 1 && {
              height: Math.round(28 * desktopScale),
              width: Math.round(28 * desktopScale),
              right: Math.round(10 * desktopScale),
              top: Math.round(10 * desktopScale),
            },
            {
              backgroundColor: selected ? colors.buttonBackground : colors.card,
              borderColor: selected ? colors.buttonBackground : colors.borderStrong,
            },
          ]}
        >
          <MaterialIcons
            name={selected ? 'check' : 'add'}
            size={Math.round(15 * desktopScale)}
            color={selected ? colors.buttonText : colors.primary}
          />
        </View>
      )}

      {isTile && !!difficulty && (
        <View
          style={[
            styles.lessonDifficultyBadge,
            styles.lessonDifficultyBadgeTile,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.lessonDifficultyText, { color: colors.primary }]}>{STAR.repeat(difficulty)}</Text>
        </View>
      )}

      <View
        style={[
          styles.lessonImageFrame,
          isTile && styles.lessonImageFrameTile,
          isCompactTile && styles.lessonImageFrameTileCompact,
          desktopScale > 1 && {
            width: Math.round((isTile ? (isCompactTile ? 76 : 90) : 68) * desktopScale),
            height: Math.round((isTile ? (isCompactTile ? 76 : 90) : 68) * desktopScale),
            marginRight: isTile ? 0 : Math.round(9 * desktopScale),
            marginBottom: isTile ? Math.round((isCompactTile ? 9 : 12) * desktopScale) : 0,
            borderRadius: Math.round((isTile ? (isCompactTile ? 9 : 10) : 8) * desktopScale),
          },
          { backgroundColor: 'transparent', borderColor: 'transparent' },
          imageFailed && [styles.lessonImageFallback, { borderColor: colors.border }],
        ]}
      >
        {imageFailed ? (
          <View style={[styles.lessonImagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={styles.lessonImagePlaceholderEmoji}>{categoryEmoji}</Text>
          </View>
        ) : (
          <Image
            source={imageSource}
            style={styles.lessonImage}
            contentFit="cover"



            recyclingKey={lessonImageKey}
            transition={Platform.OS === 'android' ? 0 : 200}
            cachePolicy="memory-disk"
            onError={handleImageError}
            accessibilityIgnoresInvertColors
          />
        )}
      </View>

      <View style={[styles.lessonContent, isTile && styles.lessonContentTile, isCompactTile && styles.lessonContentTileCompact]}>
        <View style={[styles.lessonTopRow, isTile && styles.lessonTopRowTile]}>
          <Text
            style={[styles.lessonTitle, isTile && styles.lessonTitleTile, isCompactTile && styles.lessonTitleTileCompact, { color: colors.text }]}
            numberOfLines={2}
          >
            {lessonTitle}
          </Text>
          {!isTile && !!difficulty && (
            <View
              style={[
                styles.lessonDifficultyBadge,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.lessonDifficultyText, { color: colors.primary }]}>{STAR.repeat(difficulty)}</Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.lessonMetaLine, isTile && styles.lessonMetaLineTile, isCompactTile && styles.lessonMetaLineTileCompact, { color: colors.secondaryText }]}
        >
          {wordCount} {wordCount > 1 ? copy.wordPlural : copy.wordSingular}
        </Text>

        {!isTile && !!lesson.description && (
          <Text style={[styles.lessonDescription, { color: colors.secondaryText }]} numberOfLines={2}>
            {lesson.description}
          </Text>
        )}
      </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

export default VocabularyLessonCard;

const styles = StyleSheet.create({
  lessonCard: {
    borderRadius: 16,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  lessonCardNoShadow: { boxShadow: 'none' as any, elevation: 0 },
  lessonTileWrap: { width: '48%' },
  lessonTileWrapCompact: { width: '46%' },
  lessonCardList: { flexDirection: 'row', alignItems: 'center', minHeight: 82 },
  lessonCardTile: { width: '48%', minHeight: 148, alignItems: 'center', paddingTop: 10, paddingBottom: 10 },
  lessonCardTileCompact: { minHeight: 136, marginBottom: 11, padding: 8, paddingTop: 8, paddingBottom: 9 },
  lessonCardSelectionMode: { paddingRight: 46 },
  lessonCardTileSelectionMode: { paddingTop: 20 },
  lessonImageFrame: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 0,
    elevation: 0,
    marginRight: 9,
    overflow: 'hidden',
  },
  lessonImageFrameTile: { width: 90, height: 90, marginRight: 0, marginBottom: 12, borderRadius: 10 },
  lessonImageFrameTileCompact: { width: 76, height: 76, marginBottom: 9, borderRadius: 9 },
  lessonImage: { width: '100%', height: '100%', borderRadius: 0 },
  lessonImageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  lessonImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  lessonImagePlaceholderEmoji: { fontSize: 28, lineHeight: 34 },
  lessonContent: { flex: 1, justifyContent: 'center', minWidth: 0 },
  lessonContentTile: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  lessonContentTileCompact: { paddingTop: 0 },
  lessonTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lessonTopRowTile: { width: '100%', justifyContent: 'center' },
  lessonTitle: { flex: 1, fontSize: 17, fontWeight: '700', lineHeight: 21, textTransform: 'capitalize' },
  lessonTitleTile: { textAlign: 'center', lineHeight: 19, fontSize: 15 },
  lessonTitleTileCompact: { fontSize: 14, lineHeight: 18 },
  lessonDifficultyBadge: {
    minWidth: 42,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonDifficultyBadgeTile: {
    position: 'absolute',
    top: 10,
    left: 10,
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 4,
    zIndex: 2,
  },
  lessonSelectBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    zIndex: 4,
  },
  lessonSelectBadgeTile: { right: 10, top: 10 },
  lessonDifficultyText: { fontSize: 12, fontWeight: '800' },
  lessonMetaLine: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  lessonMetaLineTile: { textAlign: 'center', marginTop: 6 },
  lessonMetaLineTileCompact: { fontSize: 12, marginTop: 4 },
  lessonDescription: { fontSize: 13, lineHeight: 17, marginTop: 4 },
});
