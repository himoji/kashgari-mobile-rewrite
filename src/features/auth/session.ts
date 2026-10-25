import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/storage';

/** Content language = which kashgari-api database the account lives in (`danatiin-language`). */
export type ContentLanguage = 'kk' | 'ru' | 'en' | 'fr';
export type Role = 'student' | 'teacher' | 'parent' | 'principal';
export type UiLanguage = 'kk' | 'ru' | 'en';
export type Script = 'cyrl' | 'latn';

export interface Credentials {
  language: ContentLanguage;
  accountId: string;
  accessToken: string;
  refreshToken: string;
}

/** One thing the user can act as: a role profile inside one account. */
export interface Profile {
  key: string;
  language: ContentLanguage;
  accountId: string;
  role: Role;
  profileId: string;
  name: string;
  school?: string;
  /** Student profiles: "7А". */
  className?: string;
  /** The account's login (phone number or email). */
  login?: string;
}

interface SessionState {
  credentials: Credentials[];
  profiles: Profile[];
  activeKey: string | null;
  uiLanguage: UiLanguage;
  /** Kazakh text (interface and learning content) in Cyrillic or Latin. */
  script: Script;
  /** Language for word definitions in the dictionary. */
  definitionLanguage: UiLanguage;
  hydrated: boolean;
  signIn: (credentials: Credentials[], profiles: Profile[]) => void;
  setActive: (key: string) => void;
  updateAccessToken: (accountId: string, language: ContentLanguage, token: string) => void;
  setPreferences: (prefs: Partial<Pick<SessionState, 'uiLanguage' | 'script' | 'definitionLanguage'>>) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      credentials: [],
      profiles: [],
      activeKey: null,
      uiLanguage: 'kk',
      script: 'cyrl',
      definitionLanguage: 'ru',
      hydrated: false,
      signIn: (credentials, profiles) =>
        set({
          credentials,
          profiles,
          activeKey: profiles.length === 1 ? profiles[0]!.key : null,
        }),
      setActive: (key) => set({ activeKey: key }),
      updateAccessToken: (accountId, language, token) =>
        set((s) => ({
          credentials: s.credentials.map((c) =>
            c.accountId === accountId && c.language === language ? { ...c, accessToken: token } : c,
          ),
        })),
      setPreferences: (prefs) => set(prefs),
      signOut: () => set({ credentials: [], profiles: [], activeKey: null }),
    }),
    {
      name: 'danatiin-session',
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
    },
  ),
);

// Web storage hydrates synchronously during create(), native storage later; cover both.
const markHydrated = () => useSession.setState({ hydrated: true });
if (useSession.persist.hasHydrated()) markHydrated();
else useSession.persist.onFinishHydration(markHydrated);

export const profileKey = (p: Pick<Profile, 'language' | 'accountId' | 'role' | 'profileId'>) =>
  `${p.language}:${p.accountId}:${p.role}:${p.profileId}`;

/** The active profile, or null when signed out or still choosing an account. */
export function useActiveProfile(): Profile | null {
  return useSession((s) => s.profiles.find((p) => p.key === s.activeKey) ?? null);
}

/** For screens that only render under a role guard: the active profile always exists there. */
export function useProfile(): Profile {
  const profile = useActiveProfile();
  if (!profile) throw new Error('useProfile used outside a signed-in route');
  return profile;
}

export function activeCredentials(): Credentials | null {
  const { profiles, activeKey, credentials } = useSession.getState();
  const profile = profiles.find((p) => p.key === activeKey);
  const accountId = profile?.accountId ?? credentials[0]?.accountId;
  const language = profile?.language ?? credentials[0]?.language;
  return credentials.find((c) => c.accountId === accountId && c.language === language) ?? null;
}
