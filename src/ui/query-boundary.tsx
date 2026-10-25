import type { DocumentNode } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { Component, createContext, Suspense, useContext, useState, useTransition, type ReactNode } from 'react';

import { ErrorState, ScreenSkeleton } from '@/ui/feedback';

type CatchProps = { children: ReactNode; onRetry: () => void; render?: (retry: () => void) => ReactNode };

class Catch extends Component<CatchProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    // Both updates land in one render, so the children retry with the new key.
    const retry = () => {
      this.props.onRetry();
      this.setState({ failed: false });
    };
    return this.props.render ? this.props.render(retry) : <ErrorState onRetry={retry} />;
  }
}

const Attempt = createContext(0);

/**
 * Wraps the part of a screen that reads `useSuspenseQuery`: the fallback while it loads, an error
 * state with retry when it fails. Keep the screen's chrome (title, back bar) outside, so only the
 * data area changes. Full-screen routes with no chrome outside pass `errorFallback` to keep their
 * own page (and its back button) around the error.
 */
export function QueryBoundary({
  children,
  fallback = <ScreenSkeleton />,
  errorFallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: (retry: () => void) => ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <Catch onRetry={() => setAttempt((n) => n + 1)} render={errorFallback}>
      <Attempt.Provider value={attempt}>
        <Suspense fallback={fallback}>{children}</Suspense>
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
 */
export function useRefresh(...queries: DocumentNode[]) {
  const client = useApolloClient();
  const [refreshing, startTransition] = useTransition();
  const refresh = () =>
    startTransition(async () => {
      await client.refetchQueries({ include: queries }).catch(() => undefined);
    });
  return { refreshing, refresh };
}
