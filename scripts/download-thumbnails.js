#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const thumbnailsDir = path.resolve(__dirname, '..', 'assets', 'thumbnails');
const indexFile = path.resolve(__dirname, '..', 'assets', 'index.js');

function toTitleCase(str) {
  return str
    .split(/\s+/)
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
    .trim();
}

function sanitizeBaseName(fileName) {
  let base = fileName.replace(/\.[^/.]+$/, '');
  base = base.replace(/thumbnail/gi, '').trim();
  const slug = base
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  return { base: base.trim(), slug };
}

function downloadUrlToFile(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      // follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadUrlToFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Failed to download ' + url + ' (status ' + res.statusCode + ')'));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(resolve));
      fileStream.on('error', (err) => {
        try { fs.unlinkSync(dest); } catch (e) {}
        reject(err);
      });
    }).on('error', (err) => reject(err));
  });
}

(async () => {
  console.log('Starting thumbnail downloader...');

  if (!fs.existsSync(thumbnailsDir)) {
    console.error('thumbnails directory not found at', thumbnailsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(thumbnailsDir).filter(f => fs.statSync(path.join(thumbnailsDir, f)).isFile());
  const downloads = [];

  for (const f of files) {
    const fullPath = path.join(thumbnailsDir, f);
    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8').trim();
    } catch (err) {
      console.warn('Unable to read', fullPath, err.message);
      continue;
    }

    if (!content.startsWith('http')) {
      console.log('Skipping', f, '- not a remote URL file. (If this is already a PNG, it will be ignored)');
      continue;
    }

    const { base, slug } = sanitizeBaseName(f);
    const destFile = `${slug}-thumbnail.png`;
    const destPath = path.join(thumbnailsDir, destFile);

    if (fs.existsSync(destPath)) {
      console.log('Exists:', destFile, '- skipping download');
      downloads.push({ lessonName: toTitleCase(base), destFile });
      continue;
    }

    console.log(`Downloading ${content} -> ${destFile}`);
    try {
      await downloadUrlToFile(content, destPath);
      console.log('Downloaded', destFile);
      downloads.push({ lessonName: toTitleCase(base), destFile });
    } catch (err) {
      console.error('Failed to download', content, err.message);
    }
  }

  if (downloads.length === 0) {
    console.log('No new thumbnails downloaded. Exiting.');
    return;
  }

  // Safely update assets/index.js: replace the lessonThumbnails: { ... } block with require() entries
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  const parts = indexContent.split(/lessonThumbnails\s*:\s*{/);
  if (parts.length < 2) {
    console.error('Could not locate lessonThumbnails section in assets/index.js — aborting update.');
    process.exit(1);
  }

  const before = parts[0];

  const mappingEntries = downloads
    .map(d => `    '${d.lessonName}': require('./thumbnails/${d.destFile}'),`)
    .join('\n');

  const newIndex = before + 'lessonThumbnails: {\n' + mappingEntries + '\n  }\n};\n';

  fs.writeFileSync(indexFile, newIndex, 'utf8');
  console.log('Wrote updated assets/index.js with local require() references to thumbnails.');

  console.log('Done. You can now run your app — the thumbnails will be required as local assets.');
})();