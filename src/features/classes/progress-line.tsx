import { cn } from '@/ui/cn';
import { ProgressBar } from '@/ui/progress-bar';

type Props = { pct: number; className?: string; tone?: 'soft' | 'strong'; height?: 4 | 7 };

/** Thin completion bar: soft (assignment cards) or strong blue (report modules). */
export function ProgressLine({ pct, className, tone = 'soft', height = 4 }: Props) {
  return (
    <ProgressBar
      value={pct / 100}
      className={cn('rounded', tone === 'soft' ? 'bg-[#edf3fc]' : 'bg-[#e6efff]', height === 4 ? 'h-1' : 'h-[7px]', className)}
      fillClassName={cn('rounded', tone === 'soft' ? 'bg-[#78a9f6]' : 'bg-primary')}
    />
  );
}
