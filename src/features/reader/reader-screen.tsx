import { useSuspenseQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { paginate, type Token } from '@/features/reader/book';
import { READER_TEXT } from '@/features/reader/gql';
import { PageContents } from '@/features/reader/page-contents';
import { useReaderPrefs } from '@/features/reader/reader-prefs';
import { ReadingGuide } from '@/features/reader/reading-guide';
import { useContentText } from '@/lib/i18n';
import { pageIn } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { NotReady, Skeleton } from '@/ui/feedback';
import { BackBar } from '@/ui/back-bar';
import { Icon } from '@/ui/icon';
import { ProgressBar } from '@/ui/progress-bar';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

function Words({ tokens, fontSize }: { tokens: Token[]; fontSize: number }) {
  const content = useContentText();
  return (
    <Text variant="reading" style={{ fontSize, lineHeight: fontSize * 1.6 }}>
      {tokens.map((token, i) =>
        token.lookup ? (
          <Text
            key={i}
            suppressHighlighting={false}
            onPress={() =>
              router.push({
                pathname: '/word',
                params: {
                  word: token.lookup!,
                  ...(token.def != null ? { def: String(token.def) } : {}),
                },
              })
            }
            variant="reading"
            style={{ fontSize, lineHeight: fontSize * 1.6 }}
          >
            {content(token.text)}
          </Text>
        ) : (
          token.text
        ),
      )}
    </Text>
  );
}

function FontButton({ label, step, disabled }: { label: string; step: number; disabled: boolean }) {
  const { t } = useTranslation();
  const changeFont = useReaderPrefs((s) => s.changeFont);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(step < 0 ? 'reader.smaller' : 'reader.larger')}
      disabled={disabled}
      onPress={() => changeFont(step)}
      className="h-11 w-[38px] items-center justify-center rounded-tile bg-[#f3f6fa] active:opacity-80"
      style={{ boxShadow: 'inset 0 0 0 1px #d3d5de' }}
    >
      <Text className="font-body-semibold text-[13px] leading-[19.5px]">{label}</Text>
    </Pressable>
  );
}

/** The scrolling page area and the back / next footer, shared by the reader and its skeleton. */
function ReaderBody({
  scroll,
  children,
  page,
  last,
  disabled,
  onMove,
}: {
  scroll?: Ref<ScrollView>;
  children: ReactNode;
  page: number;
  last: boolean;
  disabled?: boolean;
  onMove: (step: number) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <>
      <ScrollView
        ref={scroll}
        // One style object: next to contentContainerClassName, native drops the class (no side padding).
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 + insets.bottom }}
      >
        {children}
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 flex-row gap-2.5 bg-white/95 px-5 pt-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          boxShadow: '0 -6px 18px rgba(38, 52, 73, 0.024)',
        }}
      >
        <Pressable
          accessibilityRole="button"
          disabled={page === 0}
          onPress={() => onMove(-1)}
          className={cn(
            'h-[46px] w-24 flex-row items-center justify-center gap-[7px] rounded-control bg-[#f3f7ff] px-2 active:opacity-80',
            page === 0 && 'opacity-50',
          )}
        >
          <Icon name="back" size={18} color={colors.link} />
          <Text className="font-body-semibold text-[14px] leading-[18px] text-link">
            {t('reader.back')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={last || disabled}
          onPress={() => onMove(1)}
          className={cn(
            'h-[46px] flex-1 flex-row items-center justify-center gap-[7px] rounded-control bg-attention px-2 active:opacity-90',
            (last || disabled) && 'opacity-50',
          )}
        >
          <Text className="font-body-semibold text-[14px] leading-[18px] text-white">
            {last ? t('reader.quiz') : t('reader.next')}
          </Text>
          <Icon name="arrow" size={18} color={colors.white} />
        </Pressable>
      </View>
    </>
  );
}

function ReaderSkeleton() {
  return (
    <ReaderBody page={0} last disabled onMove={() => {}}>
      <View className="gap-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-11" />
        <Skeleton className="h-60" />
      </View>
    </ReaderBody>
  );
}

/** League reader: one page at a time, A−/A+, tap any word for its dictionary sheet. */
export function ReaderScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { guideSeen, seeGuide } = useReaderPrefs();
  // Shown by itself until dismissed once; the help button reopens it.
  const [guideOpen, setGuideOpen] = useState<boolean | null>(null);
  const closeGuide = () => {
    seeGuide();
    setGuideOpen(false);
  };

  return (
    <View className="flex-1 bg-surface">
      <BackBar
        label={t('league.title')}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('reader.help')}
            onPress={() => setGuideOpen(true)}
            className="h-9 w-11 items-center justify-center rounded-[11px] bg-[#f3f6fb] active:opacity-80"
          >
            <Icon name="solid-help" size={20} color={colors.subtle} />
          </Pressable>
        }
      />
      <QueryBoundary fallback={<ReaderSkeleton />}>
        <Reader id={id} guide={guideOpen ?? !guideSeen} onCloseGuide={closeGuide} />
      </QueryBoundary>
    </View>
  );
}

function Reader({ id, guide, onCloseGuide }: { id: string; guide: boolean; onCloseGuide: () => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(READER_TEXT, { variables: { id }, queryKey });
  const fontSize = useReaderPrefs((s) => s.fontSize);
  const [contents, setContents] = useState(false);
  // Reading position has no backend yet, so it lives only while the reader is open.
  const [page, setPage] = useState(0);
  const scroll = useRef<ScrollView>(null);

  const text = data.oqylymText;
  const pages = useMemo(() => paginate(text?.paragraphs ?? []), [text]);
  const current = pages[Math.min(page, pages.length - 1)]!;
  const last = page >= pages.length - 1;

  const goTo = (target: number) => {
    setPage(Math.max(0, Math.min(pages.length - 1, target)));
    scroll.current?.scrollTo({ y: 0, animated: false });
    setContents(false);
  };

  // A text the API does not return keeps the skeleton, as before.
  if (!text) return <ReaderSkeleton />;

  return (
    <>
      <ReaderBody scroll={scroll} page={page} last={last} onMove={(step) => goTo(page + step)}>
        <Text variant="display" className="mb-4 text-[23px] leading-[31px]">
          {content(text.title)}
        </Text>
        <View className="mb-3 flex-row items-center justify-between gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('reader.choosePage')}
            onPress={() => setContents(true)}
            className="press h-11 flex-row items-center gap-[7px] rounded-[11px] bg-[#e7f0ff] px-3 active:opacity-80"
          >
            <Text className="font-body text-[13px] leading-[20px] text-primary">
              {t('reader.page', { page: page + 1, total: pages.length })}
            </Text>
            <Icon name="down" size={15} color={colors.primary} />
          </Pressable>
          <View className="flex-row gap-[3px]">
            <FontButton label="A−" step={-2} disabled={fontSize <= 16} />
            <FontButton label="A+" step={2} disabled={fontSize >= 28} />
          </View>
        </View>
        <ProgressBar
          value={(page + 1) / pages.length}
          accessibilityLabel={t('reader.progress')}
          accessibilityValue={{ min: 0, max: pages.length, now: page + 1 }}
          className="h-1 rounded-[5px] bg-[#e7f0ff]"
          fillClassName="rounded-[5px] bg-primary"
        />
        <Animated.View key={page} entering={pageIn} style={{ marginTop: 22, paddingBottom: 20 }}>
          {current.image ? (
            <Image
              source={current.image}
              style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 17, marginBottom: 14 }}
              contentFit="cover"
            />
          ) : null}
          <Words tokens={current.tokens} fontSize={fontSize} />
        </Animated.View>
        {last ? <NotReady body={t('reader.quizNotReady')} /> : null}
      </ReaderBody>

      <PageContents
        visible={contents}
        pages={pages}
        page={page}
        onSelect={goTo}
        onClose={() => setContents(false)}
      />
      <ReadingGuide visible={guide} onClose={onCloseGuide} />
    </>
  );
}
