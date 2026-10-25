import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSavedWords } from '@/features/words/saved-words';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { NotReady } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

function Empty() {
  const { t } = useTranslation();
  return (
    <View className="items-center gap-3 px-2.5 py-7">
      <View className="h-[54px] w-[54px] items-center justify-center rounded-[16px] bg-tile">
        <Icon name="solid-book" size={20} color="#6a9cdd" />
      </View>
      <Text className="text-center font-body-semibold text-[17px] leading-[23px]">
        {t('words.emptyTitle')}
      </Text>
      <Text className="text-center font-body text-[13px] leading-[20px] text-subtle">
        {t('words.emptyBody')}
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.navigate('/student/league')}
        className="mt-[5px] h-11 flex-row items-center justify-center gap-2 rounded-control bg-[#f3f7ff] px-[13px] active:opacity-80"
      >
        <Text className="font-body-semibold text-[13px] leading-[18px] text-link">
          {t('words.startReading')}
        </Text>
        <Icon name="arrow" size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

/** My words: saved words with their meaning, and the way into flashcard practice. */
export function WordsScreen() {
  const { t } = useTranslation();
  const content = useContentText();
  const { words, ready } = useSavedWords();
  return (
    <TabScreen
      title={t('words.title')}
      mascot="learning"
      actions={
        <View className="flex-1 flex-row">
          <IconButton
            icon="back"
            tone="glass"
            label={t('common.actions.back')}
            onPress={() => router.back()}
          />
        </View>
      }
    >
      <View>
        <View className="mb-3.5 flex-row items-center gap-2 px-[5px]">
          <Text className="font-body-medium text-[13px] leading-[20px] text-subtle">
            {t('words.saved')}
          </Text>
          <View className="h-[22px] min-w-[22px] items-center justify-center rounded-[7px] bg-[#f0f5fc] px-1.5">
            <Text className="font-body text-[11px] leading-[16.5px] text-subtle">
              {words.length}
            </Text>
          </View>
        </View>
        <View className="gap-2.5">
          {words.length ? (
            words.map((w) => (
              <Pressable
                key={w.word}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/word', params: { word: w.word } })}
                className="gap-1 rounded-[16.5px] bg-surface p-[13px] shadow-item active:opacity-80"
              >
                <Text variant="strong">{content(w.word)}</Text>
                <Text variant="caption">{w.meaning}</Text>
              </Pressable>
            ))
          ) : (
            <Empty />
          )}
          {ready ? null : <NotReady body={t('words.notReady')} />}
        </View>
        {words.length ? (
          <Button
            variant="attention"
            icon="solid-book"
            label={t('words.practise')}
            className="mt-5"
            onPress={() => router.push('/student/practice')}
          />
        ) : null}
      </View>
    </TabScreen>
  );
}
