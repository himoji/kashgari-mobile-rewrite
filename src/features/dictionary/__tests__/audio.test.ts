import { wordAudioUrl } from '@/features/dictionary/audio';

describe('wordAudioUrl', () => {
  it('builds Kazakh urls with the word id', () => {
    expect(wordAudioUrl('kk', { id: '42', url: 'tabigat ana' })).toBe(
      'https://www.kashgari.kz/audio/kz/tabigat_ana_42.mp3',
    );
  });
  it('builds other languages without the id', () => {
    expect(wordAudioUrl('en', { id: '7', url: 'water' })).toBe(
      'https://www.kashgari.kz/audio/en/water.mp3',
    );
  });
  it('has no audio without a url', () => {
    expect(wordAudioUrl('kk', { id: '1', url: '' })).toBeNull();
  });
});
