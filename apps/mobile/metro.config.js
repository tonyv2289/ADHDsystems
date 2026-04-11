// ============================================
// METRO CONFIG — Monorepo setup
// Allows Metro to resolve @momentum/shared
// from packages/shared/src (TypeScript source)
// ============================================

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so Metro sees packages/shared/src/**
config.watchFolders = [monorepoRoot];

// 2. Let Metro find packages in both the app's node_modules AND
//    the root node_modules (where npm workspaces hoists @momentum/shared)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Allow symlinks (npm workspaces creates @momentum/shared as a symlink)
config.resolver.unstable_enableSymlinks = true;

// 4. Allow Babel to transpile @momentum/shared TypeScript source
//    (Metro skips node_modules by default; we carve out an exception)
const { transformer } = config;
config.transformer = {
  ...transformer,
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@momentum/shared|' +
      'react-native|' +
      '@react-native(-community)?|' +
      'expo(nent)?|' +
      '@expo(nent)?/.*|' +
      '@expo-google-fonts/.*|' +
      'react-navigation|' +
      '@react-navigation/.*|' +
      '@unimodules/.*|' +
      'unimodules|' +
      'sentry-expo|' +
      'native-base|' +
      'react-native-svg' +
    '))',
  ],
};

module.exports = config;
