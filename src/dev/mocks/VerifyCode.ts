export default (v: { verificationCode?: string }) => ({
  verifyPhoneNumberAllLanguages:
    v.verificationCode === '123456'
      ? [{ __typename: 'LanguageAuthInfo', language: 'kk', authInfo: { __typename: 'AuthInfo', accountId: 'a1', accessToken: 'mock', refreshToken: 'mock' } }]
      : null,
});
