import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RankRow } from '@/features/rankings/rank';
import { gradient, type GradientName } from '@/ui/gradient';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

const STANDS: { height: number; gradient: GradientName; color: string }[] = [
  { height: 108, gradient: 'gold', color: '#6b4b0d' },
  { height: 82, gradient: 'silver', color: '#506580' },
  { height: 62, gradient: 'bronze', color: '#805737' },
];

function Place({ row, place }: { row: RankRow; place: number }) {
  const stand = STANDS[place]!;
  return (
    <View className="flex-1 items-center justify-end">
      <View className="mb-3 items-center justify-end gap-[7px] px-[3px]">
        {place === 0 ? (
          <View className="mb-[3px] h-[26px] w-[26px] items-center justify-center">
            <Icon name="solid-trophy" size={20} color="#c78d13" />
          </View>
        ) : null}
        <View className="h-8 justify-end">
          <Text
            className="text-center font-body-medium text-[11px] leading-[16px]"
            numberOfLines={2}
          >
            {row.name}
          </Text>
        </View>
        <Text className="font-body-semibold text-[17px] leading-[23px]">{row.score}</Text>
      </View>
      <View
        className="w-full items-center justify-center rounded-b-[5px] rounded-t-[13px]"
        style={[gradient(stand.gradient), { height: stand.height }]}
      >
        <Text
          className="font-body-semibold text-[33px] leading-[40px]"
          style={{ color: stand.color }}
        >
          {place + 1}
        </Text>
      </View>
    </View>
  );
}

/** Top three on stands: second, first, third. Empty places keep their slot so the stands keep their width. */
export function Podium({ rows }: { rows: RankRow[] }) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('rankings.topThree')}
      className="mb-[22px] flex-row items-end gap-[5px] pt-5"
    >
      {[1, 0, 2].map((i) => (rows[i] ? <Place key={rows[i].id} row={rows[i]} place={i} /> : <View key={i} className="flex-1" />))}
    </View>
  );
}
