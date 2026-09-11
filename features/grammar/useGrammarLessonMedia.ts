import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';

import type { GrammarLesson } from '../../types/lessonTypes';

export interface GrammarLessonImageCard {
  id: string;
  title?: string;
  imageUrl: string;
}

interface GrammarLessonMediaOptions {
  lesson: GrammarLesson;
  isDesktopWebLayout: boolean;
  stageSize: { width: number; height: number };
}

/** Owns lesson-image normalization, prefetching, natural size, and fitting. */
export const useGrammarLessonMedia = ({
  lesson,
  isDesktopWebLayout,
  stageSize,
}: GrammarLessonMediaOptions) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const imageUri = lesson.imageUrl;
  const imageSource = useMemo(() => imageUri ? { uri: imageUri } : undefined, [imageUri]);
  const mixedImageCards = useMemo<GrammarLessonImageCard[]>(() => {
    if (!lesson.isMixedGrammarLesson) return [];

    if (Array.isArray(lesson.sourceLessonImageCards)) {
      return lesson.sourceLessonImageCards
        .filter((card): card is { id?: string | number; title?: string; imageUrl: string } => (
          typeof card?.imageUrl === 'string' && card.imageUrl.trim().length > 0
        ))
        .map((card, index) => ({
          id: String(card.id ?? card.imageUrl ?? index),
          title: card.title,
          imageUrl: card.imageUrl,
        }));
    }

    return (lesson.sourceLessonImages ?? [])
      .filter((uri): uri is string => typeof uri === 'string' && uri.trim().length > 0)
      .map((uri, index) => ({ id: `${uri}-${index}`, imageUrl: uri }));
  }, [lesson.isMixedGrammarLesson, lesson.sourceLessonImageCards, lesson.sourceLessonImages]);
  const showMixedImageCarousel = mixedImageCards.length > 1;

  useEffect(() => {
    if (!showMixedImageCarousel) return;
    let cancelled = false;

    mixedImageCards.forEach((card) => {
      if (!cancelled) Image.prefetch(card.imageUrl).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [mixedImageCards, showMixedImageCarousel]);

  useEffect(() => {
    setAspectRatio(null);
  }, [imageUri]);

  const handleNaturalSize = useCallback((size: { width: number; height: number }) => {
    if (size.width > 0 && size.height > 0) setAspectRatio(size.width / size.height);
  }, []);

  const stageInsets = isDesktopWebLayout
    ? { horizontal: 4, top: 2, bottom: 2 }
    : { horizontal: 14, top: 22, bottom: 30 };
  const availableSize = {
    width: Math.max(0, stageSize.width - stageInsets.horizontal * 2),
    height: Math.max(
      0,
      stageSize.height - stageInsets.top - stageInsets.bottom - (isDesktopWebLayout ? 3 : 7),
    ),
  };
  const fittedSize = useMemo(() => {
    if (availableSize.width <= 0 || availableSize.height <= 0) return { width: 0, height: 0 };
    if (!aspectRatio || aspectRatio <= 0) return availableSize;

    const widthAtFullHeight = availableSize.height * aspectRatio;
    if (widthAtFullHeight <= availableSize.width) {
      return { width: widthAtFullHeight, height: availableSize.height };
    }
    return { width: availableSize.width, height: availableSize.width / aspectRatio };
  }, [aspectRatio, availableSize.height, availableSize.width]);

  return {
    imageUri,
    imageSource,
    mixedImageCards,
    showMixedImageCarousel,
    stageInsets,
    availableSize,
    fittedSize,
    handleNaturalSize,
  };
};
