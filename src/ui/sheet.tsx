import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Keyframe, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { scheduleOnRN } from 'react-native-worklets';

import { motion } from '@/lib/motion';
import { Backdrop } from '@/ui/backdrop';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';
import { useEscape } from '@/ui/use-escape';

type Props = {
  title: string;
  description?: string;
  onClose?: () => void;
  /** Long lists: open at full height, so the sheet doesn't grow once its data loads. */
  tall?: boolean;
  /** Off when the content scrolls itself (a virtualised list): it then fills the sheet below the title. */
  scroll?: boolean;
  children: ReactNode;
};

/** material-rise: the panel lifts 32px while the route's fade brings in the backdrop. */
const rise = new Keyframe({
  0: { opacity: 0.6, transform: [{ translateY: 32 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: motion.sheet.easing },
}).duration(motion.sheet.duration);

/** Past this drag (or a fast flick) the handle closes the sheet; otherwise it springs back. */
const DISMISS = 96;
// Gesture.Pan is a builder, not a component; the alias keeps the compiler's capitalized-call check quiet.
// Through the alias the worklets plugin no longer spots the callbacks, so they say 'worklet' themselves.
const panGesture = () => Gesture.Pan();

function Heading({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <Text variant="display" className="mb-2.5 text-[25px] leading-[30px]">{title}</Text>
      {description ? <Text className="mb-5 font-body text-[13px] leading-[20px] text-muted">{description}</Text> : null}
    </>
  );
}

/** Bottom sheet from the design (rounded top, handle, display title). Render it inside a transparent modal route. */
export function Sheet({ title, description, onClose, tall, scroll = true, children }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  useEscape(onClose);
  const drag = useSharedValue(0);

  const pan = panGesture()
    .enabled(!!onClose)
    .onChange((e) => {
      'worklet';
      drag.set(Math.max(0, drag.get() + e.changeY));
    })
    .onEnd((e) => {
      'worklet';
      if (onClose && (drag.get() > DISMISS || e.velocityY > 900)) scheduleOnRN(onClose);
      else drag.set(withSpring(0, { damping: 22, stiffness: 260 }));
    });
  const dragged = useAnimatedStyle(() => ({ transform: [{ translateY: drag.get() }] }));

  return (
    <View className="flex-1 justify-end">
      <Backdrop color="#24263155" blur={3} label={t('common.actions.close')} onPress={onClose} />
      <Animated.View entering={rise} style={{ maxHeight: '85%', height: tall ? '85%' : undefined }}>
        <Animated.View style={[{ flexShrink: 1, flexGrow: tall ? 1 : 0 }, dragged]}>
          <View className={cn('shrink rounded-t-sheet bg-surface px-5', tall && 'flex-1')} style={{ paddingBottom: insets.bottom + 24 }}>
            <GestureDetector gesture={pan}>
              <View className="pb-5 pt-3">
                <View className="h-1 w-10 self-center rounded bg-[#dce1eb]" />
              </View>
            </GestureDetector>
            {scroll ? (
              <ScrollView bounces={false}>
                <Heading title={title} description={description} />
                {children}
              </ScrollView>
            ) : (
              <>
                <Heading title={title} description={description} />
                <View className="flex-1">{children}</View>
              </>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
