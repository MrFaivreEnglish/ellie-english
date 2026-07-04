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

const rewriteText = (text) => text
  .replace(/(["'`])\/(_expo|assets)\//g, (_match, quote, folder) => `${quote}${withBasePath(`/${folder}/`)}`)
  .replace(/(["'`])\/favicon\.ico/g, (_match, quote) => `${quote}${withBasePath('/favicon.ico')}`);

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
