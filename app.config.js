// Extends app.json with values that come from .env.
//
// Google Sign-In runs WITHOUT Firebase. In that mode the config plugin needs `iosUrlScheme`
// (the iOS OAuth client ID reversed). Without options it falls back to Firebase mode, which
// requires GoogleService-Info.plist / google-services.json and breaks native builds.
const GOOGLE_SIGNIN_PLUGIN = '@react-native-google-signin/google-signin';

// "1234-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.1234-abc"
const reverseClientId = (clientId) => `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;

module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const plugins = (config.plugins || []).flatMap((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (name !== GOOGLE_SIGNIN_PLUGIN) return [plugin];
    if (!iosClientId) {
      console.warn(
        '[app.config] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set: Google Sign-In will be disabled on iOS (Android is unaffected).',
      );
      return [];
    }
    return [[GOOGLE_SIGNIN_PLUGIN, { iosUrlScheme: reverseClientId(iosClientId) }]];
  });

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || config.extra?.webClientId,
      googleIosClientId: iosClientId,
    },
  };
};
