#!/usr/bin/env node
/* eslint-disable no-console */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const rootDir = path.resolve(__dirname, '..');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};

const requireFromRoot = (relativePath) => require(path.join(rootDir, relativePath));

const {
  getQuestionsForMode,
  isFillExercise,
  isReorderExercise,
  isTranslateExercise,
  normalizeAnswer,
  tokenizeTranslateAnswer,
} = requireFromRoot('features/grammar/grammarExercises/GrammarExerciseUtils.ts');
const {
  getLevelBadgeLabel,
  getLevelDisplayLabel,
  getMasterStarCount,
  getMasterTierLabel,
  getXPLevel,
  getXPLevelStats,
  xpForLevel,
  xpNeededForLevel,
} = requireFromRoot('features/progress/xpLevels.ts');
const {
  getTypingAnswerXP,
  getTypingComboReward,
  XP_REWARDS,
} = requireFromRoot('features/progress/xpRewards.ts');

const run = () => {
  assert.strictEqual(normalizeAnswer('  I am here! '), 'i am here');
  assert.strictEqual(normalizeAnswer('Cafe.'), 'cafe');
  assert.strictEqual(normalizeAnswer("John 's book"), "john's book");

  assert.deepStrictEqual(
    tokenizeTranslateAnswer('I like the blue car'),
    ['I', 'like', 'the blue', 'car']
  );

  const exercises = [
    { question: 'Choose', answer: 'A', options: ['A', 'B'] },
    { question: 'Fill ___', answer: 'word', type: 'fill' },
    { question: 'Put in order', answer: 'I am ready', type: 'reorder', words: ['I', 'am', 'ready'] },
    { question: 'Translate', prompt: 'Je suis pret', answer: 'I am ready', type: 'translate' },
  ];

  assert.strictEqual(isFillExercise(exercises[1]), true);
  assert.strictEqual(isReorderExercise(exercises[2]), true);
  assert.strictEqual(isTranslateExercise(exercises[3]), true);
  assert.strictEqual(getQuestionsForMode(exercises, 'quiz', 10).length, 1);
  assert.strictEqual(getQuestionsForMode(exercises, 'fill', 10).every((exercise) => exercise.type === 'fill'), true);
  assert.strictEqual(getQuestionsForMode(exercises, 'reorder', 10).every(isReorderExercise), true);
  assert.strictEqual(getQuestionsForMode(exercises, 'translate', 10).every(isTranslateExercise), true);

  assert.strictEqual(xpNeededForLevel(1), 50);
  assert.strictEqual(xpNeededForLevel(99), 200);
  assert.strictEqual(xpForLevel(1), 0);
  assert.strictEqual(getXPLevel(0), 1);
  assert.strictEqual(getXPLevel(50), 2);
  assert.strictEqual(getXPLevelStats(25).progressPercent, 50);
  assert.strictEqual(getLevelBadgeLabel(100), 'Level 100+');
  assert.strictEqual(getLevelDisplayLabel(100), 'Level 100 - Ellie Master');
  assert.strictEqual(getMasterTierLabel(109), 'Master I');
  assert.strictEqual(getMasterTierLabel(110), 'Master II');
  assert.strictEqual(getMasterStarCount(200), 5);

  assert.deepStrictEqual(getTypingComboReward(2), { streak: 0, bonus: 0, label: '' });
  assert.strictEqual(getTypingComboReward(7).bonus, 3);

  const typingReward = getTypingAnswerXP({
    attempts: 1,
    streak: 5,
    isStrictMode: true,
    isReviewMode: true,
  });
  assert.strictEqual(
    typingReward.xpGain,
    XP_REWARDS.vocabularyTypingCorrect +
      XP_REWARDS.vocabularyTypingFirstTryBonus +
      XP_REWARDS.vocabularyTypingStrictModeBonus +
      XP_REWARDS.vocabularyTypingReviewBonus +
      getTypingComboReward(5).bonus
  );
};

try {
  run();
  console.log('Logic validation passed.');
} catch (error) {
  console.error('Logic validation failed:');
  console.error(error);
  process.exit(1);
}
