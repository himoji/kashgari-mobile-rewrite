import { gql } from '@/graphql';

export const REQUEST_ID = gql(`
  mutation RequestId($data: VerifyCaptchaInput!) {
    verifyCaptcha(data: $data)
  }
`);

export const REQUEST_CODE = gql(`
  mutation RequestCode($requestId: ID!, $phoneNumber: String!) {
    requestVerification(requestId: $requestId, phoneNumber: $phoneNumber)
  }
`);

export const VERIFY_CODE = gql(`
  mutation VerifyCode($requestId: ID!, $verificationCode: String!) {
    verifyPhoneNumberAllLanguages(requestId: $requestId, verificationCode: $verificationCode) {
      language
      authInfo { accountId accessToken refreshToken }
    }
  }
`);

export const LOGIN_GOOGLE = gql(`
  mutation LoginGoogle($idToken: String!) {
    loginGoogle(idToken: $idToken) { accountId accessToken refreshToken }
  }
`);

export const LOGIN_APPLE = gql(`
  mutation LoginApple($idToken: String!) {
    loginApple(idToken: $idToken) { accountId accessToken refreshToken }
  }
`);

export const ACCOUNT_PROFILES = gql(`
  query AccountProfiles($accountId: ID) {
    account(id: $accountId) {
      id
      email
      languageContext
      studentProfiles { id name class { ...ClassLabel teacher { id school { id name } } } }
      teacherProfiles { id name school { id name } }
      parentProfile { id name }
      principalProfiles { id name school { id name } }
    }
  }
`);

export const UPDATE_LANGUAGE = gql(`
  mutation UpdateLanguage($id: ID!, $language: Language!) {
    updateLanguage(id: $id, language: $language)
  }
`);

export const DELETE_ACCOUNT = gql(`
  mutation DeleteAccount($id: ID!) {
    deleteAccount(id: $id)
  }
`);
