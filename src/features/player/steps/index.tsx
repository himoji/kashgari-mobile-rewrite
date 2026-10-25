import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { NotReady } from '@/ui/feedback';
import { Text } from '@/ui/text';

import type { LinkStep, Step, StepViewProps } from '../engine/types';
import { StepHeading } from '../parts';
import { CardsView } from './cards';
import { ChoiceView } from './choice';
import { CompleteView } from './complete';
import { CrosswordView } from './crossword';
import { FreeTextView } from './free-text';
import { GridView } from './grid';
import { MatchView } from './match';
import { PassageView } from './passage';
import { ShuffleView } from './shuffle';

/** A lesson's game activity is played in the Oyna player; this step sends the student there. */
function LinkView({ step }: StepViewProps<LinkStep>) {
  const { t } = useTranslation();
  return (
    <View>
      <StepHeading>{t(`player.labels.${step.label}`)}</StepHeading>
      <Card variant="muted" className="gap-3">
        <Text variant="heading">{step.name}</Text>
        <Text variant="meta">{t('player.gameHint')}</Text>
        <Button variant="primary" icon="play" label={t('player.openGame')} onPress={() => router.push(step.href as never)} />
      </Card>
    </View>
  );
}

/** One small renderer per exercise type; all of them support play and review. */
export function StepView(props: StepViewProps<Step>) {
  const { t } = useTranslation();
  const { step } = props;
  switch (step.kind) {
    case 'passage':
      return <PassageView {...props} step={step} />;
    case 'cards':
      return <CardsView {...props} step={step} />;
    case 'choice':
      return <ChoiceView {...props} step={step} />;
    case 'match':
      return <MatchView {...props} step={step} />;
    case 'complete':
      return <CompleteView {...props} step={step} />;
    case 'shuffle':
      return <ShuffleView {...props} step={step} />;
    case 'text':
      return <FreeTextView {...props} step={step} />;
    case 'grid':
      return <GridView {...props} step={step} />;
    case 'crossword':
      return <CrosswordView {...props} step={step} />;
    case 'link':
      return <LinkView {...props} step={step} />;
    case 'unsupported':
      return (
        <View>
          <StepHeading>{t(`player.labels.${step.label}`)}</StepHeading>
          <NotReady body={t('player.unsupported')} />
        </View>
      );
  }
}
