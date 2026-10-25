import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth/session';
import { WordleRow } from '@/features/oyna/games/wordle';
import { formatClock } from '@/features/oyna/logic/game-type';
import { rankRows, type BoardRow } from '@/features/oyna/logic/leaderboard';
import { usedWords } from '@/features/oyna/logic/ministory';
import { displayTranslation } from '@/features/oyna/logic/translation';
import { evaluateGuess } from '@/features/oyna/logic/wordle';
import { countCorrect, mcqAnswer } from '@/features/oyna/logic/word-game';
import { Chip } from '@/features/oyna/parts';
import type { OynaWordGameResultQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <View className="mt-6">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Text className="font-body-semibold text-[16px] leading-[23px]">{title}</Text>
        {aside ? <Text className="font-body-medium text-[13px] leading-[19.5px] text-[#7a8090]">{aside}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** One reviewed answer: prompt, the student's answer, and the right one when it differs. */
function ReviewRow({ prompt, answer, expected, correct }: { prompt: string; answer: string; expected: string; correct: boolean }) {
  const { t } = useTranslation();
  return (
    <View className={cn('flex-row items-center gap-3 rounded-[14px] px-3 py-2.5', correct ? 'bg-[#edf8ef]' : 'bg-danger-soft')}>
      <View className="flex-1">
        <Text className="font-body-medium text-[15px] leading-[21px]">{prompt}</Text>
        <Text className={cn('font-body text-[13px] leading-[19px]', correct ? 'text-[#2f6b3f]' : 'text-danger')}>{answer || t('oyna.result.noAnswer')}</Text>
        {!correct ? (
          <Text className="font-body text-[12px] leading-[17px] text-muted">
            {t('oyna.result.correctAnswer')}: {expected}
          </Text>
        ) : null}
      </View>
      <Icon name={correct ? 'check' : 'close'} size={20} color={correct ? colors.success : colors.danger} />
    </View>
  );
}

type WordGameSubmission = NonNullable<NonNullable<OynaWordGameResultQuery['wordGameGame']>['submission']>;

export function WordGameDetails({ submission }: { submission: WordGameSubmission }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const lang = useSession((s) => s.definitionLanguage);
  const { match, mcq, captcha } = submission;
  const correctClouds = new Set(captcha.correctWords);
  const tapped = new Set(captcha.studentWords);
  const missed = captcha.correctWords.filter((w) => !tapped.has(w));
  return (
    <>
      {match.length ? (
        <Section
          title={t('oyna.steps.match')}
          aside={`${countCorrect(match.map((m) => ({ expected: m.question.translation, given: m.answer })))} / ${match.length}`}
        >
          <View className="gap-2">
            {match.map((m) => (
              <ReviewRow
                key={m.question.word}
                prompt={ct(m.question.word)}
                answer={displayTranslation(m.answer, lang)}
                expected={displayTranslation(m.question.translation, lang)}
                correct={m.answer === m.question.translation}
              />
            ))}
          </View>
        </Section>
      ) : null}
      {mcq.length ? (
        <Section title={t('oyna.steps.mcq')} aside={`${countCorrect(mcq.map((m) => ({ expected: mcqAnswer(m.question), given: m.answer })))} / ${mcq.length}`}>
          <View className="gap-2">
            {mcq.map((m, i) => (
              <ReviewRow
                key={i}
                prompt={displayTranslation(m.question.options[0]?.translation, lang)}
                answer={ct(m.answer ?? '')}
                expected={ct(mcqAnswer(m.question))}
                correct={m.answer === mcqAnswer(m.question)}
              />
            ))}
          </View>
        </Section>
      ) : null}
      {captcha.studentWords.length || captcha.correctWords.length ? (
        <Section title={t('oyna.steps.captcha')}>
          <View className="flex-row flex-wrap gap-1.5">
            {captcha.studentWords.map((w) => (
              <Chip key={`s-${w}`} label={ct(w)} tone={correctClouds.has(w) ? 'correct' : 'wrong'} />
            ))}
          </View>
          {missed.length ? (
            <>
              <Text className="mb-2 mt-3 font-body text-[12px] leading-[17px] text-muted">{t('oyna.result.missed')}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {missed.map((w) => (
                  <Chip key={`m-${w}`} label={ct(w)} />
                ))}
              </View>
            </>
          ) : null}
        </Section>
      ) : null}
    </>
  );
}

export function WordleDetails({ words, guesses }: { words: string[]; guesses: string[][] }) {
  const { t } = useTranslation();
  return (
    <Section title={t('oyna.result.guesses')}>
      <View className="gap-4">
        {words.map((word, i) => {
          const list = guesses[i] ?? [];
          const length = [...word].length;
          return (
            <View key={`${word}-${i}`} className="rounded-2xl bg-[#f6f8fc] p-3">
              {list.length ? (
                list.map((g, r) => <WordleRow key={r} letters={g.toLocaleUpperCase()} states={evaluateGuess(g, word)} length={length} size={34} />)
              ) : (
                <WordleRow letters="" length={length} size={34} />
              )}
              <Text className="mt-1 text-center font-body-medium text-[13px] leading-[19px] text-muted">{word.toLocaleUpperCase()}</Text>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

export function QuizletDetails({ boards, guessed }: { boards: ({ word: string } | null)[][]; guessed: string[][] }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const all = boards.flat().filter((c): c is { word: string } => !!c);
  const hit = new Set(guessed.flat());
  return (
    <Section title={t('oyna.words')} aside={`${all.filter((c) => hit.has(c.word)).length} / ${all.length}`}>
      <View className="flex-row flex-wrap gap-1.5">
        {all.map((c, i) => (
          <Chip key={`${c.word}-${i}`} label={ct(c.word)} tone={hit.has(c.word) ? 'correct' : 'idle'} />
        ))}
      </View>
    </Section>
  );
}

export function MiniStoryDetails({ words, text }: { words: string[]; text: string }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const used = usedWords(words, text);
  return (
    <>
      <Section title={t('oyna.words')} aside={`${used.length} / ${words.length}`}>
        <View className="flex-row flex-wrap gap-1.5">
          {words.map((w) => (
            <Chip key={w} label={ct(w)} tone={used.includes(w) ? 'correct' : 'idle'} />
          ))}
        </View>
      </Section>
      <Section title={t('oyna.result.yourStory')}>
        <View className="rounded-2xl bg-[#f6f8fc] p-4">
          <Text variant="reading" className="text-[16px] leading-[25.6px]">{ct(text)}</Text>
        </View>
      </Section>
    </>
  );
}

export function Leaderboard({ rows, me }: { rows: BoardRow[]; me: string }) {
  const { t } = useTranslation();
  if (rows.length < 2) return null;
  return (
    <Section title={t('oyna.result.leaderboard')}>
      <View className="overflow-hidden rounded-2xl bg-[#f6f8fc] p-1.5">
        {rankRows(rows).map((r) => {
          const mine = r.id === me;
          return (
            <View key={r.id} className={cn('h-12 flex-row items-center gap-3 rounded-control px-2.5', mine && 'bg-[#fff8d6]')}>
              <Text className="w-6 text-center font-body-semibold text-[14px] leading-[20px] text-muted">{r.place}</Text>
              <Text className={cn('flex-1 font-body text-[15px] leading-[22px]', mine && 'font-body-semibold')} numberOfLines={1}>
                {mine ? `${r.name} · ${t('oyna.result.you')}` : r.name}
              </Text>
              <Text className="font-body-semibold text-[14px] leading-[20px]">{r.points}</Text>
              <Text className="w-11 text-right font-body text-[12px] leading-[17px] text-subtle">{formatClock(r.time)}</Text>
            </View>
          );
        })}
      </View>
    </Section>
  );
}
