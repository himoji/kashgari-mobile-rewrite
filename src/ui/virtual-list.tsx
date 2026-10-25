import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { createContext, Fragment, useContext, useLayoutEffect, useState, type ReactElement, type ReactNode, type Ref } from 'react';
import { View, type ScrollViewProps } from 'react-native';

export type ListRowsProps<T> = {
  data: readonly T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  /** Rows of different shapes recycle separately. */
  getItemType?: (item: T) => string;
  /** Space between rows. */
  gap?: number;
  /** Space between the content above and the first row. */
  before?: number;
  /** Scrolls after the last row (a button, room for a floating action). */
  footer?: ReactNode;
};

// The rows travel up from wherever they are rendered (usually inside a QueryBoundary) to the list.
type AnyRows = ListRowsProps<never>;
const Slot = createContext<((rows: AnyRows | null) => void) | null>(null);
const NONE: never[] = [];

/**
 * The rows of the VirtualList it sits in, rendered from anywhere in that list's header, so a screen
 * keeps its chrome and loading states as they are and only the long part virtualises. Outside a
 * VirtualList it renders the rows in a plain column.
 */
export function ListRows<T>({ data, keyExtractor, renderItem, getItemType, gap, before, footer }: ListRowsProps<T>) {
  const set = useContext(Slot);
  useLayoutEffect(() => {
    set?.({ data, keyExtractor, renderItem, getItemType, gap, before, footer } as unknown as AnyRows);
  }, [set, data, keyExtractor, renderItem, getItemType, gap, before, footer]);
  useLayoutEffect(() => () => set?.(null), [set]);
  if (set) return null;
  return (
    <View style={{ gap, marginTop: before }}>
      {data.map((item) => (
        <Fragment key={keyExtractor(item)}>{renderItem(item)}</Fragment>
      ))}
      {footer}
    </View>
  );
}

type Props = Omit<ScrollViewProps, 'children' | 'maintainVisibleContentPosition'> & {
  ref?: Ref<FlashListRef<unknown>>;
  /** Everything above the rows; a <ListRows> inside it supplies them. */
  header: ReactNode;
  /** Wraps each row (side margins, a sheet's background). */
  rowClassName?: string;
  /** Closes the list around the rows' own footer (a sheet's rounded bottom). */
  renderFooter?: (footer: ReactNode) => ReactNode;
  /** Draw the header over the rows, for dropdowns that open past its bottom. */
  raiseHeader?: boolean;
};

/** A scroll view whose rows virtualise (FlashList), with a header that scrolls with them. */
export function VirtualList({ ref, header, rowClassName, renderFooter, raiseHeader, ...scroll }: Props) {
  const [rows, setRows] = useState<AnyRows | null>(null);
  const footer = rows?.footer;
  return (
    <Slot.Provider value={setRows}>
      <FlashList<never>
        ref={ref as Ref<FlashListRef<never>>}
        {...scroll}
        data={rows?.data ?? NONE}
        keyExtractor={(item) => rows?.keyExtractor(item) ?? ''}
        getItemType={rows?.getItemType}
        renderItem={({ item, index }) => (
          <View className={rowClassName} style={{ paddingTop: index ? rows?.gap : rows?.before }}>
            {rows?.renderItem(item)}
          </View>
        )}
        ListHeaderComponent={<>{header}</>}
        ListHeaderComponentStyle={raiseHeader ? { zIndex: 1 } : undefined}
        ListFooterComponent={renderFooter ? <>{renderFooter(footer)}</> : footer ? <>{footer}</> : null}
        maintainVisibleContentPosition={{ disabled: true }}
      />
    </Slot.Provider>
  );
}
