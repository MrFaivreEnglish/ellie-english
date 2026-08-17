export type VocabRushFontWeight = '400' | '500' | '600' | '700' | '800';

export const fontFamilyForWeight = (weight: VocabRushFontWeight) => {
  switch (weight) {
    case '400': return 'LibreFranklin_400Regular';
    case '500': return 'LibreFranklin_500Medium';
    case '600': return 'LibreFranklin_600SemiBold';
    case '700': return 'LibreFranklin_700Bold';
    case '800': return 'LibreFranklin_800ExtraBold';
    default: return 'LibreFranklin_400Regular';
  }
};
