const names: Record<string, string> = {
  s0: 'Аружан Сейіт', s1: 'Әли Нұрлан', s2: 'Айша Мұрат', s3: 'Данияр Әсет', s4: 'Медина Омар', s5: 'Ерасыл Қанат', s6: 'Томирис Әлі', s7: 'Нұрислам Бек',
};

/** "z1-sub2" → the student of that submission in TeacherSchool.ts (index-aligned with 7А). */
export function reviewStudent(submissionId: string) {
  const i = Number(submissionId.split('sub')[1] ?? 0);
  const id = `s${i}`;
  return { __typename: 'Student', id, name: names[id] ?? 'Аружан Сейіт', class: { __typename: 'Class', id: 'c1', grade: 7, letter: 'А' } };
}
