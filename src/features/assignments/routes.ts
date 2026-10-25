import type { Href } from 'expo-router';

/** Every kind of school work a student can be given. Lowercase: it is the `[kind]` segment of the player and result routes. */
export type AssignmentKind = 'oqylym' | 'tyndalym' | 'durys' | 'oyna' | 'lesson' | 'zhazylym';

/** Oyna games come in four types; the player needs it to pick the game (extra `game` param). */
export type OynaGameType = 'miniStory' | 'wordle' | 'quizlet' | 'wordGame';

export type AssignmentRef = { id: string; kind: AssignmentKind; game?: OynaGameType };

function params({ id, kind, game }: AssignmentRef) {
  return game ? { kind, id, game } : { kind, id };
}

/** Opens the assignment in its player: /student/play/[kind]/[id] (+ `game` for oyna). */
export function assignmentHref(item: AssignmentRef): Href {
  return { pathname: '/student/play/[kind]/[id]', params: params(item) } as unknown as Href;
}

/** Opens the student's result for the assignment: /student/result/[kind]/[id] (+ `game` for oyna). */
export function resultHref(item: AssignmentRef): Href {
  return { pathname: '/student/result/[kind]/[id]', params: params(item) } as unknown as Href;
}
