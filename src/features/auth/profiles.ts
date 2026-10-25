import { apolloClient } from '@/lib/apollo';
import { ACCOUNT_PROFILES } from '@/features/auth/gql';
import { className } from '@/features/classes/format';
import { profileKey, type Credentials, type Profile } from '@/features/auth/session';
import type { UiLanguage } from '@/features/auth/session';
import type { AccountProfilesQuery, Language } from '@/graphql/graphql';

type Account = NonNullable<AccountProfilesQuery['account']>;

/** The role profiles of one account. */
export function accountProfiles(cred: Credentials, account: Account): Profile[] {
  const base = { language: cred.language, accountId: cred.accountId, login: account.email ?? undefined };
  const list: Omit<Profile, 'key'>[] = [
    ...account.studentProfiles.map((s) => ({
      ...base,
      role: 'student' as const,
      profileId: s.id,
      name: s.name,
      className: className(s.class),
      school: s.class.teacher.school?.name,
    })),
    ...account.teacherProfiles.map((t) => ({ ...base, role: 'teacher' as const, profileId: t.id, name: t.name, school: t.school?.name })),
    ...account.principalProfiles.map((p) => ({ ...base, role: 'principal' as const, profileId: p.id, name: p.name, school: p.school.name })),
    ...(account.parentProfile ? [{ ...base, role: 'parent' as const, profileId: account.parentProfile.id, name: account.parentProfile.name }] : []),
  ];
  return list.map((p) => ({ ...p, key: profileKey(p) }));
}

/** The account's saved interface language (`languageContext`) and back. */
const FROM_API: Record<Language, UiLanguage> = { KZ: 'kk', RU: 'ru', EN: 'en' };
export const apiLanguage = (lang: UiLanguage): Language => (lang === 'kk' ? 'KZ' : lang === 'ru' ? 'RU' : 'EN');

/** Every role profile across the accounts a phone or social login returned, and the first account's interface language. */
export async function resolveProfiles(credentials: Credentials[]): Promise<{ profiles: Profile[]; uiLanguage?: UiLanguage }> {
  const perAccount = await Promise.all(
    credentials.map(async (cred) => {
      const { data } = await apolloClient.query({
        query: ACCOUNT_PROFILES,
        variables: { accountId: cred.accountId },
        context: { credentials: cred },
        // One account per language database: their ids can collide, so these never enter the cache.
        fetchPolicy: 'no-cache',
      });
      return data?.account ? { profiles: accountProfiles(cred, data.account), uiLanguage: FROM_API[data.account.languageContext] } : null;
    }),
  );
  const found = perAccount.filter((a) => a !== null);
  return { profiles: found.flatMap((a) => a.profiles), uiLanguage: found[0]?.uiLanguage };
}
