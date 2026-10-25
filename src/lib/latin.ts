/** Kazakh Cyrillic → Latin (2021 alphabet), as in the design (ь is dropped). */
const MAP: Record<string, string> = {
  А: 'A', а: 'a', Ә: 'Ä', ә: 'ä', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g',
  Ғ: 'Ğ', ғ: 'ğ', Д: 'D', д: 'd', Е: 'E', е: 'e', Ё: 'Ö', ё: 'ö', Ж: 'J', ж: 'j',
  З: 'Z', з: 'z', И: 'İ', и: 'i', Й: 'İ', й: 'i', К: 'K', к: 'k', Қ: 'Q', қ: 'q',
  Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n', Ң: 'Ñ', ң: 'ñ', О: 'O', о: 'o',
  Ө: 'Ö', ө: 'ö', П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
  У: 'U', у: 'u', Ұ: 'Ū', ұ: 'ū', Ү: 'Ü', ү: 'ü', І: 'I', і: 'ı', Ь: '', ь: '',
  Э: 'E', э: 'e', Ю: 'İu', ю: 'ıu', Я: 'İa', я: 'ia', Ы: 'Y', ы: 'y', Һ: 'H', һ: 'h',
  Ц: 'S', ц: 's', Ч: 'Ch', ч: 'ch', Ф: 'F', ф: 'f', Х: 'H', х: 'h', Ш: 'Ş', ш: 'ş',
  Щ: 'Ş', щ: 'ş',
};

export function toLatin(text: string): string {
  let out = '';
  for (const char of text) out += MAP[char] ?? char;
  return out;
}
