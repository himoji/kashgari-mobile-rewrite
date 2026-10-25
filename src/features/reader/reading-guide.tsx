import { Modal, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText, TSpan } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { DialogCard } from '@/features/dictionary/dialog-card';
import { useContentText } from '@/lib/i18n';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';

/** The prototype's illustration: blurred lines of text, one tapped word and its tooltip. */
function GuideVisual() {
  const { t } = useTranslation();
  const content = useContentText();
  const lines = t('reader.guideLines', { returnObjects: true }) as string[];
  const font = { fontFamily: 'Onest_400Regular', fontSize: 11.5, textAnchor: 'middle' as const };
  return (
    <Svg
      width="100%"
      height={179}
      viewBox="0 0 280 180"
      style={{ marginBottom: 20, borderRadius: 17 }}
    >
      <Rect width={280} height={180} rx={17} fill="#edf4ff" />
      <G fill="#9aaec9" opacity={0.45}>
        {lines.map((line, i) => (
          <SvgText key={line} x={140} y={[29, 51, 98, 120][i]} {...font}>
            {content(line)}
          </SvgText>
        ))}
      </G>
      <Rect x={62} y={60} width={63} height={21} rx={5} fill="#cee1ff" />
      <SvgText x={140} y={75} fill="#617d9e" {...font}>
        {content(t('reader.guideBefore'))}{' '}
        <TSpan fill="#2178ee" fontFamily="Onest_600SemiBold">
          {content(t('reader.guideWord'))}
        </TSpan>{' '}
        {content(t('reader.guideAfter'))}
      </SvgText>
      <Circle
        cx={101}
        cy={86}
        r={9}
        fill="#8ebaff"
        fillOpacity={0.18}
        stroke="#73aaff"
        strokeWidth={1.2}
      />
      <Circle cx={101} cy={86} r={3.2} fill="#3683f6" />
      <Rect x={65} y={138} width={150} height={30} rx={9} fill="#fff" />
      <Path d="m91 138 6-6 6 6" fill="#fff" />
      <SvgText x={78} y={157} fill="#242631" fontFamily="Onest_600SemiBold" fontSize={11}>
        {content(t('reader.guideWord'))}
      </SvgText>
      <SvgText x={145} y={157} fill="#8490a3" fontFamily="Onest_400Regular" fontSize={10}>
        {t('reader.guideMeaning')}
      </SvgText>
    </Svg>
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
