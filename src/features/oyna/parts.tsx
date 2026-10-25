import { useState, type ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon, type IconName } from '@/ui/icon';
import { Text } from '@/ui/text';

export function ExerciseTitle({ children, aside }: { children: ReactNode; aside?: string }) {
  return (
    <View className="mb-4 flex-row items-center justify-between gap-3">
      <Text className="flex-1 font-body-semibold text-[17px] leading-[24px]">{children}</Text>
      {aside ? <Text className="font-body-medium text-[13px] leading-[19.5px] text-[#7a8090]">{aside}</Text> : null}
    </View>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('mb-3 font-body text-[15px] leading-[23.25px]', className)}>{children}</Text>;
}

type Tone = 'idle' | 'selected' | 'correct' | 'wrong' | 'used';

/** Grey chip from the prototype (word chips, scrambled letters). Pressable when given onPress. */
export function Chip({ label, big, tone = 'idle', onPress, disabled }: { label: string; big?: boolean; tone?: Tone; onPress?: () => void; disabled?: boolean }) {
  const body = (
    <Text
      className={cn(
        'font-body text-ink',
        big ? 'text-[22px] leading-[20px]' : 'text-[14px] leading-[20px]',
        tone === 'correct' && 'text-[#2f6b3f]',
        tone === 'wrong' && 'text-danger',
        tone === 'used' && 'text-[#c3c8d2]',
      )}
    >
      {label}
    </Text>
  );
  const cls = cn(
    'min-w-[35px] items-center rounded-tile px-[11px] py-2',
    tone === 'correct' ? 'bg-[#edf8ef]' : tone === 'wrong' ? 'bg-danger-soft' : tone === 'selected' ? 'bg-[#fff8d6]' : 'bg-[#f3f5f2]',
    tone === 'used' && 'opacity-60',
  );
  if (!onPress) return <View className={cls}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} className={cn(cls, 'active:opacity-70')}>
      {body}
    </Pressable>
  );
}

const choiceRing: Record<Tone, string> = {
  idle: 'inset 0 0 0 1px #d3d5de',
  used: 'inset 0 0 0 1px #d3d5de',
  selected: 'inset 0 0 0 2px #242631',
  correct: 'inset 0 0 0 1px #2f6b3f',
  wrong: 'inset 0 0 0 1px #d64848',
};

/** Matching tile (student-player-a6): white, yellow when selected, green once matched. */
export function ListChoice({ tone = 'idle', children, className, ...props }: PressableProps & { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: tone === 'selected', disabled: !!props.disabled }}
      className={cn(
        'min-h-[52px] justify-center rounded-[14px] px-3 py-2.5 active:opacity-80',
        tone === 'selected' ? 'bg-[#fff8d6]' : tone === 'correct' ? 'bg-[#edf8ef]' : tone === 'wrong' ? 'bg-danger-soft' : 'bg-surface',
        className,
      )}
      style={{ boxShadow: choiceRing[tone] }}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function ChoiceLabel({ children, tone = 'idle', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <Text
      className={cn(
        'font-body text-[16px] leading-[20.8px] text-black',
        tone === 'correct' && 'text-[#2f6b3f]',
        tone === 'wrong' && 'text-danger',
        className,
      )}
    >
      {children}
    </Text>
  );
}

/** A/B/C answer row (student-player-a4). */
export function OptionRow({ letter, label, tone = 'idle', onPress, disabled }: { letter: string; label: string; tone?: Tone; onPress?: () => void; disabled?: boolean }) {
  const selected = tone === 'selected';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected || tone === 'correct', disabled }}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'min-h-[52px] flex-row items-center gap-2.5 rounded-[13px] px-3 py-[11px] active:opacity-80',
        selected ? 'bg-[#eef5ff]' : tone === 'correct' ? 'bg-[#edf8ef]' : tone === 'wrong' ? 'bg-danger-soft' : 'bg-surface',
      )}
      style={{
        boxShadow: selected
          ? '0 0 0 1px rgba(59, 134, 255, 0.125)'
          : tone === 'correct'
            ? '0 0 0 1px rgba(32, 153, 109, 0.35)'
            : tone === 'wrong'
              ? '0 0 0 1px rgba(214, 72, 72, 0.3)'
              : '0 2px 3px rgba(36, 38, 49, 0.01)',
      }}
    >
      <View
        className={cn(
          'h-[26px] w-[26px] items-center justify-center rounded-lg',
          selected ? 'bg-primary-strong' : tone === 'correct' ? 'bg-success' : tone === 'wrong' ? 'bg-danger' : 'bg-[#f1f5fb]',
        )}
      >
        <Text className={cn('font-body-semibold text-[12px] leading-[20px]', tone === 'idle' || tone === 'used' ? 'text-[#8a95a7]' : 'text-white')}>{letter}</Text>
      </View>
      <Text
        className={cn(
          'flex-1 font-body text-[14px] leading-[20px] text-[#343845]',
          selected && 'text-[#1558ac]',
          tone === 'correct' && 'text-[#2f6b3f]',
          tone === 'wrong' && 'text-danger',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export type OutlineStep = { label: string; icon: IconName; active: boolean; done: boolean; onPress?: () => void };

/** The collapsible block under each exercise: lesson order and/or the game's words. */
export function Outline({ label, steps, words }: { label: string; steps?: OutlineStep[]; words?: string[] }) {
  const [open, setOpen] = useState(false);
  const ct = useContentText();
  return (
    <View className="mt-5 rounded-control bg-[#f7f9fc]">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} className="flex-row items-center justify-between gap-3 p-3">
        <Text className="font-body-medium text-[12px] leading-[18px] text-muted">{label}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="down" size={16} color={colors.muted} />
        </View>
      </Pressable>
      {open && steps?.length ? (
        <View className="px-2 pb-2">
          {steps.map((s, i) => (
            <Pressable
              key={s.label}
              accessibilityRole="button"
              accessibilityState={{ selected: s.active, disabled: !s.onPress }}
              disabled={!s.onPress}
              onPress={s.onPress}
              className={cn('h-12 flex-row items-center gap-3 rounded-control px-2.5', s.active && 'bg-[#fff8d6]')}
            >
              <Icon name={s.done ? 'check' : s.icon} size={18} color={s.done ? colors.success : colors.ink} />
              <Text className={cn('font-body text-[15px] leading-[22.5px]', s.active && 'font-body-semibold')}>
                {i + 1}. {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {open && words?.length ? (
        <View className="flex-row flex-wrap gap-1.5 px-4 pb-4 pt-3">
          {words.map((w) => (
            <View key={w} className="rounded-tile bg-surface px-3 py-[9px]">
              <Text className="font-body text-[13px] leading-[19.5px] text-[#52627b]">{ct(w)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
