import { Redirect } from 'expo-router';

import { useActiveProfile, useSession } from '@/features/auth/session';

/** Sends everyone to where they belong: sign in, pick an account, or their role's home. */
export default function Index() {
  const signedIn = useSession((s) => s.credentials.length > 0);
  const role = useActiveProfile()?.role;
  if (!signedIn) return <Redirect href="/sign-in" />;
  if (!role) return <Redirect href="/accounts" />;
  return <Redirect href={`/${role}`} />;
}
