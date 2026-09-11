import { StyleSheet } from 'react-native';
import { freshFontFamily } from '../../shared/freshDirection';
import { getWebLessonScale, isCompactViewport, isDesktopWebWidth } from '../../shared/responsiveLayout';




export const BLANK_SLOT_WIDTH = 92;







export const ANSWER_TRAY_COMPACT_PADDING_H = 14;
export const BUILD_AREA_HEIGHT_MOBILE = 126;
export const BUILD_AREA_HEIGHT_DESKTOP = 124;








export const WORD_BANK_HEIGHT_MOBILE = 116;
export const WORD_BANK_HEIGHT_DESKTOP = 100;




export const WORD_BANK_OUTER_MAX_WIDTH = 640;

export const wordBankStyles = StyleSheet.create({
  answerTray: {
    minHeight: 0,
    padding: 0,
    position: 'relative',
  },









  buildArea: {
    width: '100%',
    minHeight: BUILD_AREA_HEIGHT_MOBILE,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildAreaDesktopWeb: {
    minHeight: BUILD_AREA_HEIGHT_DESKTOP,
    borderRadius: 18,
    padding: 14,
  },


  buildAreaEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildAreaEmptyIcon: {
    marginBottom: 6,
  },
  buildAreaEmptyTitle: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 15,
    textAlign: 'center',
  },
  buildAreaEmptyTitleDesktopWeb: {
    fontSize: 17,
  },
  buildAreaEmptySubtitle: {
    fontWeight: freshFontFamily.medium,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.75,
  },
  buildAreaEmptySubtitleDesktopWeb: {
    fontSize: 14,
  },



  answerTrayCompact: {
    paddingHorizontal: ANSWER_TRAY_COMPACT_PADDING_H,
  },
  answerTrayIncorrect: {
    borderTopColor: 'transparent',
  },



  wordBankOuterWrap: {
    alignSelf: 'center',
    flexDirection: 'column',
    maxWidth: WORD_BANK_OUTER_MAX_WIDTH,
    width: '100%',
  },
  wordBankCard: {
    padding: 0,
    marginTop: 14,
    gap: 14,
  },
  wordBankCardCompact: {
    padding: 0,
    marginTop: 30,
    gap: 30,
  },
  answerPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.38,
    paddingVertical: 10,
    width: '100%',
  },









  selectedWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    rowGap: 10,
    width: '100%',
  },
  selectedWordsRowCompact: {
    rowGap: 7,
  },
  blankSlot: {
    width: BLANK_SLOT_WIDTH,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },





  blankSlotDesktopWeb: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderStyle: 'solid',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  wordBankPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 0,




    justifyContent: 'center',
  },
  wordBankPanelCompact: {
    padding: 10,
    marginBottom: 0,
    borderRadius: 16,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  wordChip: {
    minHeight: 48,
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // boxShadow only: an elevation shadow composites separately from the chip's fade
    // (WordBankChipFade / the dimmed selected state) and showed as a grey plate behind it.
    boxShadow: '0px 2px 5px rgba(110,75,69,0.10)',
  },
  wordChipCompact: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 13,
  },
  wordChipDesktopWeb: {},
  wordChipText: {
    color: '#24211D',
    fontWeight: freshFontFamily.bold,
    fontSize: 18,
  },
  wordChipTextDesktopWeb: {
    fontSize: 15,
  },





  selectedWordChip: {
    minHeight: 48,
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
  },
  selectedWordDragWrap: {
    alignSelf: 'flex-start',



    borderRadius: 14,
  },
  siblingChipDuringDrag: {
    opacity: 0.65,
  },
  dropTargetChip: {
    opacity: 0.42,
    borderColor: '#4A9FF5',
    borderWidth: 2.5,
  },
  selectedWordChipCompact: {
    minHeight: 48,
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  selectedWordChipDesktopWeb: {
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  selectedWordChipText: {
    fontWeight: freshFontFamily.bold,
    fontSize: 18,
  },
  selectedWordChipTextDesktopWeb: {
    fontSize: 18,
  },


  disabledWordChip: {
    opacity: 0.55,
  },
  disabledWordChipText: {
    color: '#6f8798',
  },


  checkAnswerButton: {
    height: 52,
    minHeight: 52,
    marginTop: 24,
    width: '68%',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#4AA3D2',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAnswerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  checkAnswerButtonCompact: {
    height: 52,
    minHeight: 52,
  },





  checkAnswerButtonDesktopWeb: {},
  disabledCheckAnswerButton: {
    opacity: 0.45,
  },
  checkAnswerButtonText: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 16,
  },
  exerciseErrorText: {
    color: '#A12A3D',
    fontWeight: freshFontFamily.bold,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  incorrectOption: {
    backgroundColor: '#FFE8EC',
    borderColor: '#F06A7F',
    borderBottomColor: '#D94E64',
  },
});













export type ChipMetrics = {
  fontSize: number;
  paddingHorizontal: number;
  paddingVertical: number;
  minHeight: number;
};

export type ChipDensityTable = Record<'compact' | 'mobile' | 'desktop', ChipMetrics>;

// These metrics also drive width prediction; keep them aligned with rendered chip padding.
export const REORDER_CHIP_METRICS: ChipDensityTable = {
  compact: { fontSize: 15.5, paddingHorizontal: 12, paddingVertical: 8, minHeight: 40 },
  mobile: { fontSize: 18, paddingHorizontal: 15, paddingVertical: 10, minHeight: 46 },
  desktop: { fontSize: 20, paddingHorizontal: 20, paddingVertical: 12, minHeight: 50 },
};

export const TRANSLATE_CHIP_METRICS: ChipDensityTable = {
  compact: { fontSize: 15.5, paddingHorizontal: 10, paddingVertical: 7, minHeight: 38 },
  mobile: { fontSize: 18, paddingHorizontal: 13, paddingVertical: 9, minHeight: 44 },
  desktop: { fontSize: 20, paddingHorizontal: 14, paddingVertical: 9, minHeight: 46 },
};











export const CHIP_COMPACT_MAX_HEIGHT = 700;
export const CHIP_COMPACT_MAX_WIDTH = 380;

export const getChipPreset = (
  table: ChipDensityTable,
  windowWidth: number,
  windowHeight: number,
  // Lets a caller (e.g. Reorder/Translate's desktop dampening) override the scale instead of
  // this recomputing its own raw one — otherwise the chips silently ignore whatever correction
  // the surrounding container already applied to itself.
  desktopScaleOverride?: number,
): ChipMetrics => {
  if (isCompactViewport(windowWidth, windowHeight, {
    widthThreshold: CHIP_COMPACT_MAX_WIDTH,
    heightThreshold: CHIP_COMPACT_MAX_HEIGHT,
  })) {
    return table.compact;
  }
  if (isDesktopWebWidth(windowWidth, undefined, windowHeight)) {
    const scale = desktopScaleOverride ?? getWebLessonScale(windowWidth, windowHeight);
    return scaleChipMetrics(table.desktop, scale);
  }

  const scale = getWebLessonScale(windowWidth, windowHeight);



  return scaleChipMetrics(table.mobile, scale);
};












export type CheckButtonMetrics = {
  height: number;
  fontSize: number;
  iconSize: number;
};




export const CHECK_COMPACT_MAX_STAGE_HEIGHT = 700;
export const CHECK_COMPACT_MAX_WIDTH = 390;

export const getCheckButtonMetrics = (
  windowWidth: number,
  availableStageHeight: number,
  windowHeight = availableStageHeight,
  // Same override as getChipPreset — Reorder/Translate's desktop dampening otherwise never
  // reaches this button, so it scales faster than the chips sitting next to it.
  desktopScaleOverride?: number,
): CheckButtonMetrics => {
  const isCompact = isCompactViewport(windowWidth, availableStageHeight, {
    widthThreshold: CHECK_COMPACT_MAX_WIDTH,
    heightThreshold: CHECK_COMPACT_MAX_STAGE_HEIGHT,
  });
  const isDesktopWeb = isDesktopWebWidth(windowWidth);




  const desktopScale = desktopScaleOverride ?? getWebLessonScale(windowWidth, windowHeight);
  return {
    height: Math.round((isCompact ? 46 : 52) * desktopScale),
    fontSize: roundToHalf((isDesktopWeb ? 17 : 15.5) * desktopScale),
    iconSize: Math.round((isDesktopWeb ? 19 : 18) * desktopScale),
  };
};





const CHIP_CHAR_WIDTH_RATIO = 0.6;


const CHIP_WIDTH_SAFETY = 6;



const CHIP_LONGEST_TAPER_START = 8;
const CHIP_LONGEST_TAPER_PER_CHAR = 0.02;


const CHIP_TOTAL_TAPER_START = 42;
const CHIP_TOTAL_TAPER_PER_CHAR = 0.006;



const CHIP_MIN_TAPER_SCALE = 0.85;


const CHIP_MIN_FONT_SIZE = 12;
const CHIP_MIN_PADDING_H = 7;
const CHIP_MIN_PADDING_V = 6;
const CHIP_MIN_HEIGHT = 34;

const roundToHalf = (value: number) => Math.round(value * 2) / 2;

const scaleChipMetrics = (metrics: ChipMetrics, scale: number): ChipMetrics => ({
  fontSize: roundToHalf(metrics.fontSize * scale),
  paddingHorizontal: Math.round(metrics.paddingHorizontal * scale),
  paddingVertical: Math.round(metrics.paddingVertical * scale),
  minHeight: Math.round(metrics.minHeight * scale),
});

const predictChipWidth = (charCount: number, metrics: ChipMetrics) =>
  charCount * metrics.fontSize * CHIP_CHAR_WIDTH_RATIO
  + metrics.paddingHorizontal * 2
  + CHIP_WIDTH_SAFETY;













// Conservative width prediction prevents long word banks from wrapping outside the fixed stage.
export const getChipMetrics = (
  base: ChipMetrics,
  words: string[],
  availableWidth: number,
): ChipMetrics => {
  const longestWordLength = words.reduce((longest, word) => Math.max(longest, word.length), 0);
  if (longestWordLength === 0) return base;
  const totalLength = words.reduce((total, word) => total + word.length, 0);

  const longestTaper = 1 - Math.max(0, longestWordLength - CHIP_LONGEST_TAPER_START) * CHIP_LONGEST_TAPER_PER_CHAR;
  const totalTaper = 1 - Math.max(0, totalLength - CHIP_TOTAL_TAPER_START) * CHIP_TOTAL_TAPER_PER_CHAR;
  const taperScale = Math.max(CHIP_MIN_TAPER_SCALE, Math.min(longestTaper, totalTaper));

  let metrics = scaleChipMetrics(base, taperScale);

  const widestChip = predictChipWidth(longestWordLength, metrics);
  if (availableWidth > 0 && widestChip > availableWidth) {


    const fitScale = (availableWidth - CHIP_WIDTH_SAFETY) / (widestChip - CHIP_WIDTH_SAFETY);
    metrics = scaleChipMetrics(metrics, Math.max(0.1, fitScale));
  }

  return {
    fontSize: Math.max(CHIP_MIN_FONT_SIZE, metrics.fontSize),
    paddingHorizontal: Math.max(CHIP_MIN_PADDING_H, metrics.paddingHorizontal),
    paddingVertical: Math.max(CHIP_MIN_PADDING_V, metrics.paddingVertical),
    minHeight: Math.max(CHIP_MIN_HEIGHT, metrics.minHeight),
  };
};
