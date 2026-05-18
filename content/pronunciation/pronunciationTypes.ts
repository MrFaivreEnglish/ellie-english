export type PronunciationLesson = {
  title: string;
  subtitle: string;
  category: string;
  goal: string;
  focus: string;
  tip: string;
  imageUrl?: string;
  examples: string[];
  usefulPhrases?: string[];
  ruleCards?: Array<{
    title: string;
    description: string;
    examples: string[];
  }>;
  commonMistake?: string;
};

export type PronunciationCategory = {
  title: string;
  emoji: string;
  color: string;
  lessons: PronunciationLesson[];
};
