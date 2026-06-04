#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const problems = [];

const readJson = (relativePath) => {
  const filePath = path.join(rootDir, relativePath);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    problems.push(`${relativePath}: could not parse JSON (${error.message})`);
    return null;
  }
};

const hasNativeProject = (platform) => fs.existsSync(path.join(rootDir, platform));
const appJson = readJson('app.json');
const packageJson = readJson('package.json');
const easJson = readJson('eas.json');

if (appJson?.expo && packageJson?.version && appJson.expo.version !== packageJson.version) {
  problems.push(`app.json: expo.version (${appJson.expo.version}) must match package.json version (${packageJson.version})`);
}

if (appJson?.expo && hasNativeProject('android') && appJson.expo.android) {
  problems.push('app.json: remove expo.android or sync it manually because android/ exists and EAS will not apply it automatically');
}

if (appJson?.expo && hasNativeProject('ios') && appJson.expo.ios) {
  problems.push('app.json: remove expo.ios or sync it manually because ios/ exists and EAS will not apply it automatically');
}

const previewBuildType = easJson?.build?.preview?.android?.buildType;
if (previewBuildType !== 'apk') {
  problems.push(`eas.json: preview.android.buildType should be "apk" for tester APK builds, got ${JSON.stringify(previewBuildType)}`);
}

const productionBuildType = easJson?.build?.production?.android?.buildType;
if (productionBuildType !== 'app-bundle') {
  problems.push(`eas.json: production.android.buildType should be "app-bundle", got ${JSON.stringify(productionBuildType)}`);
}

if (appJson?.expo?.updates?.enabled !== false) {
  problems.push('app.json: expo.updates.enabled should stay false unless OTA updates are intentionally restored');
}

if (problems.length > 0) {
  console.error('Build config validation failed:');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log('Build config validation passed.');
