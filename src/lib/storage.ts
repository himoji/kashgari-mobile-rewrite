import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * zustand persist does not catch a rejected write: it would surface as an unhandled rejection and
 * the session would quietly be missing on the next start. Retry once; the value is never logged.
 */
async function write(key: string, value: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (Platform.OS === 'web') localStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Keychain busy or locked, or web storage full: try again once.
    }
  }
  if (__DEV__) console.warn(`storage: could not save "${key}"`);
}

/** Zustand persist storage: secure-store on device, localStorage on web. */
export const secureStorage: StateStorage = {
  getItem: (key) =>
    Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: write,
  removeItem: (key) =>
    Platform.OS === 'web' ? localStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};
