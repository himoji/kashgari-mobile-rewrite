const O = (word: string, translation: string) => ({ __typename: 'OynaGameWordGameWord', word, translation, imageUrl: null });

export default (v: { id: string }) => ({
  wordGameGame: {
    __typename: 'OynaGameWordGame',
    id: v.id,
    name: 'Табиғат туралы жаңа сөздер',
    topicName: 'Табиғат',
    maxPoints: 10,
    submission: {
      __typename: 'OynaSubmissionWordGame',
      id: 'ws1',
      time: 412,
      points: 8,
      match: [
        ['табиғат', 'природа | nature', 'природа | nature'],
        ['орман', 'лес | forest', 'река | river'],
        ['өзен', 'река | river', 'лес | forest'],
        ['су', 'вода | water', 'вода | water'],
      ].map(([word, translation, answer]) => ({
        __typename: 'WordGameMatchQuestionSubmission',
        question: { __typename: 'WordGameMatchQuestion', word, translation },
        answer,
      })),
      mcq: [
        { options: [O('орман', 'лес | forest'), O('өзен', 'река | river')], answer: 'орман' },
        { options: [O('су', 'вода | water'), O('гүл', 'цветок | flower')], answer: 'гүл' },
      ].map((q) => ({ __typename: 'WordGameMCQQuestionSubmission', question: { __typename: 'WordGameMCQQuestion', options: q.options }, answer: q.answer })),
      captcha: { __typename: 'WordGameCaptchaSubmission', correctWords: ['орман', 'өзен', 'су', 'тау', 'гүл'], studentWords: ['орман', 'өзен', 'кітап', 'су', 'тау'] },
    },
  },
});
