import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { initials } from '@/ui/avatar';
import { Icon } from '@/ui/icon';
import { StatusMark } from '@/ui/status-mark';
import { Text } from '@/ui/text';

/** Section title with an optional "Барлығын көру" link (overview sections). */
export function SectionHead({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="mb-2.5 min-h-[21px] flex-row items-center justify-between gap-2.5">
      <Text className="font-body-semibold text-[16px] leading-[20.8px]">{title}</Text>
      {onViewAll ? (
        <Pressable accessibilityRole="link" onPress={onViewAll} className="h-11 justify-center rounded-control px-1 active:bg-canvas">
          <Text className="font-body-semibold text-[14px] leading-[18px]">{t('principal.viewAll')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The design's secondary "Ашу" button (pale blue, optional arrow). */
export function OpenButton({ onPress, arrow, label }: { onPress: () => void; arrow?: boolean; label?: string }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 flex-row items-center justify-center gap-2 rounded-control bg-[#f3f7ff] px-[13px] active:opacity-80"
    >
      <Text className="font-body-semibold text-[13px] leading-[18px] text-link">{t('principal.open')}</Text>
      {arrow ? <Icon name="arrow" size={18} color={colors.ink} /> : null}
    </Pressable>
  );
}

/** Peach initials circle the prototype uses for staff. */
export function StaffAvatar({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <View className="items-center justify-center rounded-full bg-[#ffdcc0]" style={{ width: size, height: size }}>
      <Text className="font-body text-[14px] leading-[21px] text-[#653b21]">{initials(name)}</Text>
    </View>
  );
}

type TeacherCardProps = { name: string; classNames: string[]; active: boolean; workCount: number; onOpen: () => void };

/** A teacher panel: avatar, name, classes, active status, work given and "Ашу". */
export function TeacherCard({ name, classNames, active, workCount, onOpen }: TeacherCardProps) {
  const { t } = useTranslation();
  return (
    <View className="rounded-card bg-surface p-[14px] shadow-panel">
      <View className="flex-row items-center gap-2.5">
        <StaffAvatar name={name} />
        <View className="flex-1">
          <Text className="mb-1.5 font-body-semibold text-[17px] leading-[23px]" numberOfLines={1}>{name}</Text>
          <Text className="font-body text-[13px] leading-[19px] text-body" numberOfLines={1}>
            {classNames.length ? classNames.join(' · ') : t('principal.noClasses')}
          </Text>
        </View>
        <StatusMark status={active ? 'done' : 'pending'} label={t(active ? 'principal.active' : 'principal.inactive')} size={16} />
      </View>
      <View className="mt-6 flex-row items-center justify-between gap-2.5">
        <Text className="flex-1 font-body text-[16px] leading-[24px]" numberOfLines={1}>
          {workCount} {t('principal.workAssigned')}
        </Text>
        <OpenButton arrow onPress={onOpen} label={name} />
      </View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-body text-[12px] leading-[18px] text-meta">{label}</Text>
      {children}
    </View>
  );
}

type ClassRowProps = { name: string; teacherName: string; studentCount: number; workCount: number; onOpen: () => void };

/** One class of the school table, laid out as the prototype's stacked card. */
export function ClassTableCard({ name, teacherName, studentCount, workCount, onOpen }: ClassRowProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-1.5 rounded-[16px] bg-surface p-[14px]" style={{ boxShadow: 'inset 0 0 0 1px #d3d5de' }}>
      <Text className="font-body-semibold text-[14px] leading-[21px]">{name}</Text>
      <Row label={t('principal.teacher')}>
        <Text className="shrink font-body text-[15px] leading-[22.5px] text-meta" numberOfLines={1}>{teacherName}</Text>
      </Row>
      <Row label={t('principal.students')}>
        <Text className="font-body text-[15px] leading-[22.5px]">{studentCount}</Text>
      </Row>
      <Row label={t('principal.workAssigned')}>
        <Text className="font-body text-[15px] leading-[22.5px]">{workCount}</Text>
      </Row>
      <View className="items-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('principal.open')} ${name}`}
          onPress={onOpen}
          className="h-11 items-center justify-center rounded-control bg-[#f3f7ff] px-[14px] active:opacity-80"
        >
          <Text className="font-body-semibold text-[14px] leading-[18px] text-link">{t('principal.open')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The school's classes in a panel captioned with the school name (overview and School tab). */
export function ClassTable({
  schoolName,
  classes,
  onOpen,
}: {
  schoolName: string;
  classes: { id: string; name: string; teacherName: string; studentCount: number; workCount: number }[];
  onOpen: (classId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="rounded-card bg-surface p-[14px] shadow-panel">
      <Text className="mb-2.5 font-body text-[13px] leading-[19.5px] text-body">{schoolName}</Text>
      {classes.length ? (
        <View className="gap-2.5">
          {classes.map((c) => (
            <ClassTableCard key={c.id} {...c} onOpen={() => onOpen(c.id)} />
          ))}
        </View>
      ) : (
        <Text className="font-body text-[14px] leading-[21px] text-body">{t('common.states.empty')}</Text>
      )}
    </View>
  );
}
