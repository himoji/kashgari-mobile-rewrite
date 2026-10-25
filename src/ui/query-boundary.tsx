import type { DocumentNode } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { Component, createContext, Suspense, useContext, useState, useTransition, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';

import { contentIn } from '@/lib/motion';
import { useOnline } from '@/lib/network';
import { ErrorState, ScreenSkeleton } from '@/ui/feedback';
import { showToast } from '@/ui/toast';

type CatchProps = {
  children: ReactNode;
  online: boolean;
  onRetry: () => void;
  render?: (retry: () => void) => ReactNode;
};

class Catch extends Component<CatchProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  // Both updates land in one render, so the children retry with the new key.
  retry = () => {
    this.props.onRetry();
    this.setState({ failed: false });
  };
  componentDidUpdate(prev: CatchProps) {
    // Back online: a failed screen loads again without a tap on Retry.
    if (this.state.failed && this.props.online && !prev.online) this.retry();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.render ? this.props.render(this.retry) : <ErrorState onRetry={this.retry} />;
  }
}

const Attempt = createContext(0);

/**
 * The gap of the container a boundary sits in (TabScreen sets its own), so content that renders as a
 * fragment keeps its spacing inside the boundary's fade wrapper.
 */
export const BoundaryGap = createContext(0);

/**
 * Wraps the part of a screen that reads `useSuspenseQuery`: the fallback while it loads, an error
 * state with retry when it fails. Keep the screen's chrome (title, back bar) outside, so only the
 * data area changes. Full-screen routes with no chrome outside pass `errorFallback` to keep their
 * own page (and its back button) around the error. Loaded content fades in (180ms) over the skeleton's place.
 * A failed boundary retries by itself when the device comes back online.
 */
export function QueryBoundary({
  children,
  fallback,
  errorFallback,
  fade = true,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: (retry: () => void) => ReactNode;
  /** Off when the fallback already draws the content's top part (filters, tabs), so it doesn't blink. */
  fade?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const gap = useContext(BoundaryGap);
  const online = useOnline();
  return (
    <Catch online={online} onRetry={() => setAttempt((n) => n + 1)} render={errorFallback}>
      <Attempt.Provider value={attempt}>
        <Suspense fallback={fallback ?? <ScreenSkeleton />}>
          <Animated.View entering={fade ? contentIn : undefined} style={{ flexGrow: 1, gap }}>
            {children}
          </Animated.View>
        </Suspense>
      </Attempt.Provider>
    </Catch>
  );
}

/**
 * Pass as `queryKey` to every `useSuspenseQuery` inside a boundary. Apollo keeps a failed query's
 * error for its key, so a retry needs a fresh key to fetch again.
 */
export const useRetryKey = () => useContext(Attempt);

/**
 * Pull-to-refresh from outside a boundary: refetches the given (mounted) queries in a transition, so
 * their data stays on screen instead of the skeleton, and `refreshing` is true until all finish.
 * A failed refresh keeps the old data and says so in a toast.
 */
export function useRefresh(...queries: DocumentNode[]) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [refreshing, startTransition] = useTransition();
  const refresh = () =>
    startTransition(async () => {
      await client.refetchQueries({ include: queries }).catch(() => showToast(t('common.refreshFailed'), 'error'));
    });
  return { refreshing, refresh };
}
