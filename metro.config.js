// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('html');

// Fix for react-native-webrtc event-target-shim warning
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('event-target-shim') && moduleName.endsWith('/index')) {
    const newModuleName = moduleName.replace(/\/index$/, '');
    return context.resolveRequest(context, newModuleName, platform);
  }
  // Call the default resolver instead of a recursive call to self
  return null; // Returning null in resolveRequest tells Metro to use the default resolver logic
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = withNativeWind(config, { input: './global.css' });
