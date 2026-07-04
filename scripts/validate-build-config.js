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

const readText = (relativePath) => {
  const filePath = path.join(rootDir, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    problems.push(`${relativePath}: could not read file (${error.message})`);
    return null;
  }
};

const hasNativeProject = (platform) => fs.existsSync(path.join(rootDir, platform));
const appJson = readJson('app.json');
const packageJson = readJson('package.json');
const easJson = readJson('eas.json');
const androidBuildGradle = hasNativeProject('android') ? readText('android/app/build.gradle') : null;
const androidManifest = hasNativeProject('android') ? readText('android/app/src/main/AndroidManifest.xml') : null;
const gitlabCi = fs.existsSync(path.join(rootDir, '.gitlab-ci.yml')) ? readText('.gitlab-ci.yml') : null;

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

if (packageJson?.scripts?.predeploy && !packageJson.scripts.predeploy.includes('scripts/fix-web-base-path.js')) {
  problems.push('package.json: predeploy must run scripts/fix-web-base-path.js after expo export so GitHub Pages subpaths work');
}

if (gitlabCi && gitlabCi.includes('npx expo export --platform web')) {
  problems.push('.gitlab-ci.yml: use npm run predeploy so exported web asset paths are post-processed');
}

if (androidBuildGradle) {
  const buildTypesStart = androidBuildGradle.indexOf('buildTypes');
  const buildTypesText = buildTypesStart >= 0 ? androidBuildGradle.slice(buildTypesStart) : '';
  const releaseBuildType = buildTypesText.match(/release\s*\{([\s\S]*?)\n\s{8}\}/)?.[1] ?? '';

  if (/signingConfig\s+signingConfigs\.debug/.test(releaseBuildType)) {
    problems.push('android/app/build.gradle: release builds must not use signingConfigs.debug');
  }

  if (/versionCode\s+1\b/.test(androidBuildGradle)) {
    problems.push('android/app/build.gradle: versionCode must be configurable and not fixed at 1');
  }
}

if (androidManifest) {
  const blockedPermissions = [
    'android.permission.CAMERA',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.RECORD_AUDIO',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.WRITE_EXTERNAL_STORAGE',
  ];

  for (const permission of blockedPermissions) {
    const permissionRegex = new RegExp(`<uses-permission[^>]+android:name="${permission.replace(/\./g, '\\.')}"[^>]*>`, 'g');
    const declarations = androidManifest.match(permissionRegex) || [];
    const requestedDeclarations = declarations.filter((declaration) => !declaration.includes('tools:node="remove"'));

    if (requestedDeclarations.length > 0) {
      problems.push(`android/app/src/main/AndroidManifest.xml: remove unused permission ${permission}`);
    }
  }

  if (/android:allowBackup="true"/.test(androidManifest)) {
    problems.push('android/app/src/main/AndroidManifest.xml: android:allowBackup must stay false because the app stores account sessions locally');
  }

  const audioServiceDeclarations = androidManifest.match(/<service[^>]+AudioControlsService[^>]*>/g) || [];
  if (audioServiceDeclarations.some((declaration) => !declaration.includes('tools:node="remove"'))) {
    problems.push('android/app/src/main/AndroidManifest.xml: remove expo audio foreground service unless background media playback is intentionally restored');
  }
}

if (problems.length > 0) {
  console.error('Build config validation failed:');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log('Build config validation passed.');
