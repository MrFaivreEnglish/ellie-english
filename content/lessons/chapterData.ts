import { thirdGradeChapters } from './3eChapters';
import { fourthGradeChapters } from './4eChapters';
import { fifthGradeChapters } from './5eChapters';
import { sixthGradeChapters } from './6eChapters';
import { irregularVerbsChapters } from './IrregularVerbsChapters';
import { segpaChapters } from './SegpaChapters';
import type { ChapterCategory } from './lessonTypes';

export const lessonCategories: ChapterCategory[] = [
  sixthGradeChapters,
  fifthGradeChapters,
  fourthGradeChapters,
  thirdGradeChapters,
  segpaChapters,
  irregularVerbsChapters,
];
