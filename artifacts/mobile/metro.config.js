const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude Vite/Vitest and test files from Metro bundler
config.resolver.blockList = /^(.*[\\/]node_modules[\\/].*(vite|vitest).*)$|.*\.(test|spec)\.(ts|tsx|js|jsx)$/;

module.exports = config;
