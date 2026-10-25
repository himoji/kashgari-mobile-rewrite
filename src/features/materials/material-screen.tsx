import { useQuery } from '@apollo/client/react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MATERIALS_TEXT } from '@/features/materials/gql';
import { sectionName } from '@/features/materials/library-items';
import { coverTint, materialArt } from '@/features/materials/material-art';
import { kindFlags, levelOf, materialParam, type MaterialKind } from '@/features/materials/material-ref';
import { countWords, tokenize } from '@/features/materials/reading-words';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { BackBar } from '@/ui/back-bar';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Dialog } from '@/ui/dialog';
import { ErrorState, NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

const SIZES = [14, 16, 18, 20, 22];
const openWord = (word: string) => router.push({ pathname: '/word', params: { word } });

function FontButton({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-control bg-surface active:bg-canvas"
      style={{ boxShadow: 'inset 0 0 0 1px #d3d5de', opacity: disabled ? 0.4 : 1 }}
    >
      <Text className="font-body-semibold text-[15px] leading-[22.5px] text-black">{label}</Text>
    </Pressable>
  );
}

function ListenButton({ url }: { url: string }) {
  const { t } = useTranslation();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  return (
    <Button
      variant="soft"
      className="mt-4 self-start"
      icon={status.playing ? 'pause' : 'play'}
      label={status.playing ? t('materials.pause') : t('materials.listen')}
      onPress={() => (status.playing ? player.pause() : player.play())}
    />
  );
}

/** A library material: what it is, its text with tappable words, its key words, and "Тағайындау". */
export function MaterialScreen() {
  const { t, i18n } = useTranslation();
  const content = useContentText();
  const insets = useSafeAreaInsets();
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: string }>();
  const kind: MaterialKind = kindParam === 'tyndalym' || kindParam === 'grammar' ? kindParam : 'oqylym';
  const { data, loading, error, refetch } = useQuery(MATERIALS_TEXT, { variables: { id, ...kindFlags(kind) } });
  const [size, setSize] = useState(1);
  const [exercises, setExercises] = useState(false);

  const text = kind === 'oqylym' ? data?.oqylymText : kind === 'tyndalym' ? data?.tyndalymText : null;
  const audioUrl = data?.tyndalymText?.audioUrl ?? null;
  const title = text?.title ?? data?.durysTitle?.title ?? '';
  const level = levelOf(text?.complexity);
  const grade = text?.section?.grade.grade;
  const topic = text?.section ? sectionName(text.section.name, text.section.section, i18n.language, t('materials.section')) : null;
  const paragraphs = (text?.paragraphs ?? []).map((p) => p.text);
  const fontSize = SIZES[size]!;
  const assign = () => router.push({ pathname: '/teacher/assign/new', params: { material: materialParam({ kind, id }) } });

  let body;
  if (error) body = <ErrorState onRetry={() => void refetch()} />;
  else if (loading && !data) body = <><Skeleton className="h-[260px]" /><Skeleton className="h-[400px]" /></>;
  else
    body = (
      <>
        <View className="mb-1 gap-3 rounded-sheet bg-[#e8edff] p-5">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <View className="flex-row flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <View className="rounded-[7px] bg-surface px-[9px] py-[5px]">
                  <Text className="font-body text-[13px] leading-[18.2px] text-meta">{t(`materials.modules.${kind}`)}</Text>
                </View>
                <Text className="font-body text-[13px] leading-[18px] text-body">
                  {[level, grade != null ? t('materials.gradeValue', { grade }) : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Text className="mb-2.5 mt-3.5 font-body-semibold text-[22px] leading-[28px]">{content(title)}</Text>
              {topic ? <Text className="font-body text-[14px] leading-[21px] text-body">{content(topic)}</Text> : null}
            </View>
            <View className="h-[84px] w-[84px] overflow-hidden rounded-2xl" style={{ backgroundColor: coverTint[kind] }}>
              <Image
                source={text?.thumbnail ? { uri: text.thumbnail } : materialArt[kind]}
                style={{ width: 84, height: 84 }}
                contentFit={text?.thumbnail ? 'cover' : 'contain'}
              />
            </View>
          </View>
          <View className="mt-2.5 flex-row gap-2">
            {kind !== 'grammar' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setExercises(true)}
                className="min-h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-control bg-[#f3f7ff] px-[13px] py-1.5 active:opacity-80"
              >
                <Icon name="play" size={16} color={colors.link} />
                <Text className="shrink text-center font-body-semibold text-[13px] leading-[18px] text-link">{t('materials.tryExercises')}</Text>
              </Pressable>
            ) : null}
            <Button variant="strong" size="lg" className="h-[50px] flex-1" icon="plus" label={t('materials.assignShort')} onPress={assign} />
          </View>
        </View>

        {kind === 'grammar' ? (
          <NotReady body={t('materials.grammarBody')} />
        ) : (
          <>
            <Card variant="panel">
              <View className="flex-row items-start justify-between gap-2.5">
                <Text className="flex-1 font-body-semibold text-[20px] leading-[25px]">{content(title)}</Text>
                <View className="flex-row gap-1.5">
                  <FontButton label="A−" a11y={t('materials.smallerText')} disabled={size === 0} onPress={() => setSize((s) => Math.max(0, s - 1))} />
                  <FontButton label="A+" a11y={t('materials.largerText')} disabled={size === SIZES.length - 1} onPress={() => setSize((s) => Math.min(SIZES.length - 1, s + 1))} />
                </View>
              </View>
              <Text className="font-body text-[13px] leading-[18.85px] text-body">
                {[level, t('materials.wordsCount', { count: countWords(paragraphs) })].filter(Boolean).join(' · ')}
              </Text>
              {audioUrl ? <ListenButton url={audioUrl} /> : null}
              <View className="mt-6">
                {paragraphs.map((p, i) => {
                  // Look words up in their original script even when the text is shown in Latin.
                  const source = tokenize(p);
                  return (
                    <Text key={i} className="mb-3 font-reading text-ink" style={{ fontSize, lineHeight: fontSize * 1.6 }}>
                      {tokenize(content(p)).map((tok, j) => {
                        const word = source[j]?.word ?? tok.word;
                        return word ? (
                          <Text key={j} onPress={() => openWord(word)}>
                            {tok.text}
                          </Text>
                        ) : (
                          tok.text
                        );
                      })}
                    </Text>
                  );
                })}
              </View>
            </Card>

            {text?.baseWords.length ? (
              <Card variant="panel">
                <Text className="mb-3 font-body-semibold text-[20px] leading-[26px]">{t('materials.words')}</Text>
                <View className="gap-2">
                  {text.baseWords.map((w) => (
                    <Pressable
                      key={w}
                      accessibilityRole="button"
                      onPress={() => openWord(w)}
                      className="min-h-12 flex-row items-center justify-between gap-3 border-b border-line px-0.5 py-2 active:bg-canvas"
                    >
                      <Text className="font-body text-[16px] leading-[24px] text-black">{content(w)}</Text>
                      <Icon name="arrow" size={16} color={colors.ink} />
                    </Pressable>
                  ))}
                </View>
              </Card>
            ) : null}

            <Card variant="panel">
              <Text className="mb-3 font-body-semibold text-[20px] leading-[26px]">{t('materials.exercises')}</Text>
              <Text className="mb-3 font-body text-[15px] leading-[23.25px] text-meta">{t('materials.exercisesHint')}</Text>
              <Button variant="soft" className="bg-[#f3f7ff]" icon="play" label={t('materials.tryExercises')} onPress={() => setExercises(true)} />
            </Card>
          </>
        )}
      </>
    );

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('materials.title')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32, gap: 12 }}>{body}</ScrollView>
      <Dialog visible={exercises} title={t('materials.exercises')} onClose={() => setExercises(false)}>
        <NotReady />
      </Dialog>
    </View>
  );
}
