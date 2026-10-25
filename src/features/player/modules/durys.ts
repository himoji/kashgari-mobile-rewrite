import { plainParagraph } from '../engine/passage';
import type { ChoiceQuestion, ChoiceStep } from '../engine/types';

/**
 * Durys grammar stories are canvas pages saved as XML (positioned components with JSON props).
 * The app reads them as a flow: texts in reading order, word buttons as chips, and sentence
 * games as choice questions (the story knows the right words, so they are checked locally).
 * Decorative components (arrows, batteries, boxes) are skipped.
 */
type Component = { tag: string; x: number; y: number; props: Record<string, unknown> };

const COMPONENT = /<([a-z0-9-]+)>\s*<id>[^<]*<\/id>\s*<position\s+x="(-?[\d.]+)"\s+y="(-?[\d.]+)"[^>]*\/>\s*<props><!\[CDATA\[([\s\S]*?)\]\]><\/props>\s*<\/\1>/g;

export function parseCanvas(xml: string): Component[] {
  const out: Component[] = [];
  for (const m of xml.matchAll(COMPONENT)) {
    try {
      out.push({ tag: m[1]!, x: Number(m[2]), y: Number(m[3]), props: JSON.parse(m[4]!) as Record<string, unknown> });
    } catch {
      // A broken props blob only loses that component.
    }
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

function textOf(props: Record<string, unknown>): string {
  const t = obj(props.text);
  if (str(t.text)) return str(t.text);
  if (Array.isArray(t.segments)) return t.segments.map((s) => (typeof obj(s).text === 'string' ? (obj(s).text as string) : '')).join('').trim();
  return '';
}

function chipsOf(c: Component): string[] {
  const p = c.props;
  switch (c.tag) {
    case 'clickable-button':
      return [str(obj(p.clickableWord).text)];
    case 'draggable-button':
    case 'draggable-square-word':
      return [str(obj(p.draggableButton).text)];
    case 'interactible-button':
      return [str(obj(p.interactibleButton).text)];
    case 'draggable-button-block':
      return Array.isArray(p.draggableButtonBlock) ? p.draggableButtonBlock.map((b) => str(obj(b).text)) : [];
    case 'clickable-button-block': {
      const block = obj(p.clickableWordBlock);
      const words = [...(Array.isArray(block.correctWords) ? block.correctWords : []), ...(Array.isArray(block.incorrectWords) ? block.incorrectWords : [])];
      return words.map(str);
    }
    default:
      return [];
  }
}

function questionsOf(c: Component): { prompt: string; questions: ChoiceQuestion[] } | null {
  if (c.tag !== 'sentence-game') return null;
  const game = obj(c.props.sentenceGame);
  const sentences = (Array.isArray(game.sentences) ? game.sentences : []).map(obj).filter((s) => str(s.sentence) && str(s.correctWord));
  if (!sentences.length) return null;
  const options = [...new Set(sentences.map((s) => str(s.correctWord)))];
  return {
    prompt: str(game.title),
    questions: sentences.map((s) => ({ question: str(s.sentence), options, correct: str(s.correctWord) })),
  };
}

/** A word block with exactly one right word is a single-choice question about the text above it. */
function singleChoice(c: Component): { correct: string; options: string[] } | null {
  if (c.tag !== 'clickable-button-block') return null;
  const block = obj(c.props.clickableWordBlock);
  const correct = (Array.isArray(block.correctWords) ? block.correctWords : []).map(str).filter(Boolean);
  const wrong = (Array.isArray(block.incorrectWords) ? block.incorrectWords : []).map(str).filter(Boolean);
  if (correct.length !== 1 || !wrong.length) return null;
  // Authored order (the story's own layout), as the design shows it.
  return { correct: correct[0]!, options: [...correct, ...wrong] };
}

/** One step per story page. */
export function durysSteps(xmls: string[], group: string): ChoiceStep[] {
  return xmls.map((xml, page) => {
    const texts: string[] = [];
    const examples: string[] = [];
    const prompts: string[] = [];
    const questions: ChoiceQuestion[] = [];
    for (const c of parseCanvas(xml)) {
      if (c.tag === 'text') {
        const text = textOf(c.props);
        if (text) texts.push(text);
        continue;
      }
      const single = singleChoice(c);
      if (single) {
        questions.push({ question: texts.pop() ?? '', ...single });
        continue;
      }
      const game = questionsOf(c);
      if (game) {
        if (game.prompt) prompts.push(game.prompt);
        questions.push(...game.questions);
        continue;
      }
      examples.push(...chipsOf(c).filter(Boolean));
    }
    return {
      id: `${group}:page${page}`,
      kind: 'choice',
      label: 'grammar',
      group,
      intro: texts.map(plainParagraph),
      examples,
      prompt: prompts.join(' '),
      questions,
    };
  });
}
