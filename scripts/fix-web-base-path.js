#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const configuredBasePath = process.env.EXPO_WEB_BASE_PATH || process.env.WEB_BASE_PATH || '.';

const normalizeBasePath = (value) => {
  const trimmed = String(value || '.').trim();
  if (!trimmed || trimmed === '.') return '.';

  const withoutTrailingSlash = trimmed.replace(/\/+$/g, '');
  if (!withoutTrailingSlash || withoutTrailingSlash === '.') return '.';
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
};

const basePath = normalizeBasePath(configuredBasePath);
const withBasePath = (absolutePath) => (
  basePath === '.'
    ? `.${absolutePath}`
    : `${basePath}${absolutePath}`
);

// iOS Safari's "Add to Home Screen" ignores favicon.ico and needs apple-touch-icon
// specifically — without it, iOS screenshots the page itself as the icon. Expo's Metro web
// export has no built-in step for this (unlike the favicon, which it does generate), so it's
// injected here alongside the same base-path rewriting the rest of this script already does.
// theme-color is already injected by Expo itself from app.json's web.themeColor.
//
// The manifest is the same story for Chrome/Android: the Metro web export emits none, so
// app.json's web.name / shortName / display never reach an installed shortcut. public/
// is copied into dist verbatim, so both the manifest and its icons ship from there.
const HOME_SCREEN_TAGS = [
  '<link rel="apple-touch-icon" href="APPLE_TOUCH_ICON_HREF"/>',
  '<meta name="apple-mobile-web-app-title" content="Ellie"/>',
  '<meta name="apple-mobile-web-app-capable" content="yes"/>',
  '<meta name="mobile-web-app-capable" content="yes"/>',
  '<link rel="manifest" href="MANIFEST_HREF"/>',
].join('');

const injectHomeScreenTags = (text) => {
  if (!text.includes('</head>') || text.includes('apple-touch-icon')) return text;

  const tags = HOME_SCREEN_TAGS
    .replace('APPLE_TOUCH_ICON_HREF', withBasePath('/apple-touch-icon.png'))
    .replace('MANIFEST_HREF', withBasePath('/manifest.json'));
  return text.replace('</head>', `${tags}</head>`);
};

const rewriteText = (text) => injectHomeScreenTags(
  text
    .replace(/(["'`])\/(_expo|assets)\//g, (_match, quote, folder) => `${quote}${withBasePath(`/${folder}/`)}`)
    .replace(/(["'`])\/favicon\.ico/g, (_match, quote) => `${quote}${withBasePath('/favicon.ico')}`)
);

const walk = (entryPath, files = []) => {
  if (!fs.existsSync(entryPath)) return files;

  const stats = fs.statSync(entryPath);
  if (stats.isDirectory()) {
    for (const entry of fs.readdirSync(entryPath)) {
      walk(path.join(entryPath, entry), files);
    }
    return files;
  }

  if (['.html', '.js', '.css', '.json'].includes(path.extname(entryPath))) {
    files.push(entryPath);
  }

  return files;
};

if (!fs.existsSync(distDir)) {
  console.error('dist does not exist. Run expo export before fixing web asset paths.');
  process.exit(1);
}

let changedCount = 0;

for (const filePath of walk(distDir)) {
  const original = fs.readFileSync(filePath, 'utf8');
  const rewritten = rewriteText(original);

  if (rewritten !== original) {
    fs.writeFileSync(filePath, rewritten);
    changedCount += 1;
  }
}

console.log(`Web asset paths fixed for base path ${JSON.stringify(basePath)} (${changedCount} files changed).`);
