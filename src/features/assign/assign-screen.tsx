import { useMutation, useQuery } from '@apollo/client/react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  AddDialog,
  BlockRow,
  ComposerButton,
  ComposerError,
  FieldLabel,
  Footer,
  MaterialPicker,
  SourceChoice,
  StageNav,
  type Stage,
} from '@/features/assign/assign-parts';
import {
  blockKey,
  blocksFromSource,
  blockTitle,
  contentError,
  deadlineSeconds,
  formatDay as formatIsoDay,
  gamesInput,
  hasGame,
  isGameBlock,
  upcomingDays,
  type Block,
  type BlockType,
  type ContentError,
  type Source,
} from '@/features/assign/builder';
import {
  ASSIGN_CLASSES,
  ASSIGN_CREATE_GRAMMAR,
  ASSIGN_CREATE_OQYLYM,
  ASSIGN_CREATE_TEXT,
  ASSIGN_CREATE_TYNDALYM,
  ASSIGN_GAMES,
  ASSIGN_MATERIAL,
} from '@/features/assign/gql';
import { className } from '@/features/classes/format';
import { evictFields } from '@/lib/cache';
import { useProfile } from '@/features/auth/session';
import { kindFlags, parseMaterialParam } from '@/features/materials/material-ref';
import { goBack } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { BackBar } from '@/ui/back-bar';
import { Button } from '@/ui/button';
import { ChoiceRow, Dialog } from '@/ui/dialog';
import { NotReady } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { SegmentedTabs } from '@/ui/segmented-tabs';
import { Text } from '@/ui/text';

type DialogName = 'add' | 'material' | 'text' | 'class' | 'deadline' | 'preview' | 'notReady' | null;
type Notice = 'needText' | 'noGame' | 'grammarOnly' | 'failed' | null;

/** "Жаңа тапсырма": start (ready material or own) → content blocks → class and deadline. */
export function AssignScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profileId } = useProfile();
  const params = useLocalSearchParams<{ material?: string }>();
  const preselected = useMemo(() => parseMaterialParam(params.material), [params.material]);

  const [stage, setStage] = useState<Stage>(preselected ? 2 : 1);
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState(() => upcomingDays(new Date(), 7)[6]!);
  const [duration, setDuration] = useState('15');
  const [listenType, setListenType] = useState<'ALONE' | 'WITH_CLASS'>('ALONE');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [menu, setMenu] = useState<Block | null>(null);
  const [ownText, setOwnText] = useState('');
  const [errors, setErrors] = useState<{ content?: ContentError; class?: boolean; duration?: boolean }>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [done, setDone] = useState<'assigned' | 'draft' | null>(null);
  const pendingDefaults = useRef(false);
  const label = (type: BlockType) => t(`assign.blocks.${type}`);

  const classes = useQuery(ASSIGN_CLASSES, { variables: { teacherId: profileId } }).data?.teacher?.classes ?? [];
  const grades = [...new Set(classes.map((c) => c.grade).filter((g): g is number => g != null))];
  const textId = source && source.ref.kind !== 'grammar' ? source.ref.id : null;
  const gamesQuery = useQuery(ASSIGN_GAMES, { variables: { textId: textId ?? '' }, skip: !textId });
  const games = gamesQuery.data?.generateGames ?? null;

  // A material opened from the library or a topic ("Тағайындау") starts at the content step.
  const material = useQuery(ASSIGN_MATERIAL, {
    variables: { id: preselected?.id ?? '', ...kindFlags(preselected?.kind ?? 'oqylym') },
    skip: !preselected,
  });
  const preselectedTitle = material.data?.oqylymText?.title ?? material.data?.tyndalymText?.title ?? material.data?.durysTitle?.title;
  useEffect(() => {
    if (preselected && preselectedTitle && !source) applySource({ ref: preselected, title: preselectedTitle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTitle]);

  // Generated questions arrive after the text is chosen; then the material's default blocks are added.
  useEffect(() => {
    if (!pendingDefaults.current || !source || gamesQuery.loading) return;
    pendingDefaults.current = false;
    setBlocks(blocksFromSource(source, games, label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, gamesQuery.loading, source]);

  function applySource(next: Source, withDefaults = true) {
    setSource(next);
    setName((n) => n || next.title);
    setBlocks(blocksFromSource(next, null, label).slice(0, 1));
    pendingDefaults.current = withDefaults && next.ref.kind !== 'grammar';
    setErrors({});
    setNotice(null);
    setStage(2);
    setDialog(null);
  }

  const [createText, createTextState] = useMutation(ASSIGN_CREATE_TEXT);
  const [createOqylym, oqylymState] = useMutation(ASSIGN_CREATE_OQYLYM);
  const [createTyndalym, tyndalymState] = useMutation(ASSIGN_CREATE_TYNDALYM);
  const [createGrammar, grammarState] = useMutation(ASSIGN_CREATE_GRAMMAR);
  const busy = oqylymState.loading || tyndalymState.loading || grammarState.loading;

  const addType = (type: BlockType) => {
    setDialog(null);
    setNotice(null);
    if (type === 'reading') {
      setDialog('text');
      return;
    }
    if (source?.ref.kind === 'grammar') return setNotice('grammarOnly');
    if (!source) return setNotice('needText');
    if (blocks.some((b) => b.type === type)) return;
    if (isGameBlock(type) && !hasGame(type, games)) return setNotice(gamesQuery.loading ? null : 'noGame');
    setBlocks((bs) => [...bs, { key: blockKey(), type, title: blockTitle(type, games, label(type)) }]);
  };

  const saveOwnText = async () => {
    const text = ownText.trim();
    if (!text) return;
    try {
      const { data } = await createText({ variables: { teacherId: profileId, text } });
      const created = data?.createOqylymText;
      if (!created) throw new Error('no text');
      setOwnText('');
      applySource({ ref: { kind: 'oqylym', id: created.id }, title: created.title }, false);
    } catch {
      setDialog(null);
      setNotice('failed');
    }
  };

  const removeBlock = (block: Block) => {
    setMenu(null);
    // The text is what every exercise is generated from: removing it empties the assignment.
    if (['reading', 'listening', 'grammar'].includes(block.type)) {
      setSource(null);
      setBlocks([]);
    } else setBlocks((bs) => bs.filter((b) => b.key !== block.key));
  };
  const moveUp = (block: Block) => {
    setMenu(null);
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.key === block.key);
      if (i <= 1) return bs; // the text stays first
      const next = [...bs];
      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
      return next;
    });
  };

  const goNext = () => {
    if (stage === 2) {
      const content = contentError(name, source, blocks);
      setErrors({ content });
      if (!content) setStage(3);
      return;
    }
    void publish(true);
  };

  async function publish(visible: boolean) {
    const content = contentError(name, source, blocks);
    if (content || !source) {
      setErrors({ content: content ?? 'content' });
      setStage(2);
      return;
    }
    const minutes = duration.trim() ? Number(duration) : undefined;
    const badDuration = minutes != null && !(Number.isInteger(minutes) && minutes >= 1 && minutes <= 180);
    if (!classId || badDuration) {
      setErrors({ class: !classId, duration: badDuration });
      setStage(3);
      if (badDuration) setOptionsOpen(true);
      return;
    }
    if (source.ref.kind === 'grammar' && !visible) return setDialog('notReady');
    setErrors({});
    setNotice(null);
    try {
      // The API answers null (with no errors) when it did not create the assignment.
      let created: { id: string } | null | undefined;
      if (source.ref.kind === 'grammar') {
        created = (await createGrammar({ variables: { classId, titleId: source.ref.id }, update: (cache) => evictFields(cache, 'Class', classId, ['durysAssignments']) })).data?.createDurysAssignment;
      } else {
        const assignment = {
          type: 'HW' as const,
          name: name.trim(),
          textId: source.ref.id,
          deadline: deadlineSeconds(deadline),
          duration: minutes,
          games: gamesInput(blocks, games),
          hasFlashcards: blocks.some((b) => b.type === 'cards'),
        };
        created =
          source.ref.kind === 'tyndalym'
            ? (await createTyndalym({ variables: { classId, visible, assignment: { ...assignment, listenType } }, update: (cache) => evictFields(cache, 'Class', classId, ['assignments']) })).data?.createTyndalymAssignment
            : (await createOqylym({ variables: { classId, visible, assignment }, update: (cache) => evictFields(cache, 'Class', classId, ['assignments']) })).data?.createOqylymAssignment;
      }
      if (!created) throw new Error('not created');
      setDone(visible ? 'assigned' : 'draft');
    } catch {
      setNotice('failed');
    }
  }

  const reset = () => {
    setDone(null);
    setStage(1);
    setName('');
    setSource(null);
    setBlocks([]);
    setClassId(null);
    setErrors({});
  };

  const formatDay = (iso: string) =>
    formatIsoDay(iso, t('assign.months', { returnObjects: true }) as string[], t('assign.weekdays', { returnObjects: true }) as string[], i18n.language === 'en');
  const chosenClass = classes.find((c) => c.id === classId);
  const errorText = notice ? t(`assign.errors.${notice}`) : null;

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ gestureEnabled: stage === 1 }} />
      <BackBar label={t('assign.back')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 13, paddingBottom: insets.bottom + 120 }}>
        <Text className="font-body-semibold text-[23px] leading-[30px]">{t('assign.title')}</Text>
        <StageNav stage={stage} onGo={(s) => (setStage(s), setErrors({}))} />

        {stage === 1 ? (
          <>
            <Text className="mb-3 font-body-semibold text-[20px] leading-[26px]">{t('assign.howTitle')}</Text>
            <Text className="mb-3 font-body text-[15px] leading-[23.25px] text-[#8592a5]">{t('assign.howHint')}</Text>
            <SourceChoice icon="book" title={t('assign.ready')} hint={t('assign.readyHint')} onPress={() => setDialog('material')} />
            <SourceChoice icon="plus" title={t('assign.own')} hint={t('assign.ownHint')} onPress={() => setStage(2)} />
          </>
        ) : stage === 2 ? (
          <>
            <FieldLabel>{t('assign.name')}</FieldLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('assign.namePlaceholder')}
              placeholderTextColor="#8592a5"
              maxLength={180}
              accessibilityLabel={t('assign.name')}
              className="mb-6 h-12 rounded-control bg-[#f4f7fc] px-3 font-body text-[16px] text-ink"
            />
            {errors.content === 'name' ? <ComposerError>{t('assign.errors.name')}</ComposerError> : null}
            <View className="mx-px mb-3 flex-row items-center justify-between">
              <Text className="font-body-medium text-[15px] leading-[22px] text-[#48566e]">{t('assign.content')}</Text>
              <Text className="font-body text-[11px] leading-[16.5px] text-[#a4b0c2]">{blocks.length}</Text>
            </View>
            {blocks.length ? (
              <View className="mb-3 gap-2.5">
                {blocks.map((b, i) => (
                  <BlockRow key={b.key} block={b} index={i} label={label(b.type)} onMenu={() => setMenu(b)} />
                ))}
              </View>
            ) : null}
            {source && gamesQuery.loading ? (
              <View className="mb-3 flex-row items-center gap-2 px-1">
                <ActivityIndicator size="small" color={colors.subtle} />
                <Text variant="caption">{t('assign.generating')}</Text>
              </View>
            ) : null}
            {errorText ? <ComposerError>{errorText}</ComposerError> : null}
            <ComposerButton kind="add" icon="plus" label={t('assign.addSection')} onPress={() => setDialog('add')} />
            {!blocks.length ? <ComposerButton kind="material" icon="book" label={t('assign.chooseMaterial')} onPress={() => setDialog('material')} /> : null}
            {errors.content === 'content' ? <ComposerError>{t('assign.errors.content')}</ComposerError> : null}
            {blocks.length ? <ComposerButton kind="preview" icon="play" label={t('assign.previewAsStudent')} onPress={() => setDialog('preview')} /> : null}
          </>
        ) : (
          <>
            <View className="mb-6 flex-row items-center gap-2.5 rounded-[14px] bg-[#f5f8fd] p-[15px]">
              <View className="flex-1 gap-[5px]">
                <Text className="font-body-bold text-[14px] leading-[21px]">{name}</Text>
                <Text className="font-body text-[12px] leading-[18px] text-[#8592a5]">{t('assign.sections', { count: blocks.length })}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setStage(2)} className="p-[5px]">
                <Text className="font-body text-[12px] leading-[18px] text-[#1877f2]">{t('assign.edit')}</Text>
              </Pressable>
            </View>
            <Text className="mb-3 font-body-semibold text-[20px] leading-[26px]">{t('assign.whoTitle')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDialog('class')}
              className="mb-3 h-[50px] flex-row items-center gap-2.5 rounded-control bg-[#f4f7fc] px-[13px] active:opacity-80"
            >
              <Icon name="classes" size={18} color="#687f9f" />
              <Text className="flex-1 font-body text-[14px] leading-[21px] text-[#687f9f]">
                {chosenClass ? className(chosenClass) : t('assign.chooseClass')}
              </Text>
              <Icon name="down" size={18} color={colors.ink} />
            </Pressable>
            {errors.class ? <ComposerError>{t('assign.errors.class')}</ComposerError> : null}
            {source?.ref.kind !== 'grammar' ? (
              <>
                <FieldLabel>{t('assign.deadline')}</FieldLabel>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('assign.deadline')}
                  onPress={() => setDialog('deadline')}
                  className="mb-5 h-12 flex-row items-center justify-between rounded-control bg-[#f4f7fc] px-3 active:opacity-80"
                >
                  <Text className="font-body text-[16px] leading-[24px]">{formatDay(deadline)}</Text>
                  <Icon name="clock" size={18} color={colors.ink} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: optionsOpen }}
                  onPress={() => setOptionsOpen((o) => !o)}
                  className="h-[45px] flex-row items-center justify-between"
                >
                  <Text className="font-body text-[12px] leading-[20px] text-[#94a5bc]">{t('assign.options')}</Text>
                  <View style={{ transform: [{ rotate: optionsOpen ? '180deg' : '0deg' }] }}>
                    <Icon name="down" size={15} color={colors.ink} />
                  </View>
                </Pressable>
                {optionsOpen ? (
                  <View>
                    <View className="my-3 flex-row items-center justify-between gap-3">
                      <Text className="font-body-medium text-[12px] leading-[18px] text-[#8496af]">{t('assign.duration')}</Text>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={duration}
                          onChangeText={(v) => setDuration(v.replace(/\D/g, ''))}
                          keyboardType="number-pad"
                          maxLength={3}
                          accessibilityLabel={t('assign.duration')}
                          className="h-10 w-[90px] rounded-tile bg-[#f3f7fc] px-2.5 font-body text-[14px] text-ink"
                        />
                        <Text className="font-body text-[12px] text-[#8496af]">{t('assign.minutes')}</Text>
                      </View>
                    </View>
                    {errors.duration ? <ComposerError>{t('assign.errors.duration')}</ComposerError> : null}
                    {source?.ref.kind === 'tyndalym' ? (
                      <View className="my-3 gap-2">
                        <Text className="font-body-medium text-[12px] leading-[18px] text-[#8496af]">{t('assign.listenType')}</Text>
                        <SegmentedTabs
                          value={listenType}
                          onChange={setListenType}
                          options={[
                            { value: 'ALONE', label: t('assign.listenAlone') },
                            { value: 'WITH_CLASS', label: t('assign.listenClass') },
                          ]}
                        />
                      </View>
                    ) : null}
                    <NotReady className="mt-3" title={t('assign.moreOptions')} body={t('assign.moreOptionsBody')} />
                  </View>
                ) : null}
              </>
            ) : null}
            {errorText ? <View className="mt-4"><ComposerError>{errorText}</ComposerError></View> : null}
          </>
        )}
      </ScrollView>

      {stage > 1 ? (
        <Footer
          stage={stage}
          busy={busy}
          onDraft={() => void publish(false)}
          onBack={() => (setStage((s) => (s - 1) as Stage), setErrors({}))}
          onNext={goNext}
        />
      ) : null}

      <AddDialog visible={dialog === 'add'} onClose={() => setDialog(null)} onMaterial={() => setDialog('material')} onType={addType} />
      <MaterialPicker visible={dialog === 'material'} grades={grades} onClose={() => setDialog(null)} onPick={(s) => applySource(s)} />

      <Dialog visible={dialog === 'text'} title={t('assign.ownText')} onClose={() => setDialog(null)}>
        <Text className="mb-3 font-body text-[13px] leading-[20px] text-muted">{t('assign.ownTextHint')}</Text>
        <TextInput
          value={ownText}
          onChangeText={setOwnText}
          multiline
          placeholder={t('assign.ownTextPlaceholder')}
          placeholderTextColor={colors.subtle}
          textAlignVertical="top"
          accessibilityLabel={t('assign.ownText')}
          className="min-h-[180px] rounded-control bg-[#f4f7fc] p-3 font-reading text-[16px] leading-[24px] text-ink"
        />
        <View className="mt-4 flex-row gap-2">
          <Button variant="secondary" className="flex-1" label={t('assign.cancel')} onPress={() => setDialog(null)} />
          <Button className="flex-1" label={t('assign.done')} loading={createTextState.loading} disabled={!ownText.trim()} onPress={() => void saveOwnText()} />
        </View>
      </Dialog>

      <Dialog visible={dialog === 'class'} title={t('assign.class')} onClose={() => setDialog(null)}>
        <View className="gap-[7px]">
          {classes.map((c) => (
            <ChoiceRow
              key={c.id}
              label={className(c)}
              selected={c.id === classId}
              onPress={() => (setClassId(c.id), setErrors((e) => ({ ...e, class: false })), setDialog(null))}
            />
          ))}
        </View>
      </Dialog>

      <Dialog visible={dialog === 'deadline'} title={t('assign.deadline')} onClose={() => setDialog(null)}>
        <View className="gap-[7px]">
          {upcomingDays(new Date(), 21).map((d) => (
            <ChoiceRow key={d} label={formatDay(d)} selected={d === deadline} onPress={() => (setDeadline(d), setDialog(null))} />
          ))}
        </View>
      </Dialog>

      <Dialog visible={!!menu} title={menu ? label(menu.type) : ''} onClose={() => setMenu(null)}>
        {menu ? (
          <View className="gap-2">
            {blocks.findIndex((b) => b.key === menu.key) > 1 ? (
              <Button variant="soft" icon="up" label={t('assign.moveUp')} onPress={() => moveUp(menu)} />
            ) : null}
            <Button variant="danger" icon="trash" label={t('assign.remove')} onPress={() => removeBlock(menu)} />
          </View>
        ) : null}
      </Dialog>

      <Dialog visible={dialog === 'preview'} title={t('assign.previewAsStudent')} onClose={() => setDialog(null)}>
        <NotReady body={t('assign.previewBody')} />
        {source ? (
          <Button
            variant="soft"
            className="mt-3"
            label={t('assign.openMaterial')}
            onPress={() => (setDialog(null), router.push({ pathname: '/teacher/material/[id]', params: { id: source.ref.id, kind: source.ref.kind } }))}
          />
        ) : null}
      </Dialog>

      <Dialog visible={dialog === 'notReady'} title={t('assign.draft')} onClose={() => setDialog(null)}>
        <NotReady />
      </Dialog>

      <Dialog visible={!!done} title={done === 'draft' ? t('assign.draftSaved') : t('assign.assigned')} onClose={() => goBack()}>
        {done === 'draft' ? <Text className="mb-4 font-body text-[13px] leading-[20px] text-muted">{t('assign.draftHint')}</Text> : null}
        <View className="gap-2">
          <Button label={t('assign.toSchool')} onPress={() => (setDone(null), router.replace('/teacher/school'))} />
          <Button variant="soft" label={t('assign.newOne')} onPress={reset} />
        </View>
      </Dialog>
    </View>
  );
}
