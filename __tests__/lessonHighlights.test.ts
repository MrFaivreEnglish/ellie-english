jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../content/lessons/lessonHighlights.json', () => ({
  vocabulary: {
    '1': { kind: 'new', since: '2026-09-01' },
    '2': { kind: 'updated', since: '2026-09-01' },
  },
  grammar: {
    '1': { kind: 'updated', since: '2026-09-01' },
  },
}));

import {
  getLessonHighlightKind,
  getSectionHighlightKind,
  markLessonHighlightSeen,
} from '../features/shared/lessonHighlights';

const DAY = 24 * 60 * 60 * 1000;
const since = Date.parse('2026-09-01');

describe('lesson highlights', () => {
  it('badges listed lessons within the window, per section', () => {
    expect(getLessonHighlightKind('vocabulary', { id: '1' }, {}, since + DAY)).toBe('new');
    expect(getLessonHighlightKind('vocabulary', { id: 2 }, {}, since + DAY)).toBe('updated');
    expect(getLessonHighlightKind('grammar', { id: '1' }, {}, since + DAY)).toBe('updated');
    expect(getLessonHighlightKind('vocabulary', { id: '3' }, {}, since + DAY)).toBeUndefined();
  });

  it('expires badges after 30 days', () => {
    expect(getLessonHighlightKind('vocabulary', { id: '1' }, {}, since + 31 * DAY)).toBeUndefined();
  });

  it('ignores custom lessons that happen to share an id', () => {
    expect(getLessonHighlightKind('vocabulary', { id: '1', isCustom: true }, {}, since + DAY)).toBeUndefined();
  });

  it('hides a badge once seen, but shows it again if the lesson changes later', () => {
    expect(getLessonHighlightKind('vocabulary', { id: '1' }, { 'vocabulary:1': '2026-09-02' }, since + DAY)).toBeUndefined();
    expect(getLessonHighlightKind('vocabulary', { id: '1' }, { 'vocabulary:1': '2026-08-20' }, since + DAY)).toBe('new');
  });

  it('gives a section "new" over "updated"', () => {
    expect(getSectionHighlightKind('vocabulary', {}, since + DAY)).toBe('new');
    expect(getSectionHighlightKind('vocabulary', { 'vocabulary:1': '2026-09-02' }, since + DAY)).toBe('updated');
    expect(getSectionHighlightKind('grammar', { 'grammar:1': '2026-09-02' }, since + DAY)).toBeUndefined();
  });

  it('marks a lesson seen for that section only', () => {
    jest.useFakeTimers().setSystemTime(since + DAY);
    markLessonHighlightSeen('vocabulary', { id: '1' });
    expect(getLessonHighlightKind('vocabulary', { id: '1' })).toBeUndefined();
    expect(getLessonHighlightKind('grammar', { id: '1' })).toBe('updated');
    jest.useRealTimers();
  });
});
