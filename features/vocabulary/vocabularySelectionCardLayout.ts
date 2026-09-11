export const VOCABULARY_SELECTION_CARD_HEIGHTS = {
  list: 124,
  compactTile: 168,
  tile: 194,
} as const;



export const getVocabularySelectionCardHeight = (
  cardView: 'list' | 'tile',
  compactTile: boolean,
  _visualStyle: 'normal' | 'pixel'
) => {
  if (cardView === 'list') return VOCABULARY_SELECTION_CARD_HEIGHTS.list;
  return compactTile
    ? VOCABULARY_SELECTION_CARD_HEIGHTS.compactTile
    : VOCABULARY_SELECTION_CARD_HEIGHTS.tile;
};
