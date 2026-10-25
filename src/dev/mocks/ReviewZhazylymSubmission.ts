import { reviewStudent } from './_review-fixtures';

export default (v: { id: string }) => ({
  zhazylymSubmission: {
    __typename: 'ZhazylymSubmission',
    id: v.id,
    createdAt: Math.floor(new Date(2026, 9, 6).getTime() / 1000),
    text: 'Біз жексенбі күні бақшаға бардық. Атам алма ағашын көрсетті. Мен гүлдерге су құйдым, ал інім бақтағы құстарды бақылады.',
    points: v.id.endsWith('2') ? 8 : null,
    student: reviewStudent(v.id),
    assignment: { __typename: 'WordZhazylym', id: 'z1', name: 'Бақтағы бір күн', minWords: 20, words: ['бақ', 'алма', 'су'] },
  },
});
