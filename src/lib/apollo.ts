import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
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
  if (credentials) headers.authorization = bearer(credentials);
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

const wsLink = new GraphQLWsLink(
  createClient({
    url: env.graphqlWsUrl,
    lazy: true,
    retryAttempts: 5,
    connectionParams: () => headersFor(activeCredentials()),
  }),
);

const httpLink = new HttpLink({ uri: env.graphqlUrl });

const isSubscription = ({ query }: ApolloLink.Operation) => {
  const definition = getMainDefinition(query);
  return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
};

const networkLink = env.mocks
  ? (require('@/dev/mock-link') as typeof import('@/dev/mock-link')).mockLink
  : ApolloLink.split(isSubscription, wsLink, ApolloLink.from([authLink, refreshLink, httpLink]));

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, networkLink]),
  cache: new InMemoryCache({
    possibleTypes: introspection.possibleTypes,
  }),
});

/** Different accounts must never share cached data. */
useSession.subscribe((state, prev) => {
  if (state.activeKey !== prev.activeKey) void apolloClient.clearStore();
});
