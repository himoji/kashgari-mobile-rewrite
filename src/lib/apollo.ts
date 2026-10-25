import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { print } from 'graphql';
import { OperationTypeNode } from 'graphql';
import { jwtDecode } from 'jwt-decode';
import { catchError, map, of } from 'rxjs';

import introspection from '@/graphql/possible-types';
import { AUTH_REFRESH } from '@/features/auth/gql';
import { activeCredentials, sameCredentials, useSession, type Credentials } from '@/features/auth/session';
import { env } from '@/lib/env';
import { onReconnect } from '@/lib/network';

/**
 * Per-operation context:
 * - `credentials`: act as a specific account (used at login, before a profile is active).
 * - `language`: content language header without credentials (login mutations).
 * - `auth`: set by the auth link to the credentials the request was sent with; the refresh and
 *   sign-out handling act on these, never on whatever account is active when the response arrives.
 */
declare module '@apollo/client' {
  interface DefaultContext {
    credentials?: Credentials;
    language?: Credentials['language'];
    auth?: Credentials | null;
  }
}

/** True when the access token is gone or about to expire and the refresh token can replace it. */
export function needsRefresh({ accessToken, refreshToken }: Credentials): boolean {
  if (!refreshToken) return false;
  try {
    const { exp } = jwtDecode<{ exp?: number }>(accessToken);
    return !!exp && exp <= Date.now() / 1000 + 30;
  } catch {
    return true;
  }
}

function headersFor(credentials: Credentials | null, language?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'danatiin-language': credentials?.language ?? language ?? 'kk',
  };
  // Demo credentials carry no token: the API serves its demo account to unauthenticated requests.
  if (credentials?.accessToken) headers.authorization = credentials.accessToken;
  return headers;
}

/**
 * The API takes the refresh token as the bearer and answers with a fresh access token in the
 * `new-authorization` header. Only this call carries the refresh token. Resolves to the credentials
 * with the new access token, or as they were when the API gave none (the request then fails with
 * AUTHENTICATION_ERROR and the error link signs out).
 */
async function refresh(credentials: Credentials): Promise<Credentials> {
  try {
    const response = await fetch(env.graphqlUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'danatiin-language': credentials.language,
        authorization: credentials.refreshToken,
      },
      body: JSON.stringify({ query: print(AUTH_REFRESH), variables: { accountId: credentials.accountId } }),
    });
    const token = response.headers.get('new-authorization');
    if (!token) return credentials;
    useSession.getState().updateAccessToken(credentials, token);
    return { ...credentials, accessToken: token };
  } catch {
    return credentials;
  }
}

/** One refresh per login session at a time: parallel requests with an expired token share it. */
const refreshing = new Map<string, Promise<Credentials>>();

export function refreshed(credentials: Credentials): Promise<Credentials> {
  const key = `${credentials.language}:${credentials.accountId}:${credentials.refreshToken}`;
  let pending = refreshing.get(key);
  if (!pending) {
    pending = refresh(credentials).finally(() => refreshing.delete(key));
    refreshing.set(key, pending);
  }
  return pending;
}

const authLink = new SetContextLink(async (prev) => {
  // A login call names its language and must not borrow the active account's token.
  const resolved = prev.credentials ?? (prev.language ? null : activeCredentials());
  const auth = resolved && needsRefresh(resolved) ? await refreshed(resolved) : resolved;
  // `credentials` is also a fetch option for the HTTP link; ours is an account, so it stops here.
  return { credentials: undefined, auth, headers: { ...prev.headers, ...headersFor(auth, prev.language) } };
});

/** The API can also hand out a new access token on an ordinary response. */
const refreshLink = new ApolloLink((operation, forward) =>
  forward(operation).pipe(
    map((result) => {
      const { response, auth } = operation.getContext() as { response?: Response; auth?: Credentials | null };
      const token = response?.headers?.get('new-authorization');
      if (token && auth && token !== auth.accessToken) useSession.getState().updateAccessToken(auth, token);
      return result;
    }),
  ),
);

/** Signs out only when the active account was rejected, not a lookup against another database. */
const errorLink = new ErrorLink(({ error, operation }) => {
  const { auth } = operation.getContext();
  const active = activeCredentials();
  if (
    auth &&
    active &&
    sameCredentials(auth, active) &&
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((e) => e.extensions?.code === 'AUTHENTICATION_ERROR')
  ) {
    useSession.getState().expire();
  }
});

/**
 * A query that cannot reach the API (fetch rejects with a TypeError) answers from the cache when the
 * cache holds all of it, so cache-and-network screens keep their data offline instead of throwing
 * the background refresh's error to their boundary. Server and GraphQL errors pass through.
 */
const offlineLink = new ApolloLink((operation, forward) =>
  forward(operation).pipe(
    catchError((error: unknown) => {
      if (operation.operationType !== OperationTypeNode.QUERY || !(error instanceof TypeError)) throw error;
      const data = operation.client.cache.readQuery({ query: operation.query, variables: operation.variables });
      if (!data) throw error;
      return of({ data });
    }),
  ),
);

const httpLink = new HttpLink({ uri: env.graphqlUrl });

/**
 * Types without an id live inside their parent (exercise content, a submission's answers). Merging
 * keeps fields one query selected when another query writes the same parent with fewer fields.
 */
const EMBEDDED = [
  'Games',
  'GameCompleteV2',
  'GameCrossword',
  'GameFreeResponse',
  'GameMultipleChoice',
  'GameTrueFalse',
  'GameWordGrid',
  'GameWordMatch',
  'GameWordShuffle',
  'SubmissionCompleteV2',
  'SubmissionCrossword',
  'SubmissionFreeResponse',
  'SubmissionMultipleChoice',
  'SubmissionTrueFalse',
  'SubmissionWordGrid',
  'SubmissionWordMatch',
  'SubmissionWordShuffle',
];

// The condition is written out here, not read from `env`, so Metro folds it and release bundles drop src/dev.
const networkLink =
  __DEV__ && process.env.EXPO_PUBLIC_MOCKS === '1'
    ? (require('@/dev/mock-link') as typeof import('@/dev/mock-link')).mockLink
    : ApolloLink.from([authLink, refreshLink, httpLink]);

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, offlineLink, networkLink]),
  cache: new InMemoryCache({
    possibleTypes: introspection.possibleTypes,
    typePolicies: Object.fromEntries(EMBEDDED.map((type) => [type, { merge: true }])),
  }),
  defaultOptions: {
    // Show what is cached at once, refresh in the background, then answer from the cache on re-render.
    watchQuery: { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' },
  },
});

/** Different accounts must never share cached data: clear on every profile switch and on sign-out. */
useSession.subscribe((state, prev) => {
  const signedOut = state.credentials.length === 0 && prev.credentials.length > 0;
  if (state.activeKey !== prev.activeKey || signedOut) void apolloClient.clearStore();
});

/** Back online: queries that failed refetch on their own (suspense boundaries retry themselves). */
onReconnect(() => {
  for (const query of apolloClient.getObservableQueries('active')) {
    if (query.getCurrentResult().error) void query.refetch().catch(() => undefined);
  }
});
