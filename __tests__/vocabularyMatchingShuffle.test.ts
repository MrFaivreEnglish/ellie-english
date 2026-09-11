import { shuffleMatchingPairColumns } from '../features/vocabulary/vocabularyUtils';

type TestCard = { pairId: number; side: 'english' | 'french' };

const createSeededRandom = (initialSeed: number) => {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
};

const makeCards = (side: TestCard['side'], count: number): TestCard[] =>
  Array.from({ length: count }, (_, pairId) => ({ pairId, side }));

const countAlignedPairs = (left: TestCard[], right: TestCard[]) =>
  left.filter((card, index) => card.pairId === right[index]?.pairId).length;

describe('shuffleMatchingPairColumns', () => {
  it('guarantees no adjacent answers on normal protected boards', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const result = shuffleMatchingPairColumns(
        makeCards('english', 5),
        makeCards('french', 5),
        (card) => card.pairId,
        { random: createSeededRandom(seed), adjacentPairChance: 0 }
      );

      expect(countAlignedPairs(result.left, result.right)).toBe(0);
    }
  });

  it('allows at most one adjacent answer when occasional adjacency is enabled', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const result = shuffleMatchingPairColumns(
        makeCards('english', 6),
        makeCards('french', 6),
        (card) => card.pairId,
        { random: createSeededRandom(seed), adjacentPairChance: 1 }
      );

      expect(countAlignedPairs(result.left, result.right)).toBeLessThanOrEqual(1);
      expect(result.left).toHaveLength(6);
      expect(result.right).toHaveLength(6);
    }
  });

  it('keeps the unavoidable adjacency for a one-pair board', () => {
    const result = shuffleMatchingPairColumns(
      makeCards('english', 1),
      makeCards('french', 1),
      (card) => card.pairId,
      { random: createSeededRandom(1), adjacentPairChance: 0 }
    );

    expect(countAlignedPairs(result.left, result.right)).toBe(1);
  });
});
