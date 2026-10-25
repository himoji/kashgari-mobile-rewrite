import { useMutation, useQuery } from '@apollo/client/react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile, useSession } from '@/features/auth/session';
import { DialogCard } from '@/features/dictionary/dialog-card';
import { DICTIONARY_REQUEST_DEFINITION, DICTIONARY_WORD } from '@/features/dictionary/gql';
import { useWordAudio } from '@/features/dictionary/word-audio';
import type { DictionaryWordQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Word = NonNullable<DictionaryWordQuery['word']>;
type Params = { word: string; def?: string; assignmentId?: string };

function AudioButton({ word }: { word: Word }) {
  const { t } = useTranslation();
  const play = useWordAudio(word);
  if (!play) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('dictionary.listen')}
      onPress={play}
      className="h-9 w-11 items-center justify-center rounded-full bg-[#f0f6ff] active:opacity-80"
    >
      <Icon name="audio" size={20} color={colors.link} />
    </Pressable>
  );
}

/**
 * Word detail dialog. Open it from anywhere with
 * `router.push({ pathname: '/word', params: { word, def?, assignmentId? } })`;
 * `def` is the definition index from the text markup, `assignmentId` makes the lookup count for that task.
 */
export function WordSheetScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<Params>();
  const profile = useProfile();
  const definitionLanguage = useSession((s) => s.definitionLanguage);
  const content = useContentText();
  const word = String(params.word ?? '').toLowerCase();
  const metadata =
    profile.role === 'student' && params.assignmentId
      ? { studentId: profile.profileId, assignmentId: params.assignmentId }
      : null;
  const { data, loading } = useQuery(DICTIONARY_WORD, {
    variables: { word, metadata },
    skip: !word,
  });
  const [requestDefinition, request] = useMutation(DICTIONARY_REQUEST_DEFINITION);

  const entry = data?.word;
  const definitions = [...(entry?.definitions ?? [])].sort((a, b) => a.order - b.order);
  const definition = definitions[Number(params.def ?? 0)] ?? definitions[0];
  const meaning = definition
    ? definitionLanguage === 'kk'
      ? content(definition.text)
      : definitionLanguage === 'ru'
        ? definition.translationRussian || definition.textRussian
        : definition.translationEnglish || definition.text
    : null;
  const example = [...(definition?.examples ?? [])].sort((a, b) => a.order - b.order)[0];

  return (
    <DialogCard onClose={() => router.back()}>
      <View className="mb-5 flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="mb-[5px] font-body-semibold text-[26px] leading-[34px]">
            {content(word)}
          </Text>
          {loading ? (
            <Skeleton className="h-4 w-24 rounded-md" />
          ) : (
            <Text className="font-body text-[14px] leading-[22px] text-subtle">
              {meaning || t('dictionary.noDefinition')}
            </Text>
          )}
        </View>
        {entry ? <AudioButton word={entry} /> : null}
      </View>

      {example ? (
        <View className="py-3.5">
          <Text className="font-body text-[11px] leading-[16px] text-[#93a0b3]">
            {t('dictionary.example')}
          </Text>
          <Text className="mt-2 font-body text-[15px] leading-[24px] text-[#485970]">
            {content(example.text)}
          </Text>
        </View>
      ) : null}

      <View className="mt-[18px] gap-2.5">
        {!loading && !entry ? (
          <Button
            variant="soft"
            icon={request.data ? 'check' : undefined}
            label={request.data ? t('dictionary.requested') : t('dictionary.request')}
            loading={request.loading}
            disabled={!!request.data}
            onPress={() => void requestDefinition({ variables: { word } })}
          />
        ) : null}
        <Button icon="plus" label={t('dictionary.save')} disabled />
        <NotReady body={t('dictionary.saveNotReady')} className="px-3 py-2.5" />
      </View>
    </DialogCard>
  );
}
