import { aboutMePronunciation } from './pronunciation/AboutMePronunciation';
import { classroomEnglishPronunciation } from './pronunciation/ClassroomEnglishPronunciation';
import { givingOpinionsPronunciation } from './pronunciation/GivingOpinionsPronunciation';
import { jobInterviewPronunciation } from './pronunciation/JobInterviewPronunciation';
import { oralExamPronunciation } from './pronunciation/OralExamPronunciation';
import { pastStoriesPronunciation } from './pronunciation/PastStoriesPronunciation';
import { pictureDescriptionPronunciation } from './pronunciation/PictureDescriptionPronunciation';
import type { PronunciationCategory } from './pronunciation/pronunciationTypes';

export type {
  PronunciationCategory,
  PronunciationLesson,
} from './pronunciation/pronunciationTypes';

export const pronunciationCategories: PronunciationCategory[] = [
  classroomEnglishPronunciation,
  aboutMePronunciation,
  givingOpinionsPronunciation,
  pastStoriesPronunciation,
  pictureDescriptionPronunciation,
  oralExamPronunciation,
  jobInterviewPronunciation,
];
