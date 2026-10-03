import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { getLessonImage, getLessonThumbnailSource } from './vocabularyUtils';
import { Word } from '../../types/VocabularyTypes';
import type { VocabGroup } from '../../types/lessonTypes';

export type MixedVocabularyImageCard = {
  id: string;
  title?: string;
  imageUrl: string;
};

const IMAGE_STAGE_INSETS = {
  desktop: { horizontal: 4, top: 2, bottom: 2 },
  mobile: { horizontal: 14, top: 22, bottom: 30 },
} as const;





export function useVocabularyLessonContent(
  lesson: any,
  lessonIdentity: string,
  isDesktopWebLesson: boolean,
  closeCategoryPicker: () => void
) {
  const allWords = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray((lesson.flashcards[0] as any)?.words)
      ? lesson.flashcards.flatMap((c: any) => c.words)
      : lesson.flashcards;
  }, [lesson?.flashcards]);

  const categories = useMemo<string[]>(() => {
    if (!lesson?.flashcards) return [];


    if (Array.isArray((lesson.flashcards[0] as any)?.words)) {
      return lesson.flashcards
        .map((c: any) => c.category)
        .filter(Boolean);
    }


    return [];
  }, [lesson?.flashcards]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const previousLessonIdentityRef = useRef(lessonIdentity);
  const allowMultiCategorySelection = !!lesson?.allowMultiCategorySelection;
  const categoryPickerLabel =
    typeof lesson?.categoryPickerLabel === 'string' ? lesson.categoryPickerLabel : 'Category';
  const categoryPickerAllLabel =
    typeof lesson?.categoryPickerAllLabel === 'string' ? lesson.categoryPickerAllLabel : 'All';

  useEffect(() => {
    if (previousLessonIdentityRef.current === lessonIdentity) return;

    previousLessonIdentityRef.current = lessonIdentity;
    setSelectedCategories([]);
    closeCategoryPicker();
  }, [lessonIdentity]);

  const selectedCategoryGroup = useMemo(() => {
    if (!Array.isArray((lesson?.flashcards?.[0] as any)?.words)) return null;
    if (selectedCategories.length !== 1) return null;

    return (lesson.flashcards.find((group: any) => group.category === selectedCategories[0]) as VocabGroup) ?? null;
  }, [lesson?.flashcards, selectedCategories]);
  const selectedCategoryImage = selectedCategoryGroup?.imageUrl ?? selectedCategoryGroup?.image;
  const mixedLessonImageCards = useMemo<MixedVocabularyImageCard[]>(() => {
    if (!lesson?.isVocabularyMix) return [];

    if (Array.isArray(lesson.sourceLessonImageCards)) {
      return lesson.sourceLessonImageCards
        .filter((imageCard: { id?: string | number; title?: string; imageUrl?: string } | null | undefined): imageCard is { id?: string | number; title?: string; imageUrl: string } =>
          typeof imageCard?.imageUrl === 'string' && imageCard.imageUrl.trim().length > 0
        )
        .map((imageCard: { id?: string | number; title?: string; imageUrl: string }, index: number) => ({
          id: String(imageCard.id ?? imageCard.imageUrl ?? index),
          title: imageCard.title,
          imageUrl: imageCard.imageUrl.trim(),
        }));
    }

    if (Array.isArray(lesson.sourceLessonImages)) {
      return lesson.sourceLessonImages
        .filter((imageUrl: unknown): imageUrl is string => typeof imageUrl === 'string' && imageUrl.trim().length > 0)
        .map((imageUrl: string, index: number) => ({
          id: `${imageUrl}-${index}`,
          title: undefined,
          imageUrl: imageUrl.trim(),
        }));
    }

    return [];
  }, [lesson?.isVocabularyMix, lesson?.sourceLessonImageCards, lesson?.sourceLessonImages]);
  const shouldShowMixedImageCarousel = !selectedCategoryImage && mixedLessonImageCards.length > 1;



  useEffect(() => {
    if (!shouldShowMixedImageCarousel) return;

    let cancelled = false;
    mixedLessonImageCards.forEach((imageCard) => {
      if (cancelled) return;
      // Into expo-image's disk cache, which is where ImageWithCredit reads sheets from.
      ExpoImage.prefetch(imageCard.imageUrl, 'disk').catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [mixedLessonImageCards, shouldShowMixedImageCarousel]);


  const localImageSource = useMemo(() => getLessonThumbnailSource(lesson), [lesson]);

  const preferredImageSource = useMemo(() => {
    if (selectedCategoryImage) {
      return typeof selectedCategoryImage === 'string' ? { uri: selectedCategoryImage } : selectedCategoryImage;
    }

    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      return typeof raw === 'string' ? { uri: raw } : raw;
    }

    const local = getLessonThumbnailSource(lesson);
    if (local) return local;

    const mapped = getLessonImage(lesson.title);
    return { uri: mapped };
  }, [lesson?.imageUrl, lesson?.image, lesson?.title, selectedCategoryImage]);


  const preferredImageUri = useMemo(() => {
    if (selectedCategoryImage) {
      if (typeof selectedCategoryImage === 'string') return selectedCategoryImage;

      try {
        // @ts-ignore
        const resolved = Image.resolveAssetSource(selectedCategoryImage);
        if (resolved?.uri) return resolved.uri;
      } catch {}
    }

    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      if (typeof raw === 'string') return raw;

      try {
        // @ts-ignore
        const resolved = Image.resolveAssetSource(raw);
        if (resolved?.uri) return resolved.uri;
      } catch {}
    }

    if (localImageSource) {
      try {
        // @ts-ignore
        const resolved = Image.resolveAssetSource(localImageSource);
        if (resolved?.uri) return resolved.uri;
      } catch {}
    }

    return getLessonImage(lesson.title);
  }, [lesson?.imageUrl, lesson?.image, lesson?.title, localImageSource, selectedCategoryImage]);




  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const imageStageInsets = isDesktopWebLesson ? IMAGE_STAGE_INSETS.desktop : IMAGE_STAGE_INSETS.mobile;
  const imageStageContentSize = useMemo(() => ({
    width: Math.max(0, stageSize.width - imageStageInsets.horizontal * 2),
    height: Math.max(0, stageSize.height - imageStageInsets.top - imageStageInsets.bottom - (isDesktopWebLesson ? 3 : 7)),
  }), [imageStageInsets, isDesktopWebLesson, stageSize.height, stageSize.width]);

  useEffect(() => {
    setImageAspectRatio(null);
  }, [preferredImageUri]);

  const handleImageNaturalSize = useCallback((size: { width: number; height: number }) => {
    if (size.width > 0 && size.height > 0) setImageAspectRatio(size.width / size.height);
  }, []);

  const fittedImageSize = useMemo(() => {
    const { width: stageWidth, height: stageHeightPx } = imageStageContentSize;
    if (stageWidth <= 0 || stageHeightPx <= 0) return { width: undefined as number | undefined, height: undefined as number | undefined };
    if (!imageAspectRatio) return { width: stageWidth, height: stageHeightPx };

    const width = Math.min(stageWidth, stageHeightPx * imageAspectRatio);
    return { width, height: width / imageAspectRatio };
  }, [imageAspectRatio, imageStageContentSize]);


  const filteredWords = useMemo(() => {
    if (!categories.length) return allWords;
    if (!selectedCategories?.length) return allWords;

    const chosen = lesson.flashcards
      .filter((c: any) => selectedCategories.includes(c.category))
      .flatMap((c: any) => c.words);

    return chosen.length ? chosen : allWords;
  }, [lesson?.flashcards, allWords, categories.length, selectedCategories]);

  const activeCategoryKey = useMemo(() => {
    if (!categories.length) return `${lessonIdentity}::All`;
    if (!selectedCategories?.length) return `${lessonIdentity}::All`;
    const selectedCategoryKey = categories
      .filter((category) => selectedCategories.includes(category))
      .join('+');
    return `${lessonIdentity}::${selectedCategoryKey || 'All'}`;
  }, [categories, categories.length, lessonIdentity, selectedCategories]);

  const flashcardProgressLessonKey = useMemo(
    () => lessonIdentity,
    [lessonIdentity]
  );

  const activeCategoryLabel = useMemo(() => {
    if (!selectedCategories.length) return categoryPickerAllLabel;
    if (allowMultiCategorySelection && selectedCategories.length > 1) {
      return `${selectedCategories.length} selected`;
    }
    return selectedCategories[0];
  }, [allowMultiCategorySelection, categoryPickerAllLabel, selectedCategories]);

  return {
    allWords,
    categories,
    selectedCategories,
    setSelectedCategories,
    allowMultiCategorySelection,
    categoryPickerLabel,
    categoryPickerAllLabel,
    mixedLessonImageCards,
    shouldShowMixedImageCarousel,
    preferredImageSource,
    preferredImageUri,
    stageSize,
    setStageSize,
    imageStageInsets,
    imageStageContentSize,
    handleImageNaturalSize,
    fittedImageSize,
    filteredWords: filteredWords as Word[],
    activeCategoryKey,
    activeCategoryLabel,
    flashcardProgressLessonKey,
  };
}
