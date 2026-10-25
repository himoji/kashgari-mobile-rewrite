import { useEffect } from 'react';
import { Platform } from 'react-native';

/** On web, Escape closes the dialog or sheet (native uses the back gesture instead). */
export function useEscape(onClose: (() => void) | undefined, active = true) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !onClose || !active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, active]);
}
