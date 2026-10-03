// Flags lessons that are new or changed since the last update, so the app can
// show a "New" / "Updated" badge on them. Run automatically by `npm run ota`.
//
// It fingerprints every registered vocabulary and grammar lesson and compares
// against content/lessons/lessonSnapshot.json (the state at the previous run):
//   - a lesson id that wasn't there before      -> "new"
//   - a lesson whose content changed            -> "updated"
// then writes the badges to content/lessons/lessonHighlights.json and saves the
// new snapshot. Vocabulary is compared on its word pairs only, so moving words
// between groups or renaming a group doesn't count as a change. Grammar is
// compared on the whole file minus comments, whitespace and the sheet URL.
//
//   node scripts/mark-lesson-changes.js --check      report, write nothing
//   node scripts/mark-lesson-changes.js              apply
//   node scripts/mark-lesson-changes.js --snapshot-only [--ref <git ref>]
//        just record a baseline (from the working tree, or from a git ref)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(REPO, 'content', 'lessons', 'lessonSnapshot.json');
const HIGHLIGHTS = path.join(REPO, 'content', 'lessons', 'lessonHighlights.json');
// Keep in sync with LESSON_HIGHLIGHT_DAYS in content/lessons/lessonHighlights.ts.
const HIGHLIGHT_DAYS = 30;

const args = process.argv.slice(2);
const check = args.includes('--check');
const snapshotOnly = args.includes('--snapshot-only');
const refIndex = args.indexOf('--ref');
const ref = refIndex >= 0 ? args[refIndex + 1] : null;

const read = (relPath) =>
  ref
    ? execFileSync('git', ['show', `${ref}:${relPath}`], { cwd: REPO, encoding: 'utf8' })
    : fs.readFileSync(path.join(REPO, relPath), 'utf8');

const hash = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const vocabularyFingerprint = (src) =>
  hash(
    [...stripComments(src).matchAll(/english:\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,\s*french:\s*(['"`])((?:\\.|(?!\3).)*)\3/g)]
      .map((m) => `${m[2].trim().toLowerCase()}|${m[4].trim().toLowerCase()}`)
      .sort()
      .join('\n')
  );

const grammarFingerprint = (src) =>
  hash(
    stripComments(src)
      .replace(/imageUrl:\s*(['"`]).*?\1,?/g, '')
      .replace(/\s+/g, '')
  );

// Only lessons the app actually lists: the files imported by each registry.
const sections = {
  vocabulary: { registry: 'content/lessons/vocabularyRegistry.ts', dir: 'content/vocabulary', fingerprint: vocabularyFingerprint },
  grammar: { registry: 'content/lessons/grammarRegistry.ts', dir: 'content/grammar', fingerprint: grammarFingerprint },
};

const collect = () => {
  const result = {};
  for (const [section, { registry, dir, fingerprint }] of Object.entries(sections)) {
    const dirName = path.basename(dir);
    const files = [...read(registry).matchAll(new RegExp(`from '\\.\\./${dirName}/([^']+)'`, 'g'))].map((m) => m[1]);
    result[section] = {};
    for (const file of files) {
      const src = read(`${dir}/${file}.ts`);
      const id = (src.match(/^\s*id:\s*['"]([^'"]+)['"]/m) || [])[1];
      const title = (src.match(/^\s*title:\s*(['"])(.*?)\1/m) || [])[2] || file;
      if (!id) continue;
      result[section][id] = { title, fingerprint: fingerprint(src) };
    }
  }
  return result;
};

const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

const current = collect();
const snapshot = Object.fromEntries(
  Object.entries(current).map(([section, lessons]) => [
    section,
    Object.fromEntries(Object.entries(lessons).map(([id, { fingerprint }]) => [id, fingerprint])),
  ])
);

if (snapshotOnly) {
  writeJson(SNAPSHOT, snapshot);
  console.log(`Recorded a baseline of ${Object.values(snapshot).reduce((n, s) => n + Object.keys(s).length, 0)} lessons${ref ? ` from ${ref}` : ''}.`);
  process.exit(0);
}

const previous = readJson(SNAPSHOT, null);
if (!previous) {
  console.error('No lessonSnapshot.json yet. Record a baseline first: node scripts/mark-lesson-changes.js --snapshot-only');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const cutoff = Date.now() - HIGHLIGHT_DAYS * 24 * 60 * 60 * 1000;
const highlights = readJson(HIGHLIGHTS, {});
const changes = [];

for (const [section, lessons] of Object.entries(current)) {
  // Drop expired badges and ones for lessons that no longer exist.
  const kept = Object.fromEntries(
    Object.entries(highlights[section] ?? {}).filter(([id, h]) => lessons[id] && Date.parse(h.since) >= cutoff)
  );

  for (const [id, { title, fingerprint }] of Object.entries(lessons)) {
    const before = previous[section]?.[id];
    if (before === fingerprint) continue;

    // A lesson edited while it's still badged "new" stays "new".
    const kind = !before || kept[id]?.kind === 'new' ? 'new' : 'updated';
    kept[id] = { kind, since: today };
    changes.push(`  ${kind === 'new' ? 'NEW    ' : 'UPDATED'} ${section.padEnd(10)} ${id.padEnd(5)} ${title}`);
  }

  highlights[section] = Object.fromEntries(Object.entries(kept).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })));
}

console.log(changes.length ? `Lesson badges:\n${changes.join('\n')}` : 'No new or changed lessons since the last update.');

if (!check) {
  writeJson(HIGHLIGHTS, highlights);
  writeJson(SNAPSHOT, snapshot);
}
