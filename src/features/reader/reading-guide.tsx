import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DialogCard } from '@/features/dictionary/dialog-card';
import { useContentText } from '@/lib/i18n';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';

const faded = 'text-center font-body text-[11.5px] leading-[22px] text-[#9aaec9]/50';

/**
 * The prototype's illustration: faded lines of text, one tapped word and its tooltip. Laid out with
 * views, not SVG text: react-native-svg does not flow a centred line with an inline span, so the
 * highlighted word drifted off its box and over its neighbours.
 */
function GuideVisual() {
  const { t } = useTranslation();
  const content = useContentText();
  const lines = t('reader.guideLines', { returnObjects: true }) as string[];
  const word = content(t('reader.guideWord'));
  return (
    <View className="mb-5 items-center rounded-[17px] bg-[#edf4ff] px-3 pb-3 pt-3.5">
      {lines.slice(0, 2).map((line) => (
        <Text key={line} className={faded} numberOfLines={1}>{content(line)}</Text>
      ))}
      <View className="flex-row items-center">
        <Text className="font-body text-[11.5px] leading-[22px] text-[#617d9e]">{content(t('reader.guideBefore'))} </Text>
        <View className="rounded-[5px] bg-[#cee1ff] px-1.5">
          <Text className="font-body-semibold text-[11.5px] leading-[20px] text-[#2178ee]">{word}</Text>
          {/* The tap */}
          <View className="absolute -bottom-[13px] left-1/2 -ml-[9px] h-[18px] w-[18px] items-center justify-center rounded-full border border-[#73aaff] bg-[#8ebaff]/20">
            <View className="h-[6.4px] w-[6.4px] rounded-full bg-[#3683f6]" />
          </View>
        </View>
        <Text className="font-body text-[11.5px] leading-[22px] text-[#617d9e]"> {content(t('reader.guideAfter'))}</Text>
      </View>
      {lines.slice(2).map((line) => (
        <Text key={line} className={faded} numberOfLines={1}>{content(line)}</Text>
      ))}
      <View className="mt-2.5 items-center">
        <View className="h-2 w-2 translate-y-1 rotate-45 bg-white" />
        <View className="h-[30px] min-w-[150px] flex-row items-center gap-5 rounded-[9px] bg-white px-3.5">
          <Text className="font-body-semibold text-[11px] leading-[16px] text-ink">{word}</Text>
          <Text className="font-body text-[10px] leading-[14px] text-[#8490a3]">{t('reader.guideMeaning')}</Text>
        </View>
      </View>
    </View>
  );
}

export function ReadingGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <DialogCard onClose={onClose} className="px-4 pb-4">
        <GuideVisual />
        <View className="mb-5 items-center px-1.5">
          <Text className="mb-[9px] text-center font-body-semibold text-[20px] leading-[27px]">
            {t('reader.guideTitle')}
          </Text>
          <Text className="px-4 text-center font-body text-[12px] leading-[19px] text-subtle">
            {t('reader.guideBody')}
          </Text>
        </View>
        <Button label={t('reader.guideOk')} onPress={onClose} />
      </DialogCard>
    </Modal>
  );
}
