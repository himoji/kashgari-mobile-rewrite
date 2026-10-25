import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/** Zustand persist storage: secure-store on device, localStorage on web. */
export const secureStorage: StateStorage = {
  getItem: (key) =>
    Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key, value) =>
    Platform.OS === 'web' ? localStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key) =>
    Platform.OS === 'web' ? localStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};
