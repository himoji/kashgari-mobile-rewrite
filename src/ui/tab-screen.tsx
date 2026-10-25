import { Image } from 'expo-image';
import { useScrollToTop, type Href } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { goBack } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { gradient } from '@/ui/gradient';
import { Icon } from '@/ui/icon';
import { DOCK_HEIGHT, dockBottom } from '@/ui/pill-tab-bar';
import { BoundaryGap } from '@/ui/query-boundary';
import { Text } from '@/ui/text';
import { VirtualList } from '@/ui/virtual-list';

const mascots = {
  home: require('@/assets/images/mascot/home.webp'),
  learning: require('@/assets/images/mascot/learning.webp'),
  results: require('@/assets/images/mascot/results.webp'),
  settings: require('@/assets/images/mascot/settings.webp'),
};
export type MascotPose = keyof typeof mascots;

/** The white dot grid that fades out from the top right of the hero. */
function HeroPattern() {
  return (
    <Svg
      width="100%"
      height={210}
      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id="dots" width={9} height={9} patternUnits="userSpaceOnUse">
          <Circle cx={4.5} cy={4.5} r={2.5} fill="#ffffff" fillOpacity={0.36} />
        </Pattern>
        <RadialGradient id="fade" cx="75%" cy="10%" rx="75%" ry="90%">
          <Stop offset="0.15" stopColor="#fff" stopOpacity={1} />
          <Stop offset="0.8" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id="mask">
          <Rect width="100%" height="100%" fill="url(#fade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" mask="url(#mask)" />
    </Svg>
  );
}

type Props = {
  title: string;
  /** Omitted on pages the design shows without the squirrel (teacher School, Reports). */
  mascot?: MascotPose;
  /** Top-right buttons on the orange hero (IconButton tone="glass"). */
  actions?: ReactNode;
  /** Dock pages opened from another page (no tab of their own): a back link on the hero, and where it goes when there is no history. */
  back?: Href;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  /**
   * Long lists: the page becomes a virtualised list. The hero and `children` scroll above the rows,
   * which a `<ListRows>` somewhere in `children` supplies; the white sheet runs on around them.
   */
  list?: boolean;
  /** List mode: draw the content over the rows, for dropdowns that open past it. */
  raiseHeader?: boolean;
};

/** Every bottom-tab page: orange workspace, title with the squirrel, white sheet of content above the dock. */
export function TabScreen({
  title,
  mascot,
  actions,
  back,
  children,
  refreshing,
  onRefresh,
  className,
  list,
  raiseHeader,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 20) + 10;
  const scroll = useRef<ScrollView>(null);
  useScrollToTop(scroll);
  const paddingBottom = dockBottom(insets.bottom) + DOCK_HEIGHT + 24;
  const refreshControl = onRefresh ? (
    <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#fff" />
  ) : undefined;
  const hero = (
    <>
      {/* Orange also runs above the content, so a pull-to-refresh or an inset top never shows white. */}
      <View className="absolute inset-x-0 -top-[1000px] h-[1000px] bg-workspace" />
      <View className="absolute inset-x-0 top-0 h-[284px]" style={gradient('workspace')} />
      <HeroPattern />
      <View
        className="h-11 flex-row items-center justify-end gap-1.5 px-5"
        style={{ marginTop: top }}
      >
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.actions.back')}
            onPress={() => goBack(back)}
            className="press -ml-2 mr-auto h-11 flex-row items-center gap-1.5 rounded-[24px] pl-2 pr-3 active:bg-white/20"
          >
            <Icon name="back" size={20} color={colors.white} />
            <Text className="font-body-medium text-[12px] leading-[18px] text-white" maxFontSizeMultiplier={1.3}>
              {t('common.actions.back')}
            </Text>
          </Pressable>
        ) : null}
        {actions}
      </View>
      <View className="mx-[14px] -mt-2 h-32 flex-row items-center px-1.5 pb-[18px] pt-2.5">
        <Text variant="display" tone="inverse" className="flex-1" numberOfLines={2}>
          {title}
        </Text>
        {mascot ? (
          <Image
            source={mascots[mascot]}
            style={{
              width: 144,
              height: 128,
              marginRight: -9,
              marginTop: -10,
              marginBottom: -18,
            }}
            contentFit="contain"
          />
        ) : null}
      </View>
    </>
  );

  if (list) {
    return (
      <View className="flex-1 bg-surface">
        <VirtualList
          ref={scroll as never}
          contentContainerStyle={{ paddingBottom }}
          contentInsetAdjustmentBehavior="never"
          refreshControl={refreshControl}
          raiseHeader={raiseHeader}
          header={
            <>
              {hero}
              <View className={cn('mx-[14px] gap-3 rounded-t-sheet bg-surface px-2.5 pt-2.5', className)}>
                <BoundaryGap value={12}>{children}</BoundaryGap>
              </View>
            </>
          }
          rowClassName="mx-[14px] bg-surface px-2.5"
          renderFooter={(footer) => <View className="mx-[14px] rounded-b-sheet bg-surface px-2.5 pb-2.5">{footer}</View>}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingBottom }}
        contentInsetAdjustmentBehavior="never"
        refreshControl={refreshControl}
      >
        {hero}
        <View className={cn('mx-[14px] gap-3 rounded-sheet bg-surface p-2.5', className)}>
          <BoundaryGap value={12}>{children}</BoundaryGap>
        </View>
      </ScrollView>
    </View>
  );
}
