import React from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { triggerSelectionHaptic } from '../shared/haptics';
import { FRESH_COLORS } from '../shared/freshDirection';
import type { VocabularyMode } from './useLessonSheetLayout';

type PickerAnchor = { x: number; y: number; width: number; height: number };

const RAIL_CONTROL_HEIGHT = 40;
const RAIL_CONTROL_HORIZONTAL_PADDING = 14;
const RAIL_CONTROL_FONT_SIZE = 14;

type ThemeColors = {
  text: string;
  secondaryText: string;
  border: string;
  card: string;
  surface: string;
};

type VocabularyCategoryControlsProps = {
  railMode?: boolean;




  railScale?: number;
  mode: VocabularyMode;
  sheetMode: VocabularyMode | null;
  categories: string[];
  selectedCategories: string[];
  activeCategoryLabel: string;
  categoryPickerLabel: string;
  categoryPickerOpen: boolean;
  setCategoryPickerOpen: (open: boolean) => void;
  setCategoryPickerAnchor: (anchor: PickerAnchor) => void;
  categoryPickerButtonRef: React.RefObject<View | null>;
  flashcardProgressModeEnabled: boolean;
  setFlashcardProgressModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  learnedFlashcardKeysLoaded: boolean;
  learnedFlashcardCount: number;
  filteredWordsCount: number;
  isVocabAudioMatchMode: boolean;
  toggleVocabAudioMatchMode: () => void;
  stopTimer: () => void;
  resetGameState: () => void;
  initializeGameSet: () => void;
  isAndroidLesson: boolean;
  isDesktopWebLesson: boolean;
  isDarkMode: boolean;
  colors: ThemeColors;
  isFlashcardShuffled: boolean;
  onShuffleFlashcards: () => void;
  flashcardDirectionLabel: string;
  onToggleFlashcardDirection: () => void;
};

export default function VocabularyCategoryControls({
  railMode = false,
  railScale = 1,
  mode,
  sheetMode,
  categories,
  selectedCategories,
  activeCategoryLabel,
  categoryPickerLabel,
  categoryPickerOpen,
  setCategoryPickerOpen,
  setCategoryPickerAnchor,
  categoryPickerButtonRef,
  flashcardProgressModeEnabled,
  setFlashcardProgressModeEnabled,
  learnedFlashcardKeysLoaded,
  learnedFlashcardCount,
  filteredWordsCount,
  isVocabAudioMatchMode,
  toggleVocabAudioMatchMode,
  stopTimer,
  resetGameState,
  initializeGameSet,
  isAndroidLesson,
  isDesktopWebLesson,
  isDarkMode,
  colors,
  isFlashcardShuffled,
  onShuffleFlashcards,
  flashcardDirectionLabel,
  onToggleFlashcardDirection,
}: VocabularyCategoryControlsProps) {
  const renderCategoryPickerButton = () => {
    if (categories.length === 0) return null;

    return (
      <TouchableOpacity
        ref={categoryPickerButtonRef}
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          Keyboard.dismiss();
          if (categoryPickerOpen) { setCategoryPickerOpen(false); return; }
          categoryPickerButtonRef.current?.measureInWindow((x, y, width, height) => {
            setCategoryPickerAnchor({ x, y, width, height });
            setCategoryPickerOpen(true);
          });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${categoryPickerLabel.toLowerCase()}`}
        accessibilityState={{ expanded: categoryPickerOpen }}
        style={[
          styles.categoryPickerButton,
          isAndroidLesson && styles.categoryPickerButtonAndroid,



          railMode && styles.categoryPickerButtonRail,
          railMode
            ? {
                height: Math.round(RAIL_CONTROL_HEIGHT * railScale),
                minHeight: Math.round(RAIL_CONTROL_HEIGHT * railScale),
                paddingHorizontal: Math.round(RAIL_CONTROL_HORIZONTAL_PADDING * railScale),
              }
            : railScale > 1 && {
                height: Math.round(32 * railScale),
                minHeight: Math.round(32 * railScale),
                paddingHorizontal: Math.round(12 * railScale),
              },
          // Same size as the "Save words" / "Audio Mode" pills on native.
          isAndroidLesson && !railMode && {
            height: 36,
            minHeight: 36,
            paddingHorizontal: 12,
          },
          {
            backgroundColor: isDarkMode ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.categoryPickerText,
            railMode && styles.categoryPickerTextRail,
            { fontSize: Math.round((railMode ? RAIL_CONTROL_FONT_SIZE : isAndroidLesson ? 15 : 13) * railScale) },
            isAndroidLesson && !railMode && { maxWidth: 180 },
            { color: colors.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {/* Nothing selected reads as just "Category" — the ": All" suffix added length
              without meaning, and the button is what you tap to pick one anyway. */}
          {selectedCategories.length ? activeCategoryLabel : categoryPickerLabel}
        </Text>
        <MaterialIcons
          name={categoryPickerOpen ? 'expand-less' : 'expand-more'}
          size={Math.round((isAndroidLesson && !railMode ? 21 : 18) * railScale)}
          color={colors.secondaryText}
        />
      </TouchableOpacity>
    );
  };

  const renderFlashcardProgressButton = () => {
    if (mode !== 'flashcards') return null;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          setFlashcardProgressModeEnabled((current) => !current);
        }}
        accessibilityRole="switch"
        accessibilityLabel={flashcardProgressModeEnabled ? 'Turn off Save Words' : 'Turn on Save Words'}
        accessibilityState={{ checked: flashcardProgressModeEnabled }}
        style={[
          styles.progressModeButton,
          isAndroidLesson && styles.progressModeButtonAndroid,
          railMode && styles.progressModeButtonRail,
          railMode
            ? {
                height: Math.round(RAIL_CONTROL_HEIGHT * railScale),
                minHeight: Math.round(RAIL_CONTROL_HEIGHT * railScale),
                paddingHorizontal: Math.round(RAIL_CONTROL_HORIZONTAL_PADDING * railScale),
                gap: Math.round(6 * railScale),
              }
            : railScale > 1 && {
                height: Math.round(32 * railScale),
                minHeight: Math.round(32 * railScale),
                paddingHorizontal: Math.round(10 * railScale),
                gap: Math.round(4 * railScale),
              },
          // A bit smaller than the first native bump — 40px read as too large next to the
          // shuffle/direction row below it.
          isAndroidLesson && !railMode && {
            height: 36,
            minHeight: 36,
            paddingHorizontal: 12,
            gap: 6,
          },
          {
            backgroundColor: flashcardProgressModeEnabled
              ? (isDarkMode ? '#0E2E1E' : '#dbfce0')
              : (isDarkMode ? colors.surface : colors.card),
            borderColor: flashcardProgressModeEnabled ? '#5cb572' : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.progressModeCheckbox,
            railMode && styles.progressModeCheckboxRail,
            {
              width: Math.round((railMode ? 18 : isAndroidLesson ? 18 : 16) * railScale),
              height: Math.round((railMode ? 18 : isAndroidLesson ? 18 : 16) * railScale),
              borderRadius: Math.round(5 * railScale),
            },
            {
              backgroundColor: flashcardProgressModeEnabled ? '#1c8742' : 'transparent',
              borderColor: flashcardProgressModeEnabled ? '#1c8742' : colors.border,
            },
          ]}
        >
          {flashcardProgressModeEnabled && (
            <MaterialIcons name="check" size={Math.round((railMode ? 11 : isAndroidLesson ? 11 : 10) * railScale)} color="#FFFFFF" />
          )}
        </View>
        <Text
          style={[
            styles.progressModeText,
            railMode && styles.progressModeTextRail,
            { fontSize: Math.round((railMode ? RAIL_CONTROL_FONT_SIZE : isAndroidLesson ? 14 : 13) * railScale) },
            isAndroidLesson && !railMode && { maxWidth: 180 },
            { color: flashcardProgressModeEnabled ? (isDarkMode ? '#8FE3A3' : '#005f21') : colors.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {flashcardProgressModeEnabled
            ? `Saving · ${learnedFlashcardKeysLoaded ? learnedFlashcardCount : 0}/${filteredWordsCount}`
            : 'Save words'}
        </Text>
      </TouchableOpacity>
    );
  };




  const renderShuffleFlashcardsButton = () => {
    if (!railMode || mode !== 'flashcards') return null;

    const shuffleAccent = isDarkMode ? '#4BBAF4' : FRESH_COLORS.exerciseBlue;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onShuffleFlashcards}
        accessibilityRole="switch"
        accessibilityLabel={isFlashcardShuffled ? 'Turn off shuffle' : 'Turn on shuffle'}
        accessibilityState={{ checked: isFlashcardShuffled }}
        style={[
          styles.progressModeButton,
          styles.progressModeButtonRail,
          {
            height: Math.round(RAIL_CONTROL_HEIGHT * railScale),
            minHeight: Math.round(RAIL_CONTROL_HEIGHT * railScale),
            paddingHorizontal: Math.round(RAIL_CONTROL_HORIZONTAL_PADDING * railScale),
            gap: Math.round(6 * railScale),
            backgroundColor: isFlashcardShuffled
              ? (isDarkMode ? '#12345A' : FRESH_COLORS.exerciseBlueTint)
              : (isDarkMode ? colors.surface : colors.card),
            borderColor: isFlashcardShuffled ? shuffleAccent : colors.border,
          },
        ]}
      >
        <MaterialIcons name="shuffle" size={Math.round(17 * railScale)} color={isFlashcardShuffled ? shuffleAccent : colors.secondaryText} />
        <Text
          style={[
            styles.progressModeText,
            styles.progressModeTextRail,
            { fontSize: Math.round(RAIL_CONTROL_FONT_SIZE * railScale), color: isFlashcardShuffled ? shuffleAccent : colors.text },
          ]}
          numberOfLines={1}
        >
          {isFlashcardShuffled ? 'Shuffled' : 'Shuffle'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFlashcardDirectionButton = () => {
    if (!railMode || mode !== 'flashcards') return null;

    const directionAccent = isDarkMode ? '#4BBAF4' : FRESH_COLORS.exerciseBlue;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onToggleFlashcardDirection}
        accessibilityRole="button"
        accessibilityLabel="Change flashcard direction"
        style={[
          styles.progressModeButton,
          styles.progressModeButtonRail,
          {
            height: Math.round(RAIL_CONTROL_HEIGHT * railScale),
            minHeight: Math.round(RAIL_CONTROL_HEIGHT * railScale),
            paddingHorizontal: Math.round(RAIL_CONTROL_HORIZONTAL_PADDING * railScale),
            gap: Math.round(6 * railScale),
            backgroundColor: isDarkMode ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialIcons name="swap-horiz" size={Math.round(17 * railScale)} color={directionAccent} />
        <Text
          style={[styles.progressModeText, styles.progressModeTextRail, { fontSize: Math.round(RAIL_CONTROL_FONT_SIZE * railScale), color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {flashcardDirectionLabel}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAudioMatchToggle = () => {
    if (mode !== 'matching') return null;

    const audioAccent = isDarkMode ? '#4BBAF4' : FRESH_COLORS.exerciseBlue;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          toggleVocabAudioMatchMode();




          Keyboard.dismiss();
          stopTimer();
          resetGameState();
          initializeGameSet();
        }}
        accessibilityRole="switch"
        accessibilityLabel={isVocabAudioMatchMode ? 'Turn off audio match mode' : 'Turn on audio match mode'}
        accessibilityState={{ checked: isVocabAudioMatchMode }}
        style={[
          styles.audioMatchToggle,
          railMode && styles.audioMatchToggleRail,
          railMode
            ? {
                height: Math.round(RAIL_CONTROL_HEIGHT * railScale),
                minHeight: Math.round(RAIL_CONTROL_HEIGHT * railScale),
                gap: Math.round(8 * railScale),
                paddingHorizontal: Math.round(RAIL_CONTROL_HORIZONTAL_PADDING * railScale),
              }
            : railScale > 1 && {
                height: Math.round(32 * railScale),
                minHeight: Math.round(32 * railScale),
                gap: Math.round(7 * railScale),
                paddingHorizontal: Math.round(12 * railScale),
              },
          // A bit smaller than "Save words" was first bumped to on native — 40px read as
          // too large next to the shuffle/direction row below it.
          isAndroidLesson && !railMode && {
            height: 36,
            minHeight: 36,
            gap: 8,
            paddingHorizontal: 12,
          },
          {
            backgroundColor: isDarkMode ? '#1D252E' : colors.card,
            borderColor: isDarkMode ? 'transparent' : colors.border,
            borderWidth: isDarkMode ? 0 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.audioMatchToggleText,
            railMode && styles.audioMatchToggleTextRail,
            { fontSize: Math.round((railMode ? RAIL_CONTROL_FONT_SIZE : isAndroidLesson ? 14 : 13) * railScale) },
            { color: colors.text },
          ]}
          numberOfLines={1}
        >
          Audio Mode
        </Text>
        <View
          style={[
            styles.audioMatchSwitchTrack,
            railMode && styles.audioMatchSwitchTrackRail,
            {
              width: Math.round((railMode ? 34 : isAndroidLesson ? 34 : 30) * railScale),
              height: Math.round((railMode ? 20 : isAndroidLesson ? 20 : 17) * railScale),
            },
            { backgroundColor: isVocabAudioMatchMode ? audioAccent : (isDarkMode ? '#262F38' : colors.border) },
          ]}
        >
          <View
            style={[
              styles.audioMatchSwitchKnob,
              railMode && styles.audioMatchSwitchKnobRail,
              {
                top: Math.round((railMode ? 2 : isAndroidLesson ? 2.5 : 2.5) * railScale),
                width: Math.round((railMode ? 16 : isAndroidLesson ? 15 : 12) * railScale),
                height: Math.round((railMode ? 16 : isAndroidLesson ? 15 : 12) * railScale),
                borderRadius: Math.round((railMode ? 8 : isAndroidLesson ? 7.5 : 6) * railScale),
              },
              {
                left: isVocabAudioMatchMode
                  ? Math.round((railMode ? 16 : isAndroidLesson ? 17 : 15) * railScale)
                  : Math.round((railMode ? 2 : 2.5) * railScale),
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const categoryButton = renderCategoryPickerButton();
  const progressButton = renderFlashcardProgressButton();
  const shuffleButton = renderShuffleFlashcardsButton();
  const directionButton = renderFlashcardDirectionButton();
  const audioToggle = renderAudioMatchToggle();
  const hasControls = Boolean(categoryButton || progressButton || shuffleButton || directionButton || audioToggle);

  // With nothing to show, the row's own minHeight/margins still reserved a gap above the
  // exercise below it — collapse to nothing instead of an empty spacer.
  if (!hasControls) return null;

  return (
    <View
      style={[
        styles.categoryControlsRow,
        !isDesktopWebLesson && styles.categoryControlsRowMobile,
        isDesktopWebLesson && !railMode && styles.categoryControlsRowDesktopWeb,
        mode === 'matching' && isDesktopWebLesson && !railMode && styles.categoryControlsRowMatchingDesktopWeb,
        isAndroidLesson && styles.categoryControlsRowAndroid,
        !isDesktopWebLesson && styles.categoryControlsRowWithCollapseMobile,
        isDesktopWebLesson && !railMode && styles.categoryControlsRowWithCollapseDesktop,
        sheetMode !== null && !isDesktopWebLesson && styles.categoryControlsRowPracticeGapMobile,
        sheetMode !== null && isDesktopWebLesson && !railMode && styles.categoryControlsRowPracticeGapDesktop,

        // Desktop still insets this row on the left to clear the overlaid collapse button.
        // With no category picker the row is short, so that one-sided padding reads as
        // off-centre — match it on the right. (Mobile no longer insets at all.)
        !categoryButton && isDesktopWebLesson && !railMode && { paddingRight: 70 },

        railMode && styles.categoryControlsRail,
      ]}
    >
      {railMode && hasControls && (
        <Text
          style={[
            styles.categoryControlsRailTitle,
            { fontSize: Math.round(12 * railScale), color: colors.secondaryText },
          ]}
        >
          Options
        </Text>
      )}
      {categoryButton}
      {progressButton}
      {shuffleButton}
      {directionButton}
      {audioToggle}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryControlsRow: {
    position: 'relative',
    zIndex: 5,
    // Keep elevation (Android stacking), but this row has no background of its own — the
    // shadow it casts is a full-width grey band behind the rounded pills sitting in it,
    // since Android casts from this view's own (unrounded, invisible) outline.
    elevation: 5,
    shadowColor: 'transparent',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 24,
  },
  categoryControlsRowMobile: {
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  categoryControlsRowDesktopWeb: {
    paddingHorizontal: 12,
    marginTop: 0,
  },
  // The collapse button is contained by the sheet header now, so this row no longer has to
  // reserve height or a left inset to dodge it.
  categoryControlsRowWithCollapseMobile: {},
  categoryControlsRowWithCollapseDesktop: {
    minHeight: 52,
    paddingLeft: 70,
  },
  categoryControlsRowPracticeGapMobile: {
    marginTop: 8,
  },
  categoryControlsRowPracticeGapDesktop: {
    marginTop: 20,
  },
  categoryControlsRowMatchingDesktopWeb: {
    marginBottom: 10,
  },
  categoryControlsRowAndroid: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexWrap: 'nowrap',
  },
  categoryPickerButton: {
    position: 'relative',
    zIndex: 6,
    // Elevation is only for stacking (the dropdown anchors to this button) — the shadow it
    // cast made this pill look raised next to Audio Mode / Save Words, which have none.
    elevation: 6,
    shadowColor: 'transparent',
    height: 32,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  audioMatchToggle: {
    flexShrink: 0,
    height: 32,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
  },



  audioMatchToggleRail: {
    height: 44,
    minHeight: 44,
    gap: 10,
    paddingHorizontal: 16,
  },
  audioMatchToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  audioMatchToggleTextRail: {
    fontSize: 15,
  },
  audioMatchSwitchTrack: {
    width: 30,
    height: 17,
    borderRadius: 999,
    position: 'relative',
  },
  audioMatchSwitchTrackRail: {
    width: 38,
    height: 22,
  },
  audioMatchSwitchKnob: {
    position: 'absolute',
    top: 2.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  audioMatchSwitchKnobRail: {
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  categoryPickerButtonAndroid: {
    flexShrink: 1,
    minWidth: 0,
  },
  categoryPickerButtonRail: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  categoryPickerText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  categoryPickerTextRail: {
    fontSize: 15,
  },
  progressModeButton: {
    height: 32,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressModeButtonRail: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 0,
    gap: 7,
  },






  progressModeButtonAndroid: {
    flexShrink: 1,
    minWidth: 0,
  },
  progressModeText: {
    maxWidth: 140,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  progressModeTextRail: {
    fontSize: 15,
  },
  progressModeCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressModeCheckboxRail: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },



  categoryControlsRail: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
    width: '100%',
    minHeight: 0,
    gap: 8,
    paddingHorizontal: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  categoryControlsRailTitle: {
    paddingHorizontal: 2,
    marginBottom: 1,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
