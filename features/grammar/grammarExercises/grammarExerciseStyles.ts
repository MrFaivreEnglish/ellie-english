import { StyleSheet } from 'react-native';
import { uiRadii } from '../../shared/uiPrimitives';
import { freshFontFamily } from '../../shared/freshDirection';

// Blanks render at this fixed width regardless of the eventual word's length,
// so the tray's row-wrapping estimate (used to reserve a stable height) must
// use this same width rather than each word's real text width.
export const BLANK_SLOT_WIDTH = 92;

export const wordBankStyles = StyleSheet.create({
  // Visually merges with the questionCard above it (same accent-blue background,
  // flush top edge, rounded only at the bottom) so the two Views read as one card.
  answerTray: {
    minHeight: 0,
    borderTopWidth: 1,
    borderBottomLeftRadius: uiRadii.promptCard,
    borderBottomRightRadius: uiRadii.promptCard,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
    position: 'relative',
  },
  answerTrayCompact: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  answerTrayIncorrect: {
    borderTopColor: 'transparent',
  },
  wordBankOuterWrap: {
    flexDirection: 'column',
  },
  wordBankCard: {
    borderRadius: uiRadii.exerciseCard,
    padding: 22,
    marginTop: 20,
  },
  wordBankCardCompact: {
    padding: 14,
    marginTop: 14,
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
    minHeight: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    flex: 1,
  },
  selectedWordsRowCompact: {
    gap: 7,
  },
  selectedWordsRowWithClear: {
    paddingRight: 44,
  },
  clearAnswerButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    top: 14,
    width: 34,
    zIndex: 5,
  },
  blankSlot: {
    width: BLANK_SLOT_WIDTH,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  wordBankPanelCompact: {
    padding: 12,
    marginBottom: 14,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  wordChip: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: uiRadii.chip,
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wordChipCompact: {},
  wordChipDesktopWeb: {},
  wordChipText: {
    color: '#4B4B4B',
    fontWeight: freshFontFamily.bold,
    fontSize: 15,
  },
  wordChipTextCompact: {
    fontSize: 15,
  },
  wordChipTextDesktopWeb: {
    fontSize: 15,
  },
  selectedWordChip: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 0,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedWordDragWrap: {
    alignSelf: 'flex-start',
    // Match selectedWordChip's radius: on Android, elevation on this
    // (otherwise transparent, unrounded) wrapper would cast a square drop
    // shadow behind the rounded chip while it's being dragged.
    borderRadius: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  selectedWordChipDesktopWeb: {
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  selectedWordChipText: {
    fontWeight: freshFontFamily.bold,
    fontSize: 18,
  },
  selectedWordChipTextCompact: {
    fontSize: 19,
  },
  selectedWordChipTextDesktopWeb: {
    fontSize: 18,
  },
  disabledWordChip: {
    opacity: 0.3,
  },
  disabledWordChipText: {
    color: '#6f8798',
  },
  checkAnswerButton: {
    minHeight: 54,
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
    minHeight: 50,
  },
  checkAnswerButtonDesktopWeb: {
    minHeight: 58,
  },
  disabledCheckAnswerButton: {
    opacity: 0.45,
  },
  checkAnswerButtonText: {
    color: '#fff',
    fontWeight: freshFontFamily.extrabold,
    fontSize: 17,
    letterSpacing: 0.3,
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
