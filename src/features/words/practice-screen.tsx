import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DICTIONARY_WORD } from '@/features/dictionary/gql';
import { useWordAudio } from '@/features/dictionary/word-audio';
import { useSavedWords, type SavedWord } from '@/features/words/saved-words';
import { useContentText } from '@/lib/i18n';
import { goBack } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { NotReady } from '@/ui/feedback';
import { BackBar } from '@/ui/back-bar';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

function Listen({ word }: { word: string }) {
  const { t } = useTranslation();
  const { data } = useQuery(DICTIONARY_WORD, { variables: { word } });
  const play = useWordAudio(data?.word);
  return (
    <View className="mt-4 flex-row items-center justify-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('words.listen')}
        disabled={!play}
        onPress={play ?? undefined}
        className={cn(
          'h-11 w-11 items-center justify-center rounded-control bg-[#eff6ff] active:opacity-80',
          !play && 'opacity-50',
        )}
      >
        <Icon name="audio" size={20} color={colors.ink} />
      </Pressable>
      <Text className="font-body text-[12px] leading-[18px] text-subtle">{t('words.listen')}</Text>
    </View>
  );
}

function Flashcards({ words }: { words: SavedWord[] }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const content = useContentText();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[index]!;
  const last = index === words.length - 1;
  const move = (step: number) => {
    setIndex((i) => i + step);
    setFlipped(false);
  };
  return (
    <>
      <View className="px-5">
        <View className="mb-5 flex-row items-center gap-3">
          <Text className="font-body text-[12px] leading-[18px] text-subtle">
            {index + 1} / {words.length}
          </Text>
          <View className="h-[5px] flex-1 overflow-hidden rounded-[5px] bg-[#eaf1fc]">
            <View
              className="h-full rounded-[5px] bg-primary"
              style={{ width: `${((index + 1) / words.length) * 100}%` }}
            />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: flipped }}
          accessibilityHint={t('words.flip')}
          onPress={() => setFlipped((f) => !f)}
          className="h-[180px] items-center justify-center gap-3.5 rounded-[20px] bg-[linear-gradient(140deg,#4a93ff,#1e75f4)] px-[18px] py-6"
          style={{ boxShadow: '0 8px 20px rgba(30, 117, 244, 0.1)' }}
        >
          <Text className="font-body text-[11px] leading-[16px] text-subtle">
            {flipped ? t('words.meaning') : t('words.word')}
          </Text>
          <Text className="text-center font-body-semibold text-[28px] leading-[36px] text-white">
            {flipped ? word.meaning : content(word.word)}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Icon name="copy" size={15} color="#7798c5" />
            <Text className="font-body text-[11px] leading-[16.5px] text-[#7798c5]">
              {t('words.flip')}
            </Text>
          </View>
        </Pressable>
        <Listen word={word.word} />
      </View>
      <View
        className="absolute inset-x-0 flex-row gap-2.5 bg-white/95 px-5 pt-3"
        style={{ bottom: 0, paddingBottom: Math.max(insets.bottom, 18) }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('words.previous')}
          disabled={index === 0}
          onPress={() => move(-1)}
          className={cn(
            'h-[46px] w-[46px] items-center justify-center rounded-control bg-[#eff6ff]',
            index === 0 && 'opacity-50',
          )}
        >
          <Icon name="back" size={20} color={colors.link} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => (last ? goBack('/student/words') : move(1))}
          className="h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-control bg-attention active:opacity-90"
        >
          <Text className="font-body-semibold text-[13px] leading-[18px] text-white">
            {last ? t('words.finish') : t('words.nextWord')}
          </Text>
          {last ? null : <Icon name="arrow" size={18} color={colors.white} />}
        </Pressable>
      </View>
    </>
  );
}

/** Flashcard practice over saved words. */
export function PracticeScreen() {
  const { t } = useTranslation();
  const { words, ready } = useSavedWords();
  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('words.title')} />
      <View className="flex-1 pt-3">
        {words.length ? (
          <>
            <Text className="mx-5 mb-5 font-body-semibold text-[22px] leading-[29px]">
              {t('words.practiceTitle')}
            </Text>
            <Flashcards words={words} />
          </>
        ) : (
          <View className="items-center gap-3 px-7 py-7">
            <Text className="text-center font-body-semibold text-[17px] leading-[23px]">
              {t('words.noPractice')}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.navigate('/student/words')}
              className="mt-[5px] h-11 items-center justify-center rounded-control bg-[#f3f7ff] px-[13px] active:opacity-80"
            >
              <Text className="font-body-semibold text-[13px] leading-[18px] text-link">
                {t('words.title')}
              </Text>
            </Pressable>
          </View>
        )}
        {ready ? null : <NotReady body={t('words.notReady')} className="mx-5" />}
      </View>
    </View>
  );
}
