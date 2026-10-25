import { useTranslation } from 'react-i18next';

import { MiniStoryPlayer } from '@/features/oyna/games/mini-story';
import { QuizletPlayer } from '@/features/oyna/games/quizlet';
import { WordGamePlayer } from '@/features/oyna/games/word-game';
import { WordlePlayer } from '@/features/oyna/games/wordle';
import { oynaKind } from '@/features/oyna/logic/game-type';
import { PlayerError } from '@/features/oyna/player-states';
import { OynaResultView } from '@/features/oyna/result/oyna-result';

type Props = { id: string; params: Record<string, string | undefined> };

/** The game type comes from the school list as `game` (miniStory | wordle | quizlet | wordGame); `type` or a `__typename` also work. */
const kindOf = (params: Props['params']) => oynaKind(params.game ?? params.type);

/** Plays one Oyna game for the signed-in student. Opening a game that is already submitted shows its result. */
export function OynaPlayer({ id, params }: Props) {
  const { t } = useTranslation();
  switch (kindOf(params)) {
    case 'wordgame':
      return <WordGamePlayer id={id} />;
    case 'wordle':
      return <WordlePlayer id={id} />;
    case 'quizlet':
      return <QuizletPlayer id={id} />;
    case 'ministory':
      return <MiniStoryPlayer id={id} />;
    default:
      return <PlayerError message={t('oyna.unknownType')} />;
  }
}

/** The student's result for one Oyna game (score, answers review, class leaderboard for wordle/quizlet). */
export function OynaResult({ id, params }: Props) {
  const { t } = useTranslation();
  const kind = kindOf(params);
  if (!kind) return <PlayerError message={t('oyna.unknownType')} />;
  return <OynaResultView kind={kind} id={id} />;
}
