import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { pageText, type BookPage } from '@/features/reader/book';
import { useContentText } from '@/lib/i18n';
import { motion } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { useModalMotion } from '@/ui/dialog';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = {
  visible: boolean;
  pages: BookPage[];
  page: number;
  onSelect: (page: number) => void;
  onClose: () => void;
};

/** "Choose a page" sheet: jump field plus every page with its opening words. */
export function PageContents({ visible, pages, page, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const content = useContentText();
  const [jump, setJump] = useState('');
  const go = () => {
    const n = Number.parseInt(jump, 10);
    if (n >= 1 && n <= pages.length) onSelect(n - 1);
  };
  const { mounted, backdrop, panel } = useModalMotion(visible, 32, motion.sheet);
  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
          <Pressable
            accessibilityLabel={t('common.actions.close')}
            className="flex-1 bg-[#24263140]"
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={[{ height: '88%' }, panel]}>
          <View
            className="flex-1 rounded-t-[26px] bg-surface px-5 pt-5"
            style={{
              paddingBottom: insets.bottom + 24,
              boxShadow: '0 -12px 48px rgba(34, 50, 72, 0.125)',
            }}
          >
            <View className="mb-3.5 flex-row items-center justify-between gap-3 pb-[15px] pt-2.5">
              <Text className="font-body-medium text-[20px] leading-[26px]">
                {t('reader.choosePage')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.actions.close')}
                onPress={onClose}
                className="h-8 w-8 items-center justify-center rounded-full bg-[#f3f6fa] active:opacity-80"
              >
                <Icon name="close" size={16} color={colors.subtle} />
              </Pressable>
            </View>
            <Text className="mb-2 font-body-medium text-[14px] leading-[21px] text-[#52627b]">
              {t('reader.pageCount', { total: pages.length })}
            </Text>
            <View className="mb-[18px] flex-row gap-2.5">
              <TextInput
                value={jump}
                onChangeText={setJump}
                onSubmitEditing={go}
                placeholder={String(page + 1)}
                placeholderTextColor={colors.primary}
                keyboardType="number-pad"
                returnKeyType="go"
                accessibilityLabel={t('reader.choosePage')}
                className="h-[51px] w-0 flex-1 rounded-control bg-[#eef4ff] px-3 font-body text-[16px] text-ink"
              />
              <Button label={t('reader.go')} onPress={go} className="h-[51px] w-[90px]" size="lg" />
            </View>
            <ScrollView bounces={false} contentContainerClassName="gap-[5px]">
              {pages.map((p, i) => {
                const current = i === page;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityState={{ selected: current }}
                    onPress={() => onSelect(i)}
                    className={cn(
                      'flex-row items-center gap-3 rounded-control px-2.5 py-3.5',
                      current ? 'bg-[#e7f0ff] active:bg-[#e7f0ff]' : 'active:bg-canvas',
                    )}
                  >
                    <Text className="w-6 font-body-bold text-[14px] leading-[21px] text-primary">
                      {i + 1}
                    </Text>
                    <Text
                      numberOfLines={2}
                      className={cn(
                        'flex-1 font-body text-[14px] leading-[21px]',
                        current ? 'text-primary' : 'text-[#52627b]',
                      )}
                    >
                      {content(pageText(p))}
                    </Text>
                    {current ? <Icon name="check" size={20} color={colors.ink} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
