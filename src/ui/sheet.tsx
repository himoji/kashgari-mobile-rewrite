import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/ui/text';
import { useEscape } from '@/ui/use-escape';

type Props = { title: string; description?: string; onClose?: () => void; children: ReactNode };

/** Bottom sheet from the design (rounded top, handle, display title). Render it inside a transparent modal route. */
export function Sheet({ title, description, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  useEscape(onClose);
  return (
    <View className="flex-1 justify-end">
      <Pressable accessibilityLabel="close" className="absolute inset-0 bg-[#24263155]" onPress={onClose} disabled={!onClose} />
      <View className="max-h-[85%] rounded-t-sheet bg-surface px-5 pt-3" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="mb-5 h-1 w-10 self-center rounded bg-[#dce1eb]" />
        <ScrollView bounces={false}>
          <Text variant="display" className="mb-2.5 text-[25px] leading-[30px]">{title}</Text>
          {description ? <Text className="mb-5 font-body text-[13px] leading-[20px] text-muted">{description}</Text> : null}
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
