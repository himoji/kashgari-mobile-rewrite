import type { ExpoConfig } from 'expo/config';

const IS_DEV = process.env.EXPO_PUBLIC_MODE === 'development';

const config: ExpoConfig = {
  owner: 'kashgari',
  name: 'Oqu Dana Tiin',
  slug: 'kashgari-mobile',
  version: '0.5.0',
  orientation: 'portrait',
  icon: './assets/images/ios-light.png',
  scheme: 'oqudanatiin',
  userInterfaceStyle: 'light',
  runtimeVersion: { policy: 'fingerprint' },
  android: {
    package: 'com.kashgari.oqudanatiin',
    googleServicesFile: './google-services.json',
    permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS'],
    blockedPermissions: ['android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'danatiin.kashgari.kz', pathPrefix: '/link/' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.kashgari.oqudanatiin',
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false },
    requireFullScreen: true,
    icon: { light: './assets/images/ios-light.png', dark: './assets/images/ios-dark.png' },
    appleTeamId: 'LZ26J9396G',
    associatedDomains: ['applinks:danatiin.kashgari.kz'],
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          enableProguardInReleaseBuilds: true,
          extraProguardRules: '-keep public class com.horcrux.svg.** {*;}',
          allowBackup: false,
        },
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: 'com.googleusercontent.apps.569137623763-3apn2k7fnui2dvqq22dc73730gb37l6l' },
    ],
    'expo-secure-store',
    'expo-apple-authentication',
    'expo-audio',
    'expo-notifications',
    'expo-font',
    [
      'expo-splash-screen',
      { backgroundColor: '#FFFFFF', image: './assets/images/splash-logo.png', imageWidth: 180 },
    ],
    './plugins/withFmtFix',
    './plugins/gradleProperties',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { eas: { projectId: 'df37eb54-a328-4695-9da2-c33eb9913866' } },
  updates: IS_DEV
    ? { enabled: false }
    : {
        url: 'https://expo-updates.danatiin.kashgari.kz/manifest',
        checkAutomatically: 'ON_LOAD',
        codeSigningMetadata: { keyid: 'main', alg: 'rsa-v1_5-sha256' },
        codeSigningCertificate: './certs/certificate.pem',
        enabled: true,
        requestHeaders: { 'expo-channel-name': process.env.EXPO_PUBLIC_RELEASE_CHANNEL ?? '' },
      },
};

export default config;
