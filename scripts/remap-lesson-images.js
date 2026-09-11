// Repoints lesson sheet URLs at whatever host lesson-images/upload-plan.json
// describes. Lesson sheets used to live on imgbb, which deleted nine of them
// without notice; they now live in Supabase Storage under a random prefix so
// the library cannot be enumerated by anyone who happens to see one URL.
//
// The URLs are plain strings in the content files rather than calls into a
// shared helper, because the grammar content files are otherwise import-free
// data. This script is the indirection instead: run it again to move hosts.
//
//   node scripts/remap-lesson-images.js --check   report what would change
//   node scripts/remap-lesson-images.js           apply

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const PLAN = path.join(REPO, 'lesson-images', 'upload-plan.json');
const BASE =
  'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/';

const check = process.argv.includes('--check');

if (!fs.existsSync(PLAN)) {
  console.error('missing ' + PLAN + ' - run the upload planner first');
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
const remap = new Map();
for (const row of plan.rows) {
  if (row.url && row.target) remap.set(row.url, BASE + encodeURI(row.target));
}

const targets = [
  'content/grammar',
  'content/vocabulary',
  'content/pronunciation',
  'content/lessons',
  'features/vocabulary',
];

const files = [];
const walk = (dir) => {
  const full = path.join(REPO, dir);
  if (!fs.existsSync(full)) return;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (/\.tsx?$/.test(entry.name)) files.push(rel);
  }
};
targets.forEach(walk);

let changedFiles = 0;
let changedUrls = 0;
const untouched = new Set(remap.keys());
// Collected from the post-remap text, so --check reports the state the run
// would leave behind rather than the state it started from.
const stillImgbb = [];

for (const rel of files) {
  const abs = path.join(REPO, rel);
  const before = fs.readFileSync(abs, 'utf8');
  let after = before;

  for (const [from, to] of remap) {
    if (after.includes(from)) {
      after = after.split(from).join(to);
      untouched.delete(from);
      changedUrls++;
    }
  }

  if (after !== before) {
    changedFiles++;
    if (!check) fs.writeFileSync(abs, after);
    console.log((check ? 'would update  ' : 'updated       ') + rel);
  }

  for (const m of after.matchAll(/https:\/\/i\.ibb\.co\/[A-Za-z0-9./_%-]+/g)) {
    stillImgbb.push(rel + '  ' + m[0]);
  }
}

console.log('');
console.log('files ' + (check ? 'to change' : 'changed') + ' : ' + changedFiles);
console.log('urls  ' + (check ? 'to change' : 'changed') + ' : ' + changedUrls);
console.log('plan entries not found in code : ' + untouched.size);
untouched.forEach((u) => console.log('   ' + u));
console.log('imgbb urls still in code       : ' + stillImgbb.length);
stillImgbb.slice(0, 20).forEach((s) => console.log('   ' + s));
if (stillImgbb.length > 20) console.log('   ... and ' + (stillImgbb.length - 20) + ' more');
