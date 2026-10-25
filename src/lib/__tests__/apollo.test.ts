import { gql } from '@apollo/client';

import { useSession, type Credentials } from '@/features/auth/session';
import { apolloClient, needsRefresh, refreshed } from '@/lib/apollo';

const jwt = (exp: number) => `h.${btoa(JSON.stringify({ exp }))}.s`;
const now = () => Math.floor(Date.now() / 1000);

const kk: Credentials = { language: 'kk', accountId: 'a1', accessToken: jwt(now() - 60), refreshToken: 'refresh-kk' };
const ru: Credentials = { language: 'ru', accountId: 'a1', accessToken: jwt(now() + 3600), refreshToken: 'refresh-ru' };

function respond(token: string | null) {
  return jest.fn(async () => ({ headers: { get: (name: string) => (name === 'new-authorization' ? token : null) } }));
}

beforeEach(() => {
  useSession.setState({
    credentials: [kk, ru],
    profiles: [{ key: 'ru:a1:student:s1', language: 'ru', accountId: 'a1', role: 'student', profileId: 's1', name: 'R' }],
    activeKey: 'ru:a1:student:s1',
  });
});

describe('needsRefresh', () => {
  it('refreshes an expired or unreadable access token, not a fresh one or a demo account', () => {
    expect(needsRefresh(kk)).toBe(true);
    expect(needsRefresh({ ...kk, accessToken: 'not-a-jwt' })).toBe(true);
    expect(needsRefresh(ru)).toBe(false);
    expect(needsRefresh({ ...kk, accessToken: '', refreshToken: '' })).toBe(false);
  });
});

describe('refreshed', () => {
  it('shares one refresh call between parallel requests', async () => {
    const fetch = respond('new-kk');
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    const results = await Promise.all([refreshed(kk), refreshed(kk), refreshed(kk)]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(results.map((c) => c.accessToken)).toEqual(['new-kk', 'new-kk', 'new-kk']);
  });

  it('sends the request’s own refresh token and updates those credentials, not the active ones', async () => {
    const fetch = respond('new-kk');
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    await refreshed(kk);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toMatchObject({ authorization: 'refresh-kk', 'danatiin-language': 'kk' });
    expect(useSession.getState().credentials).toEqual([{ ...kk, accessToken: 'new-kk' }, ru]);
  });

  it('ignores a token for a session that was signed out meanwhile', async () => {
    globalThis.fetch = respond('new-kk') as unknown as typeof globalThis.fetch;
    const pending = refreshed(kk);
    useSession.setState({ credentials: [{ ...kk, refreshToken: 'next-login' }] });
    await pending;
    expect(useSession.getState().credentials[0]!.accessToken).toBe(kk.accessToken);
  });

  it('starts a new refresh once the previous one finished, and keeps the credentials when none came back', async () => {
    const fetch = respond(null);
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    await expect(refreshed(kk)).resolves.toEqual(kk);
    await refreshed(kk);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('offline', () => {
  const QUERY = gql`
    query OfflineProbe($id: ID!) {
      node(id: $id) {
        id
        name
      }
    }
  `;

  it('answers a query from the cache when fetch fails, and fails without cached data', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof globalThis.fetch;
    apolloClient.cache.writeQuery({
      query: QUERY,
      variables: { id: '1' },
      data: { node: { __typename: 'Node', id: '1', name: 'cached' } },
    });
    const cached = await apolloClient.query({ query: QUERY, variables: { id: '1' }, fetchPolicy: 'network-only' });
    expect(cached.data).toEqual({ node: { __typename: 'Node', id: '1', name: 'cached' } });
    await expect(
      apolloClient.query({ query: QUERY, variables: { id: '2' }, fetchPolicy: 'network-only' }),
    ).rejects.toThrow('Network request failed');
  });
});
