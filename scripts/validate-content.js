#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { TextDecoder } = require('util');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const assetIndexPaths = [
  path.join(rootDir, 'assets', 'index.ts'),
  path.join(rootDir, 'assets', 'index.js'),
];
const vocabularyRegistryPath = path.join(rootDir, 'content', 'lessons', 'vocabularyRegistry.ts');
const vocabularyScreenPath = path.join(rootDir, 'features', 'vocabulary', 'VocabularyScreen.tsx');
const scanRoots = [
  'App.tsx',
  'assets/index.js',
  'assets/index.ts',
  'content',
  'features',
  'lib',
  'README.md',
  'package.json',
  'tsconfig.json',
];

const ignoredDirectories = new Set([
  '.expo',
  '.git',
  'android',
  'dist',
  'ios',
  'node_modules',
]);

const textExtensions = new Set(['.js', '.json', '.md', '.ts', '.tsx']);
const allowedChapterTargets = new Set(['vocabulary', 'grammar', 'pronunciation']);
const lessonTargets = ['vocabulary', 'grammar', 'pronunciation'];
const maxLessonTitleLength = 90;
const maxChapterLinkLabelLength = 70;
const maxVocabularyWordLength = 80;

const mojibakeMarkers = [
  { value: String.fromCharCode(0x00c3), label: 'mojibake marker "C3"' },
  { value: String.fromCharCode(0x00e2, 0x20ac), label: 'mojibake marker "e2 80"' },
  { value: String.fromCharCode(0x00f0, 0x0178), label: 'mojibake marker "f0 9f"' },
  { value: String.fromCharCode(0x00ef, 0x00bf, 0x00bd), label: 'mojibake replacement marker' },
  { value: String.fromCharCode(0xfffd), label: 'replacement character' },
];

const problems = [];

const toRelativePath = (filePath) =>
  path.relative(rootDir, filePath).replace(/\\/g, '/');

const addProblem = (filePath, line, message) => {
  problems.push(`${toRelativePath(filePath)}:${line}: ${message}`);
};

const normalizeTitle = (title) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeWordPairKey = (english, french) =>
  `${String(english).trim().toLowerCase()}|${String(french).trim().toLowerCase()}`;

const validateMaxLength = (filePath, line, context, value, maxLength) => {
  if (typeof value === 'string' && value.length > maxLength) {
    addProblem(filePath, line, `${context} is too long (${value.length}/${maxLength} characters)`);
  }
};

const collectFiles = (entryPath, files = []) => {
  if (!fs.existsSync(entryPath)) return files;

  const stats = fs.statSync(entryPath);
  if (stats.isDirectory()) {
    const name = path.basename(entryPath);
    if (ignoredDirectories.has(name)) return files;

    for (const entry of fs.readdirSync(entryPath)) {
      collectFiles(path.join(entryPath, entry), files);
    }

    return files;
  }

  if (textExtensions.has(path.extname(entryPath))) {
    files.push(entryPath);
  }

  return files;
};

const getLineForOffset = (sourceFile, offset) =>
  sourceFile.getLineAndCharacterOfPosition(offset).line + 1;

const getLineForTextOffset = (text, offset) =>
  text.slice(0, offset).split(/\r\n|\r|\n/).length;

const getPropertyName = (nameNode) => {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  return null;
};

const getProperty = (objectNode, propertyName) => {
  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) return null;

  return objectNode.properties.find((property) => {
    if (!ts.isPropertyAssignment(property)) return false;
    return getPropertyName(property.name) === propertyName;
  }) || null;
};

const getStringValue = (node) => {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
};

const getArrayElements = (node) => {
  if (!node || !ts.isArrayLiteralExpression(node)) return null;
  return node.elements;
};

const requireStringProperty = (filePath, sourceFile, objectNode, propertyName, context) => {
  const property = getProperty(objectNode, propertyName);
  const value = property ? getStringValue(property.initializer) : null;

  if (typeof value !== 'string' || value.trim().length === 0) {
    const line = property ? getLineForOffset(sourceFile, property.getStart(sourceFile)) : getLineForOffset(sourceFile, objectNode.getStart(sourceFile));
    addProblem(filePath, line, `${context} is missing a non-empty "${propertyName}" string`);
    return null;
  }

  return value;
};

const getRequiredStringPropertyInfo = (filePath, sourceFile, objectNode, propertyName, context) => {
  const property = getProperty(objectNode, propertyName);
  const value = property ? getStringValue(property.initializer) : null;

  if (typeof value !== 'string' || value.trim().length === 0) {
    const line = property ? getLineForOffset(sourceFile, property.getStart(sourceFile)) : getLineForOffset(sourceFile, objectNode.getStart(sourceFile));
    addProblem(filePath, line, `${context} is missing a non-empty "${propertyName}" string`);
    return null;
  }

  return {
    value,
    line: getLineForOffset(sourceFile, property.getStart(sourceFile)),
  };
};

const requireStringArray = (filePath, sourceFile, arrayNode, context) => {
  const elements = getArrayElements(arrayNode);
  if (!elements || elements.length === 0) {
    addProblem(filePath, getLineForOffset(sourceFile, arrayNode.getStart(sourceFile)), `${context} must be a non-empty string array`);
    return null;
  }

  const values = [];
  elements.forEach((element, index) => {
    const value = getStringValue(element);
    if (typeof value !== 'string' || value.trim().length === 0) {
      addProblem(
        filePath,
        getLineForOffset(sourceFile, element.getStart(sourceFile)),
        `${context}[${index}] must be a non-empty string`
      );
      return;
    }

    values.push({
      value,
      line: getLineForOffset(sourceFile, element.getStart(sourceFile)),
      index,
    });
  });

  return values;
};

const normalizeExerciseSentence = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+'s\b/g, "'s")
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ');

const getExerciseTokens = (value) =>
  normalizeExerciseSentence(value)
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const countExerciseTokens = (values) => {
  const counts = new Map();

  values.forEach((value) => {
    getExerciseTokens(value).forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  });

  return counts;
};

const addMissingAnswerTokenProblems = (filePath, line, context, answer, availableValues, sourceLabel) => {
  const answerCounts = countExerciseTokens([answer]);
  const availableCounts = countExerciseTokens(availableValues);
  const missing = [];

  for (const [token, count] of answerCounts.entries()) {
    const availableCount = availableCounts.get(token) || 0;
    if (availableCount < count) {
      missing.push(availableCount === 0 ? `"${token}"` : `"${token}" x${count - availableCount}`);
    }
  }

  if (missing.length > 0) {
    addProblem(filePath, line, `${context} ${sourceLabel} is missing answer token(s): ${missing.join(', ')}`);
  }
};

const validateReorderWordBank = (filePath, sourceFile, arrayNode, context) => {
  const elements = getArrayElements(arrayNode);
  if (!elements || elements.length === 0) {
    addProblem(filePath, getLineForOffset(sourceFile, arrayNode.getStart(sourceFile)), `${context} must be a non-empty object array`);
    return null;
  }

  const values = [];
  const seenIds = new Map();

  elements.forEach((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      addProblem(filePath, getLineForOffset(sourceFile, element.getStart(sourceFile)), `${context}[${index}] must be an object`);
      return;
    }

    const idInfo = getRequiredStringPropertyInfo(filePath, sourceFile, element, 'id', `${context}[${index}]`);
    const wordInfo = getRequiredStringPropertyInfo(filePath, sourceFile, element, 'word', `${context}[${index}]`);

    if (idInfo) {
      if (seenIds.has(idInfo.value)) {
        addProblem(
          filePath,
          idInfo.line,
          `${context}[${index}] repeats id "${idInfo.value}" also used at item ${seenIds.get(idInfo.value)}`
        );
      } else {
        seenIds.set(idInfo.value, index);
      }
    }

    if (wordInfo) {
      values.push(wordInfo.value);
    }
  });

  return values;
};

const getNormalizedObjectKeys = (objectNode) => {
  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) return new Set();

  return new Set(
    objectNode.properties
      .filter(ts.isPropertyAssignment)
      .map((property) => getPropertyName(property.name))
      .filter((key) => typeof key === 'string' && key.trim().length > 0)
      .map((key) => normalizeTitle(key))
  );
};

const collectRegisteredVocabularyFiles = (parsedFiles) => {
  const registry = parsedFiles.find((item) => item.filePath === vocabularyRegistryPath);
  const registeredFiles = new Set();
  if (!registry) return registeredFiles;

  const registryDir = path.dirname(vocabularyRegistryPath);

  registry.sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node)) return;
    const modulePath = getStringValue(node.moduleSpecifier);
    if (!modulePath || !modulePath.startsWith('../vocabulary/')) return;

    registeredFiles.add(path.resolve(registryDir, `${modulePath}.ts`));
  });

  return registeredFiles;
};

const collectDifficultyMapKeys = (parsedFiles) => {
  const screen = parsedFiles.find((item) => item.filePath === vocabularyScreenPath);
  if (!screen) return new Set();

  let keys = new Set();
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'difficultyMap' &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      keys = getNormalizedObjectKeys(node.initializer);
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(screen.sourceFile);
  return keys;
};

const validateAssetRegistry = (filePath, sourceFile) => {
  const thumbnailKeys = new Set();
  const seenThumbnailKeys = new Map();

  const validateRequirePath = (node) => {
    if (!ts.isCallExpression(node)) return;
    if (!ts.isIdentifier(node.expression) || node.expression.text !== 'require') return;
    const requestedPath = getStringValue(node.arguments[0]);
    if (!requestedPath || !requestedPath.startsWith('.')) return;

    const resolvedPath = path.resolve(path.dirname(filePath), requestedPath);
    if (!fs.existsSync(resolvedPath)) {
      addProblem(
        filePath,
        getLineForOffset(sourceFile, node.getStart(sourceFile)),
        `Missing asset file "${requestedPath}"`
      );
    }
  };

  const visit = (node) => {
    validateRequirePath(node);

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'raw' &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      node.initializer.properties.forEach((property) => {
        if (!ts.isPropertyAssignment(property)) return;
        const key = getPropertyName(property.name);
        if (!key) return;

        const normalizedKey = normalizeTitle(key);
        thumbnailKeys.add(normalizedKey);

        if (seenThumbnailKeys.has(key)) {
          const first = seenThumbnailKeys.get(key);
          addProblem(
            filePath,
            getLineForOffset(sourceFile, property.getStart(sourceFile)),
            `Duplicate thumbnail key "${key}" also defined at ${toRelativePath(filePath)}:${first.line}`
          );
        } else {
          seenThumbnailKeys.set(key, {
            key,
            line: getLineForOffset(sourceFile, property.getStart(sourceFile)),
          });
        }
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return thumbnailKeys;
};

const validateRegisteredVocabularyMetadata = (
  catalog,
  registeredVocabularyFiles,
  thumbnailRegistries,
  difficultyMapKeys
) => {
  for (const entries of catalog.vocabulary.titles.values()) {
    for (const entry of entries) {
      if (!registeredVocabularyFiles.has(entry.filePath)) continue;

      const normalizedTitle = normalizeTitle(entry.title);
      for (const registry of thumbnailRegistries) {
        if (!registry.thumbnailKeys.has(normalizedTitle)) {
          addProblem(
            entry.filePath,
            entry.line,
            `Registered vocabulary lesson "${entry.title}" has no matching local thumbnail key in ${toRelativePath(registry.filePath)}`
          );
        }
      }

      if (!difficultyMapKeys.has(normalizedTitle)) {
        addProblem(
          entry.filePath,
          entry.line,
          `Registered vocabulary lesson "${entry.title}" has no difficulty level in VocabularyScreen`
        );
      }
    }
  }
};

const createLessonCatalog = () => ({
  vocabulary: {
    titles: new Map(),
    ids: new Map(),
  },
  grammar: {
    titles: new Map(),
    ids: new Map(),
  },
  pronunciation: {
    titles: new Map(),
    ids: new Map(),
  },
});

const addCatalogValue = (catalogMap, key, entry) => {
  if (!key) return;
  const existing = catalogMap.get(key) || [];
  existing.push(entry);
  catalogMap.set(key, existing);
};

const addLessonCatalogEntry = (catalog, target, filePath, sourceFile, objectNode) => {
  const titleProperty = getProperty(objectNode, 'title');
  const title = titleProperty ? getStringValue(titleProperty.initializer) : null;
  if (typeof title !== 'string' || title.trim().length === 0) return;

  const id = getStringValue(getProperty(objectNode, 'id')?.initializer);
  const entry = {
    filePath,
    line: getLineForOffset(sourceFile, titleProperty.getStart(sourceFile)),
    title,
    id,
  };

  validateMaxLength(filePath, entry.line, `${target} lesson title "${title}"`, title, maxLessonTitleLength);
  addCatalogValue(catalog[target].titles, normalizeTitle(title), entry);
  addCatalogValue(catalog[target].ids, id, entry);
};

const addDuplicateCatalogProblems = (catalog) => {
  for (const target of lessonTargets) {
    for (const entries of catalog[target].titles.values()) {
      if (entries.length < 2) continue;

      const first = entries[0];
      for (const entry of entries.slice(1)) {
        addProblem(
          entry.filePath,
          entry.line,
          `Duplicate ${target} lesson title "${entry.title}" also defined in ${toRelativePath(first.filePath)}:${first.line}`
        );
      }
    }

    for (const [id, entries] of catalog[target].ids.entries()) {
      if (!id || entries.length < 2) continue;

      const first = entries[0];
      for (const entry of entries.slice(1)) {
        addProblem(
          entry.filePath,
          entry.line,
          `Duplicate ${target} lesson id "${id}" also defined in ${toRelativePath(first.filePath)}:${first.line}`
        );
      }
    }
  }
};

const buildLessonCatalog = (parsedFiles) => {
  const catalog = createLessonCatalog();

  for (const { filePath, sourceFile } of parsedFiles) {
    const relativePath = toRelativePath(filePath);

    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        if (relativePath.startsWith('content/vocabulary/') && getProperty(node, 'flashcards')) {
          addLessonCatalogEntry(catalog, 'vocabulary', filePath, sourceFile, node);
        }

        if (
          relativePath.startsWith('content/grammar/') &&
          (getProperty(node, 'exercises') || getProperty(node, 'translateExercises'))
        ) {
          addLessonCatalogEntry(catalog, 'grammar', filePath, sourceFile, node);
        }

        if (
          relativePath === 'content/lessons/grammarRegistry.ts' &&
          getProperty(node, 'flashcards') &&
          getProperty(node, 'practiceType')
        ) {
          addLessonCatalogEntry(catalog, 'grammar', filePath, sourceFile, node);
        }

        if (
          relativePath.startsWith('content/pronunciation/') &&
          !relativePath.endsWith('pronunciationTypes.ts') &&
          (getProperty(node, 'goal') || getProperty(node, 'focus') || getProperty(node, 'usefulPhrases'))
        ) {
          addLessonCatalogEntry(catalog, 'pronunciation', filePath, sourceFile, node);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  addDuplicateCatalogProblems(catalog);
  return catalog;
};

const validateWordObject = (filePath, sourceFile, objectNode, context) => {
  const englishInfo = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'english', `${context} word`);
  const frenchInfo = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'french', `${context} word`);

  if (englishInfo) validateMaxLength(filePath, englishInfo.line, `${context} English word`, englishInfo.value, maxVocabularyWordLength);
  if (frenchInfo) validateMaxLength(filePath, frenchInfo.line, `${context} French word`, frenchInfo.value, maxVocabularyWordLength);

  const english = englishInfo?.value ?? null;
  const french = frenchInfo?.value ?? null;
  return { english, french };
};

const validateFlashcards = (filePath, sourceFile, lessonNode, context) => {
  const flashcardsProperty = getProperty(lessonNode, 'flashcards');
  if (!flashcardsProperty) {
    addProblem(filePath, getLineForOffset(sourceFile, lessonNode.getStart(sourceFile)), `${context} is missing "flashcards"`);
    return;
  }

  const flashcards = getArrayElements(flashcardsProperty.initializer);
  if (!flashcards || flashcards.length === 0) {
    addProblem(filePath, getLineForOffset(sourceFile, flashcardsProperty.getStart(sourceFile)), `${context} has no flashcards`);
    return;
  }

  const seenLessonWordPairs = new Map();

  flashcards.forEach((entry, entryIndex) => {
    if (!ts.isObjectLiteralExpression(entry)) {
      addProblem(filePath, getLineForOffset(sourceFile, entry.getStart(sourceFile)), `${context} flashcard entry ${entryIndex + 1} must be an object`);
      return;
    }

    const wordsProperty = getProperty(entry, 'words');
    if (!wordsProperty) {
      validateWordObject(filePath, sourceFile, entry, `${context} flashcard ${entryIndex + 1}`);
      return;
    }

    requireStringProperty(filePath, sourceFile, entry, 'category', `${context} flashcard group ${entryIndex + 1}`);
    const seenEnglishWords = new Map();
    const seenWordPairs = new Map();

    const words = getArrayElements(wordsProperty.initializer);
    if (!words || words.length === 0) {
      addProblem(filePath, getLineForOffset(sourceFile, wordsProperty.getStart(sourceFile)), `${context} flashcard group ${entryIndex + 1} has no words`);
      return;
    }

    words.forEach((word, wordIndex) => {
      if (!ts.isObjectLiteralExpression(word)) {
        addProblem(filePath, getLineForOffset(sourceFile, word.getStart(sourceFile)), `${context} word ${wordIndex + 1} must be an object`);
        return;
      }

      const { english, french } = validateWordObject(filePath, sourceFile, word, `${context} group ${entryIndex + 1}`);
      if (!english || !french) return;

      const englishKey = english.trim().toLowerCase();
      const pairKey = normalizeWordPairKey(english, french);

      if (seenEnglishWords.has(englishKey)) {
        addProblem(
          filePath,
          getLineForOffset(sourceFile, word.getStart(sourceFile)),
          `${context} group ${entryIndex + 1} repeats English word "${english}" also seen at word ${seenEnglishWords.get(englishKey)}`
        );
      } else {
        seenEnglishWords.set(englishKey, wordIndex + 1);
      }

      if (seenWordPairs.has(pairKey)) {
        addProblem(
          filePath,
          getLineForOffset(sourceFile, word.getStart(sourceFile)),
          `${context} group ${entryIndex + 1} repeats the same word pair as word ${seenWordPairs.get(pairKey)}`
        );
      } else {
        seenWordPairs.set(pairKey, wordIndex + 1);
      }

      if (seenLessonWordPairs.has(pairKey)) {
        const first = seenLessonWordPairs.get(pairKey);
        addProblem(
          filePath,
          getLineForOffset(sourceFile, word.getStart(sourceFile)),
          `${context} repeats word pair "${english} / ${french}" also seen in group ${first.group} word ${first.word}`
        );
      } else {
        seenLessonWordPairs.set(pairKey, { group: entryIndex + 1, word: wordIndex + 1 });
      }
    });
  });
};

const validateExerciseObject = (filePath, sourceFile, objectNode) => {
  const type = getStringValue(getProperty(objectNode, 'type')?.initializer);
  const optionsProperty = getProperty(objectNode, 'options');
  const answerProperty = getProperty(objectNode, 'answer');

  if (optionsProperty && answerProperty) {
    const options = requireStringArray(filePath, sourceFile, optionsProperty.initializer, 'Exercise options');
    const answer = getStringValue(answerProperty.initializer);

    if (
      typeof answer === 'string' &&
      options &&
      !options.some((option) => normalizeExerciseSentence(option.value) === normalizeExerciseSentence(answer))
    ) {
      addProblem(
        filePath,
        getLineForOffset(sourceFile, optionsProperty.getStart(sourceFile)),
        'Exercise options must include the string answer'
      );
    }
  }

  if (!type) return;

  if (type === 'translate') {
    requireStringProperty(filePath, sourceFile, objectNode, 'prompt', 'Translate exercise');
    const answer = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'answer', 'Translate exercise');

    const wordBankProperty = getProperty(objectNode, 'wordBank');
    if (wordBankProperty) {
      const wordBank = requireStringArray(filePath, sourceFile, wordBankProperty.initializer, 'Translate exercise wordBank');
      if (answer && wordBank) {
        addMissingAnswerTokenProblems(
          filePath,
          getLineForOffset(sourceFile, wordBankProperty.getStart(sourceFile)),
          'Translate exercise',
          answer.value,
          wordBank.map((item) => item.value),
          'wordBank'
        );
      }
    }
  }

  if (type === 'reorder') {
    requireStringProperty(filePath, sourceFile, objectNode, 'question', 'Reorder exercise');
    const answer = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'answer', 'Reorder exercise');
    const wordsProperty = getProperty(objectNode, 'words');
    let words = null;

    if (!wordsProperty) {
      addProblem(filePath, getLineForOffset(sourceFile, objectNode.getStart(sourceFile)), 'Reorder exercise is missing "words"');
    } else {
      words = requireStringArray(filePath, sourceFile, wordsProperty.initializer, 'Reorder exercise words');
    }

    if (answer && words) {
      const joinedWords = words.map((item) => item.value).join(' ');
      if (normalizeExerciseSentence(joinedWords) !== normalizeExerciseSentence(answer.value)) {
        addProblem(
          filePath,
          getLineForOffset(sourceFile, wordsProperty.getStart(sourceFile)),
          'Reorder exercise words must reconstruct the answer in order'
        );
      }
    }

    const reorderWordBankProperty = getProperty(objectNode, 'reorderWordBank');
    if (reorderWordBankProperty) {
      const reorderWordBank = validateReorderWordBank(
        filePath,
        sourceFile,
        reorderWordBankProperty.initializer,
        'Reorder exercise reorderWordBank'
      );

      if (answer && reorderWordBank) {
        addMissingAnswerTokenProblems(
          filePath,
          getLineForOffset(sourceFile, reorderWordBankProperty.getStart(sourceFile)),
          'Reorder exercise',
          answer.value,
          reorderWordBank,
          'reorderWordBank'
        );
      }
    }
  }

};

const validateChapterLink = (filePath, sourceFile, objectNode, context, lessonCatalog) => {
  const label = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'label', `${context} app link`);
  if (label) validateMaxLength(filePath, label.line, `${context} app link label`, label.value, maxChapterLinkLabelLength);

  const lessonTitle = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'lessonTitle', `${context} app link`);

  const targetProperty = getProperty(objectNode, 'target');
  const target = targetProperty ? getStringValue(targetProperty.initializer) : null;
  if (!target || !allowedChapterTargets.has(target)) {
    const line = targetProperty ? getLineForOffset(sourceFile, targetProperty.getStart(sourceFile)) : getLineForOffset(sourceFile, objectNode.getStart(sourceFile));
    addProblem(filePath, line, `${context} app link has an invalid target`);
    return;
  }

  if (lessonTitle && !lessonCatalog[target].titles.has(normalizeTitle(lessonTitle.value))) {
    addProblem(
      filePath,
      lessonTitle.line,
      `${context} points to missing ${target} lesson "${lessonTitle.value}"`
    );
  }
};

const validateChapterLesson = (filePath, sourceFile, objectNode, context, lessonCatalog) => {
  const title = getRequiredStringPropertyInfo(filePath, sourceFile, objectNode, 'title', context);
  if (title) validateMaxLength(filePath, title.line, `${context} title`, title.value, maxLessonTitleLength);

  requireStringProperty(filePath, sourceFile, objectNode, 'url', context);

  const appLinksProperty = getProperty(objectNode, 'appLinks');
  if (!appLinksProperty) return;

  const appLinks = getArrayElements(appLinksProperty.initializer);
  if (!appLinks) {
    addProblem(filePath, getLineForOffset(sourceFile, appLinksProperty.getStart(sourceFile)), `${context} appLinks must be an array`);
    return;
  }

  appLinks.forEach((appLink, index) => {
    if (!ts.isObjectLiteralExpression(appLink)) {
      addProblem(filePath, getLineForOffset(sourceFile, appLink.getStart(sourceFile)), `${context} app link ${index + 1} must be an object`);
      return;
    }

    validateChapterLink(filePath, sourceFile, appLink, `${context} app link ${index + 1}`, lessonCatalog);
  });
};

const validateChapterFile = (filePath, sourceFile, lessonCatalog) => {
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node) && getProperty(node, 'lessons') && getProperty(node, 'title')) {
      requireStringProperty(filePath, sourceFile, node, 'title', 'Chapter category');
      requireStringProperty(filePath, sourceFile, node, 'icon', 'Chapter category');
      requireStringProperty(filePath, sourceFile, node, 'color', 'Chapter category');

      const lessonsProperty = getProperty(node, 'lessons');
      const lessons = getArrayElements(lessonsProperty.initializer);
      if (!lessons || lessons.length === 0) {
        addProblem(filePath, getLineForOffset(sourceFile, lessonsProperty.getStart(sourceFile)), 'Chapter category has no lessons');
      } else {
        lessons.forEach((lesson, index) => {
          if (!ts.isObjectLiteralExpression(lesson)) {
            addProblem(filePath, getLineForOffset(sourceFile, lesson.getStart(sourceFile)), `Chapter lesson ${index + 1} must be an object`);
            return;
          }

          validateChapterLesson(filePath, sourceFile, lesson, `Chapter lesson ${index + 1}`, lessonCatalog);
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
};

const validateVocabularyFile = (filePath, sourceFile) => {
  let foundLesson = false;

  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node) && getProperty(node, 'flashcards')) {
      foundLesson = true;
      requireStringProperty(filePath, sourceFile, node, 'id', 'Vocabulary lesson');
      requireStringProperty(filePath, sourceFile, node, 'title', 'Vocabulary lesson');
      requireStringProperty(filePath, sourceFile, node, 'imageUrl', 'Vocabulary lesson');
      validateFlashcards(filePath, sourceFile, node, 'Vocabulary lesson');
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (!foundLesson) {
    addProblem(filePath, 1, 'Vocabulary file does not define a flashcard lesson');
  }
};

const validateContentAst = (filePath, sourceFile, lessonCatalog) => {
  const relativePath = toRelativePath(filePath);

  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      validateExerciseObject(filePath, sourceFile, node);

      const imageUrlProperty = getProperty(node, 'imageUrl');
      if (imageUrlProperty) {
        const value = getStringValue(imageUrlProperty.initializer);
        if (typeof value !== 'string' || value.trim().length === 0) {
          addProblem(filePath, getLineForOffset(sourceFile, imageUrlProperty.getStart(sourceFile)), 'imageUrl must be a non-empty string');
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (relativePath.startsWith('content/vocabulary/')) {
    validateVocabularyFile(filePath, sourceFile);
  }

  if (/^content\/lessons\/.+Chapters\.ts$/.test(relativePath)) {
    validateChapterFile(filePath, sourceFile, lessonCatalog);
  }
};

const validateDecodedText = (filePath, text) => {
  for (const marker of mojibakeMarkers) {
    const index = text.indexOf(marker.value);
    if (index !== -1) {
      addProblem(filePath, getLineForTextOffset(text, index), `Possible encoding damage: ${marker.label}`);
    }
  }

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0x80 && code <= 0x9f) {
      addProblem(filePath, getLineForTextOffset(text, index), 'Unexpected C1 control character; likely encoding damage');
      return;
    }
  }
};

const scanFiles = scanRoots.flatMap((entry) => collectFiles(path.join(rootDir, entry)));
const parsedContentFiles = [];
const parsedSourceFiles = [];

for (const filePath of scanFiles) {
  const bytes = fs.readFileSync(filePath);
  let text;

  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    addProblem(filePath, 1, 'File is not valid UTF-8');
    continue;
  }

  validateDecodedText(filePath, text);

  if (['.js', '.ts', '.tsx'].includes(path.extname(filePath))) {
    const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    parsedSourceFiles.push({ filePath, sourceFile });

    if (filePath.startsWith(contentDir)) {
      parsedContentFiles.push({ filePath, sourceFile });
    }
  }
}

const lessonCatalog = buildLessonCatalog(parsedContentFiles);
const thumbnailRegistries = parsedSourceFiles
  .filter((item) => assetIndexPaths.includes(item.filePath))
  .map((item) => ({
    filePath: item.filePath,
    thumbnailKeys: validateAssetRegistry(item.filePath, item.sourceFile),
  }));
const registeredVocabularyFiles = collectRegisteredVocabularyFiles(parsedSourceFiles);
const difficultyMapKeys = collectDifficultyMapKeys(parsedSourceFiles);

validateRegisteredVocabularyMetadata(
  lessonCatalog,
  registeredVocabularyFiles,
  thumbnailRegistries,
  difficultyMapKeys
);

for (const { filePath, sourceFile } of parsedContentFiles) {
  validateContentAst(filePath, sourceFile, lessonCatalog);
}

if (problems.length > 0) {
  console.error('Content validation failed:');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Content validation passed (${scanFiles.length} files checked).`);
