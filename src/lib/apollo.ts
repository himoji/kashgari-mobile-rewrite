import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { jwtDecode } from 'jwt-decode';
import { map } from 'rxjs';

import introspection from '@/graphql/possible-types';
import { activeCredentials, useSession, type Credentials } from '@/features/auth/session';
import { env } from '@/lib/env';

/**
 * Per-operation context:
 * - `credentials`: act as a specific account (used at login, before a profile is active).
 * - `language`: content language header without credentials (login mutations).
 */
declare module '@apollo/client' {
  interface DefaultContext {
    credentials?: Credentials;
    language?: Credentials['language'];
  }
}

/** The API accepts the refresh token once the access token expires and returns a fresh one. */
function bearer({ accessToken, refreshToken }: Credentials): string {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(accessToken);
    return exp && exp > Date.now() / 1000 + 30 ? accessToken : refreshToken;
  } catch {
    return refreshToken;
  }
}

function headersFor(credentials: Credentials | null, language?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'danatiin-language': credentials?.language ?? language ?? 'kk',
  };
  // Demo credentials carry no token: the API serves its demo account to unauthenticated requests.
  const token = credentials ? bearer(credentials) : '';
  if (token) headers.authorization = token;
  return headers;
}

const authLink = new SetContextLink((prev) => {
  // A login call names its language and must not borrow the active account's token.
  const credentials = prev.credentials ?? (prev.language ? null : activeCredentials());
  return { headers: { ...prev.headers, ...headersFor(credentials, prev.language) } };
});

const refreshLink = new ApolloLink((operation, forward) =>
  forward(operation).pipe(
    map((result) => {
      const { response, credentials = activeCredentials() } = operation.getContext() as {
        response?: Response;
        credentials?: Credentials | null;
      };
      const token = response?.headers?.get('new-authorization');
      if (token && credentials && token !== credentials.accessToken) {
        useSession.getState().updateAccessToken(credentials.accountId, credentials.language, token);
      }
      return result;
    }),
  ),
);

const errorLink = new ErrorLink(({ error }) => {
  if (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((e) => e.extensions?.code === 'AUTHENTICATION_ERROR')
  ) {
    useSession.getState().signOut();
  }
});

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

const networkLink = env.mocks
  ? (require('@/dev/mock-link') as typeof import('@/dev/mock-link')).mockLink
  : ApolloLink.from([authLink, refreshLink, httpLink]);

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, networkLink]),
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
