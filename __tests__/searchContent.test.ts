import { searchContent, MAX_WORD_HITS } from '../features/home/searchContent';

const vocab = [
  { title: 'Seasons', flashcards: [{ english: 'summer', french: 'été' }, { english: 'winter', french: 'hiver' }] },
  { title: 'Weather', flashcards: [{ english: 'sunny', french: 'ensoleillé' }, { english: 'summer', french: 'été' }] },
  { title: 'Animals', flashcards: [{ category: 'Pets', words: [{ english: 'cat', french: 'chat' }] }] },
];
const grammar = [{ title: 'Present simple' }, { title: 'Seasons and months quiz' }];

describe('searchContent', () => {
  it('ignores accents and case, in either language', () => {
    expect(searchContent('ETE', vocab, grammar).words.map((hit) => hit.word.english)).toEqual(['summer']);
    expect(searchContent('hiver', vocab, grammar).words[0].word.english).toBe('winter');
    expect(searchContent('Cat', vocab, grammar).words[0].lessonTitle).toBe('Animals');
  });

  it('lists a word once even if several lessons contain it', () => {
    expect(searchContent('summer', vocab, grammar).words).toHaveLength(1);
  });

  it('finds lessons of both kinds, prefix matches first', () => {
    const { lessons } = searchContent('season', vocab, grammar);
    expect(lessons.map((hit) => `${hit.type}:${hit.title}`)).toEqual(['vocabulary:Seasons', 'grammar:Seasons and months quiz']);
  });

  it('needs two letters and caps the word list', () => {
    expect(searchContent('s', vocab, grammar)).toEqual({ lessons: [], words: [] });
    const many = [{ title: 'Big', flashcards: Array.from({ length: 80 }, (_, i) => ({ english: `word${i}`, french: `mot${i}` })) }];
    expect(searchContent('word', many, []).words).toHaveLength(MAX_WORD_HITS);
  });
});
