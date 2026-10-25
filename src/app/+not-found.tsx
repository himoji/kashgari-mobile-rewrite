import { Redirect } from 'expo-router';

/** Unknown paths (e.g. https://danatiin.kashgari.kz/link/... app links) open the app; the index picks the home. */
export default function NotFound() {
  return <Redirect href="/" />;
}
