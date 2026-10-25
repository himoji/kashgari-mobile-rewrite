import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * Whether the device can reach the internet. Unknown counts as online, so a slow first check never
 * shows the offline banner or copy.
 */
export const useNetwork = create<{ online: boolean }>(() => ({ online: true }));

const isOnline = (state: NetInfoState) => state.isConnected !== false && state.isInternetReachable !== false;

NetInfo.addEventListener((state) => {
  const online = isOnline(state);
  if (online !== useNetwork.getState().online) useNetwork.setState({ online });
});

// NetInfo's web module follows `navigator.connection` where the browser has it, and that does not
// report losing the network everywhere; the window's online/offline events do.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const sync = () => useNetwork.setState({ online: navigator.onLine });
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
}

export const useOnline = () => useNetwork((s) => s.online);

/** Runs `listener` each time the device comes back online. Returns the unsubscribe. */
export function onReconnect(listener: () => void) {
  return useNetwork.subscribe((state, prev) => {
    if (state.online && !prev.online) listener();
  });
}
