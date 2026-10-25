import { useQuery, useSuspenseQuery } from '@apollo/client/react';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MATERIALS_WORD_BANK, MATERIALS_WORD_TRANSLATION } from '@/features/materials/gql';
import { useContentText } from '@/lib/i18n';
import { goBack } from '@/lib/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/dialog';
import { NotReady, Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Sheet } from '@/ui/sheet';
import { Text } from '@/ui/text';
import { ListRows, VirtualList } from '@/ui/virtual-list';

/**
 * The API looks words up one at a time (`word(wordCyrillic)`, no list form), so each row asks for its
 * own translation. Only rows on screen mount (the list virtualises), and at most this many lookups run
 * at once; the rest wait their turn.
 */
const MAX_LOOKUPS = 4;
let lookups = 0;
const waiting: (() => void)[] = [];

function nextLookup() {
  lookups -= 1;
  const start = waiting.shift();
  if (start) {
    lookups += 1;
    start();
  }
}

/** True once this row may send its lookup; `needed` false (the lookup finished, or unmount) frees the turn. */
function useLookupTurn(needed: boolean) {
  const [turn, setTurn] = useState(false);
  useEffect(() => {
    if (!needed) return;
    let held = false;
    const start = () => {
      held = true;
      setTurn(true);
    };
    if (lookups < MAX_LOOKUPS) {
      lookups += 1;
      start();
    } else waiting.push(start);
    return () => {
      const queued = waiting.indexOf(start);
      if (queued >= 0) waiting.splice(queued, 1);
      if (held) nextLookup();
    };
  }, [needed]);
  return turn;
}

function WordRow({ word, onEdit }: { word: string; onEdit: () => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  const [done, setDone] = useState(false);
  const turn = useLookupTurn(!done);
  // cache-first: dictionary translations don't change, so a word seen before needs no request.
  const { data, loading } = useQuery(MATERIALS_WORD_TRANSLATION, { variables: { word }, skip: !turn, fetchPolicy: 'cache-first' });
  if (turn && !loading && !done) setDone(true);
  const def = data?.word?.definitions[0];
  const meaning = [def?.translationRussian, def?.translationEnglish].filter(Boolean).join(' · ');
  return (
    <View className="flex-row items-center justify-between gap-3 py-3">
      <Pressable accessibilityRole="button" className="press flex-1" onPress={() => router.push({ pathname: '/word', params: { word } })}>
        <Text className="font-body-bold text-[16px] leading-[24px]">{content(word)}</Text>
        <Text className="font-body text-[15px] leading-[23.25px] text-meta">{meaning || ' '}</Text>
      </Pressable>
      <Button variant="secondary" className="h-11 px-4" label={t('materials.edit')} onPress={onEdit} />
    </View>
  );
}

/** "Сөздік қоры": vocabulary by topic, with translations from the dictionary. */
export function WordBankScreen() {
  const { t } = useTranslation();
  const [notReady, setNotReady] = useState(false);

  return (
    <>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Sheet title={t('materials.wordBank')} tall scroll={false} onClose={() => goBack()}>
        <QueryBoundary
          fallback={
            <View className="gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </View>
          }
        >
          <WordBank onEdit={() => setNotReady(true)} />
        </QueryBoundary>
        <View className="mt-4 flex-row gap-2">
          <Button variant="secondary" className="flex-1" label={t('materials.close')} onPress={() => goBack()} />
          <Button className="flex-1" label={t('materials.addWord')} onPress={() => setNotReady(true)} />
        </View>
      </Sheet>
      <Dialog visible={notReady} title={t('materials.wordBank')} onClose={() => setNotReady(false)}>
        <NotReady body={t('materials.wordBankBody')} />
      </Dialog>
    </>
  );
}

function WordBank({ onEdit }: { onEdit: () => void }) {
  const content = useContentText();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(MATERIALS_WORD_BANK, { queryKey });
  const [topic, setTopic] = useState(0);
  const topics = data.topics;
  const words = [...new Set((topics[topic]?.levels ?? []).flatMap((l) => l.words.map((w) => w.word)))];

  return (
    <VirtualList
      bounces={false}
      header={
        <>
          {topics.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 mb-2" contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
              {topics.map((tp, i) => (
                <Pressable
                  key={tp.name}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: i === topic }}
                  onPress={() => setTopic(i)}
                  hitSlop={{ top: 4, bottom: 4 }}
                  className={cn('press h-9 justify-center rounded-tile px-3', i === topic ? 'bg-primary-strong' : 'bg-track')}
                >
                  <Text
                    className={cn('font-body-semibold text-[12px]', i === topic ? 'text-white' : 'text-link')}
                    maxFontSizeMultiplier={1.3}
                  >
                    {content(tp.name)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <ListRows data={words} keyExtractor={(w) => w} gap={4} renderItem={(w) => <WordRow word={w} onEdit={onEdit} />} />
        </>
      }
    />
  );
}
