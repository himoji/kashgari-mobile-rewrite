import { skipToken, useMutation, useQuery, useSuspenseQuery } from '@apollo/client/react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useProfile, useSession } from '@/features/auth/session';
import { DICTIONARY_REQUEST_DEFINITION, DICTIONARY_WORD, DICTIONARY_WORD_EXAMPLES } from '@/features/dictionary/gql';
import { useWordAudio } from '@/features/dictionary/word-audio';
import type { DictionaryWordQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

type Word = NonNullable<DictionaryWordQuery['word']>;
type Definition = Word['definitions'][number];
type Params = { word: string; def?: string; assignmentId?: string };

const SIDE = 20;
const TOP = 28;

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

function Saving() {
  const { t } = useTranslation();
  return (
    <>
      <Button icon="plus" label={t('dictionary.save')} disabled />
      <NotReady body={t('dictionary.saveNotReady')} className="px-3 py-2.5" />
    </>
  );
}

/**
 * The small detent fits the word and the first meaning: everything above `fold`, plus the sheet's
 * own padding. Pulling the sheet up or scrolling shows the rest.
 */
function useFitSheet() {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [fitted, setFitted] = useState(0);
  return (fold: number) => {
    const small = Math.min(0.6, Math.max(0.18, (TOP + fold + 20 + insets.bottom) / height));
    if (Math.abs(small - fitted) < 0.01) return;
    setFitted(small);
    navigation.setOptions({ sheetAllowedDetents: [small, 0.9] });
  };
}

/**
 * Word detail sheet. Open it from anywhere with
 * `router.push({ pathname: '/word', params: { word, def?, assignmentId? } })`;
 * `def` is the definition index from the text markup, `assignmentId` makes the lookup count for that task.
 */
export function WordSheetScreen() {
  const params = useLocalSearchParams<Params>();
  const content = useContentText();
  const fit = useFitSheet();
  const word = String(params.word ?? '').toLowerCase();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: SIDE, paddingTop: TOP, paddingBottom: 32 }}>
      <QueryBoundary
        fallback={
          <View onLayout={(e) => fit(e.nativeEvent.layout.height)}>
            <Text className="mb-[5px] font-body-semibold text-[26px] leading-[34px]">{content(word)}</Text>
            <Skeleton className="h-4 w-24 rounded-md" />
          </View>
        }
      >
        <WordSheet word={word} def={params.def} assignmentId={params.assignmentId} onFold={fit} />
      </QueryBoundary>
    </ScrollView>
  );
}

function useMeaning() {
  const definitionLanguage = useSession((s) => s.definitionLanguage);
  const content = useContentText();
  return (d: Definition) =>
    definitionLanguage === 'kk'
      ? content(d.text)
      : definitionLanguage === 'ru'
        ? d.translationRussian || d.textRussian
        : d.translationEnglish || d.text;
}

function WordSheet({ word, def, assignmentId, onFold }: Params & { onFold: (height: number) => void }) {
  const { t } = useTranslation();
  const profile = useProfile();
  const content = useContentText();
  const meaningOf = useMeaning();
  const { width } = useWindowDimensions();
  const metadata = profile.role === 'student' && assignmentId ? { studentId: profile.profileId, assignmentId } : null;
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(DICTIONARY_WORD, word ? { variables: { word, metadata }, queryKey } : skipToken);
  // Examples ride in their own query and are quietly left out when the API fails on them.
  const { data: extra } = useQuery(DICTIONARY_WORD_EXAMPLES, { variables: { word }, errorPolicy: 'all', fetchPolicy: 'no-cache' });
  const [requestDefinition, request] = useMutation(DICTIONARY_REQUEST_DEFINITION);

  const entry = data?.word;
  const definitions = [...(entry?.definitions ?? [])].sort((a, b) => a.order - b.order);
  const [page, setPage] = useState(() => Math.min(Number(def ?? 0) || 0, Math.max(definitions.length - 1, 0)));
  const [headHeight, setHeadHeight] = useState(0);
  const pageWidth = width - SIDE * 2;
  const example = (d: Definition) =>
    [...(extra?.word?.definitions.find((x) => x.id === d.id)?.examples ?? [])].sort((a, b) => a.order - b.order)[0];

  const head = (e: LayoutChangeEvent) => setHeadHeight(e.nativeEvent.layout.height);
  // The fold sits under the first meaning (and the page dots when there are several).
  const meaningLaid = (e: LayoutChangeEvent) => onFold(headHeight + e.nativeEvent.layout.height + (definitions.length > 1 ? 22 : 0));

  return (
    <>
      <View onLayout={head} className="mb-2 flex-row items-center gap-3">
        <Text className="flex-1 font-body-semibold text-[26px] leading-[34px]">{content(word)}</Text>
        {entry ? <AudioButton word={entry} /> : null}
      </View>

      {definitions.length === 0 ? (
        <Text onLayout={meaningLaid} className="font-body text-[15px] leading-[23px] text-subtle">
          {t('dictionary.noDefinition')}
        </Text>
      ) : (
        <>
          {/* One page per definition; swipe sideways between them. */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: page * pageWidth, y: 0 }}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
            style={{ marginHorizontal: -SIDE }}
          >
            {definitions.map((d, i) => {
              const ex = example(d);
              return (
                <View key={d.id} style={{ width: pageWidth, marginHorizontal: SIDE }}>
                  <Text onLayout={i === page ? meaningLaid : undefined} className="font-body text-[16px] leading-[24px] text-[#485970]">
                    {meaningOf(d) || t('dictionary.noDefinition')}
                  </Text>
                  {ex ? (
                    <View className="mt-4">
                      <Text className="font-body text-[11px] leading-[16px] text-[#93a0b3]">{t('dictionary.example')}</Text>
                      <Text className="mt-2 font-body text-[15px] leading-[24px] text-[#485970]">{content(ex.text)}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
          {definitions.length > 1 ? (
            <View accessibilityLabel={`${page + 1} / ${definitions.length}`} className="mt-3 flex-row justify-center gap-1.5">
              {definitions.map((d, i) => (
                <View key={d.id} className={cn('h-1.5 rounded-full', i === page ? 'w-4 bg-primary' : 'w-1.5 bg-[#d6e2f3]')} />
              ))}
            </View>
          ) : null}
        </>
      )}

      <View className="mt-7 gap-2.5">
        {!entry ? (
          <Button
            variant="soft"
            icon={request.data ? 'check' : undefined}
            label={request.data ? t('dictionary.requested') : t('dictionary.request')}
            loading={request.loading}
            disabled={!!request.data}
            onPress={() => void requestDefinition({ variables: { word } })}
          />
        ) : null}
        <Saving />
      </View>
    </>
  );
}
