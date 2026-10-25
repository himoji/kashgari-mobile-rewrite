import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useSession } from '@/features/auth/session';
import { cn } from '@/ui/cn';

// Sizes are the prototype's computed values (390pt wide phone).
const text = cva('text-ink', {
  variants: {
    variant: {
      display: 'text-[29px] leading-[33px]',
      title: 'font-body-semibold text-[20px] leading-[26px]',
      heading: 'font-body-semibold text-[17px] leading-[22px]',
      strong: 'font-body-semibold text-[14px] leading-[20px]',
      body: 'font-body text-[14px] leading-[21px]',
      small: 'font-body-medium text-[13px] leading-[19.5px]',
      meta: 'font-body text-[12px] leading-[16px] text-body',
      caption: 'font-body text-[11px] leading-[16px] text-hint',
      reading: 'font-reading text-[18px] leading-[28px]',
    },
    tone: {
      default: '',
      muted: 'text-muted',
      subtle: 'text-subtle',
      inverse: 'text-white',
      link: 'text-link',
      success: 'text-success',
      danger: 'text-danger',
      late: 'text-late',
    },
  },
  defaultVariants: { variant: 'body', tone: 'default' },
});

export type TextProps = RNTextProps & VariantProps<typeof text> & { className?: string };

export function Text({ variant, tone, className, ...props }: TextProps) {
  // Display headings use KZ Dusha, or KZ Bip when the interface is in Kazakh Latin.
  const latin = useSession((s) => s.uiLanguage === 'kk' && s.script === 'latn');
  const display = variant === 'display' ? (latin ? 'font-display-latin' : 'font-display') : '';
  return <RNText className={cn(text({ variant, tone }), display, className)} {...props} />;
}
