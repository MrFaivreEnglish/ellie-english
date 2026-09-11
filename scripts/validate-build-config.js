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

// OTA updates are intentionally enabled: students install the APK by hand, so an
// over-the-air update is the only way a fix reaches them without a reinstall.
// Guard the pieces that silently break delivery rather than the feature itself.
const updates = appJson?.expo?.updates;
if (updates?.enabled !== true) {
  problems.push('app.json: expo.updates.enabled should be true so OTA updates reach sideloaded APKs');
} else {
  const easProjectId = appJson?.expo?.extra?.eas?.projectId;
  const expectedUrl = `https://u.expo.dev/${easProjectId}`;
  if (updates.url !== expectedUrl) {
    problems.push(`app.json: expo.updates.url should be ${expectedUrl}, got ${JSON.stringify(updates.url)}`);
  }
  // runtimeVersion must be a fixed string, not the fingerprint policy. Under
  // fingerprint, an unrelated `npm install` can shift a native dependency, the
  // hash changes, and updates silently stop reaching APKs already in students'
  // hands -- which happened once and cost a rebuild. A fixed string keeps
  // updates flowing; bump it by hand (and rebuild the APK) only when native
  // code actually changes: a new native module, or an Expo SDK upgrade.
  const runtimeVersion = appJson?.expo?.runtimeVersion;
  if (!runtimeVersion) {
    problems.push('app.json: expo.runtimeVersion is required when updates are enabled');
  } else if (typeof runtimeVersion !== 'string') {
    problems.push(
      'app.json: expo.runtimeVersion must be a fixed string, got ' +
        JSON.stringify(runtimeVersion) +
        ' - a policy lets the runtime drift and orphan installed APKs'
    );
  }
  for (const profile of ['preview', 'production']) {
    if (!easJson?.build?.[profile]?.channel) {
      problems.push(`eas.json: build.${profile} needs a "channel" or that build can never receive updates`);
    }
  }
}

// Follows `npm run <script>` indirection so the check is on what predeploy effectively
// runs, not on the literal string — predeploy delegates to build:web, and the guarantee
// that matters is that the fix script runs somewhere in that chain.
const expandNpmScript = (name, scripts, seen = new Set()) => {
  if (!scripts?.[name] || seen.has(name)) return '';
  seen.add(name);

  return scripts[name].replace(/npm run ([\w:-]+)/g, (match, referenced) =>
    `${match} ${expandNpmScript(referenced, scripts, seen)}`
  );
};

const effectivePredeploy = expandNpmScript('predeploy', packageJson?.scripts);
if (packageJson?.scripts?.predeploy && !effectivePredeploy.includes('scripts/fix-web-base-path.js')) {
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
