import Svg, { Path, Rect } from 'react-native-svg';

const COLORS = ['#accbf4', '#f5d39e', '#cfc1ef', '#b4ddd0', '#edc2ce'];

/** Same colour for the same book every time (the prototype's id hash). */
export const coverColor = (id: string) =>
  COLORS[Array.from(id).reduce((h, c) => (h * 31 + c.codePointAt(0)!) >>> 0, 0) % COLORS.length]!;

export function BookCover({ id, width = 42 }: { id: string; width?: number }) {
  return (
    <Svg width={width} height={(width * 62) / 48} viewBox="0 0 48 62">
      <Rect x={3} y={2} width={42} height={58} rx={5} fill={coverColor(id)} />
      <Path d="M8 2v58" stroke="#fff" strokeOpacity={0.25} strokeWidth={2} />
      <Path
        d="M14 16h21M14 20h14"
        stroke="#fff"
        strokeOpacity={0.95}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M14 48h20"
        stroke="#fff"
        strokeOpacity={0.85}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
