const graphqlUrl = process.env.EXPO_PUBLIC_GRAPHQL_URL ?? 'https://gql.danatiin.kashgari.kz/';

export const env = {
  graphqlUrl,
  graphqlWsUrl: graphqlUrl.replace(/^http/, 'ws'),
  googleServerClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_SERVER_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID ?? '',
  mode: process.env.EXPO_PUBLIC_MODE ?? 'production',
  /** Answer GraphQL from src/dev/mocks (web checks without the API). Never on in release builds. */
  mocks: __DEV__ && process.env.EXPO_PUBLIC_MOCKS === '1',
};
