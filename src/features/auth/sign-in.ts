import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

import { ACCOUNT_PROFILES, LOGIN_APPLE, LOGIN_GOOGLE } from '@/features/auth/gql';
import { accountProfiles, resolveProfiles } from '@/features/auth/profiles';
import { useSession, type ContentLanguage, type Credentials } from '@/features/auth/session';
import { apolloClient } from '@/lib/apollo';
import { env } from '@/lib/env';

/** Every kashgari-api language database; one phone or social login can own an account in each. */
export const CONTENT_LANGUAGES: ContentLanguage[] = ['kk', 'ru', 'en', 'fr'];

export async function finishSignIn(credentials: Credentials[]) {
  const profiles = await resolveProfiles(credentials);
  useSession.getState().signIn(credentials, profiles);
}

/** Social providers log in per language database, unlike the phone flow which returns all at once. */
async function signInWithIdToken(provider: 'google' | 'apple', idToken: string) {
  const results = await Promise.all(
    CONTENT_LANGUAGES.map(async (language) => {
      try {
        const { data } =
          provider === 'google'
            ? await apolloClient.mutate({ mutation: LOGIN_GOOGLE, variables: { idToken }, context: { language }, fetchPolicy: 'no-cache' })
            : await apolloClient.mutate({ mutation: LOGIN_APPLE, variables: { idToken }, context: { language }, fetchPolicy: 'no-cache' });
        const info = data && ('loginGoogle' in data ? data.loginGoogle : data.loginApple);
        return info ? ({ language, ...info } satisfies Credentials) : null;
      } catch {
        return null;
      }
    }),
  );
  const credentials = results.filter((c) => c !== null);
  if (!credentials.length) throw new Error('No account for this sign-in');
  await finishSignIn(credentials);
}

/** Demo databases with roles (fr has none). */
const DEMO_LANGUAGES: ContentLanguage[] = ['kk', 'ru', 'en'];
/** Placeholder student profiles left in the demo accounts by class joins. */
const DEMO_JUNK = 'Сіз (Вы)';

/**
 * Demo: a request without a token gets each language database's shared demo account (read-mostly;
 * the API rejects account changes for it). The credentials keep empty tokens, so no header is sent.
 */
export async function signInAsDemo() {
  const results = await Promise.all(
    DEMO_LANGUAGES.map(async (language) => {
      try {
        const { data } = await apolloClient.query({ query: ACCOUNT_PROFILES, context: { language }, fetchPolicy: 'no-cache' });
        if (!data?.account) return null;
        const cred: Credentials = { language, accountId: data.account.id, accessToken: '', refreshToken: '' };
        const profiles = accountProfiles(cred, data.account).filter((p) => p.name !== DEMO_JUNK);
        return profiles.length ? { cred, profiles } : null;
      } catch {
        return null;
      }
    }),
  );
  const found = results.filter((r) => r !== null);
  if (!found.length) throw new Error('No demo account');
  useSession.getState().signIn(found.map((r) => r.cred), found.flatMap((r) => r.profiles));
}

export async function signInWithGoogle() {
  GoogleSignin.configure({ webClientId: env.googleServerClientId, iosClientId: env.googleIosClientId });
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return;
  if (!response.data.idToken) throw new Error('Google returned no id token');
  await signInWithIdToken('google', response.data.idToken);
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
  });
  if (!credential.identityToken) throw new Error('Apple returned no identity token');
  await signInWithIdToken('apple', credential.identityToken);
}
