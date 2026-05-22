import ActivityVocab from '../vocabulary/ActivityVocab';
import AnimalsVocab from '../vocabulary/AnimalsVocab';
import AtSchoolVocab from '../vocabulary/AtSchoolVocab';
import BodyVocab from '../vocabulary/BodyVocab';
import BreakfastVocab from '../vocabulary/BreakfastVocab';
import BullyingVocab from '../vocabulary/BullyingVocab';
import CinemaVocab from '../vocabulary/CinemaVocab';
import CityTravelVocab from '../vocabulary/CityTravelVocab';
import ClassroomEnglishVocab from '../vocabulary/ClassroomEnglishVocab';
import ClothesVocab from '../vocabulary/ClothesVocab';
import ColoursVocab from '../vocabulary/ColoursVocab';
import CookingVocab from '../vocabulary/CookingVocab';
import DailyQuestionsVocab from '../vocabulary/DailyQuestionsVocab';
import DailyRoutineVocab from '../vocabulary/DailyRoutineVocab';
import DateVocab from '../vocabulary/DateVocab';
import DescribingPictureVocab from '../vocabulary/DescribingPictureVocab';
import DetectiveVocab from '../vocabulary/DetectiveVocab';
import DystopiaVocab from '../vocabulary/DystopiaVocab';
import EcologyVocab from '../vocabulary/EcologyVocab';
import EmotionsLevel2Vocab from '../vocabulary/EmotionsLevel2Vocab';
import EmotionsVocab from '../vocabulary/EmotionsVocab';
import ExtremeSportsVocab from '../vocabulary/ExtremeSportsVocab';
import FamilyVocab from '../vocabulary/FamilyVocab';
import FashionVocab from '../vocabulary/FashionVocab';
import FoodVocab from '../vocabulary/FoodVocab';
import FrequencyAdverbsVocab from '../vocabulary/FrequencyAdverbsVocab';
import FurnitureVocab from '../vocabulary/FurnitureVocab';
import GeographyVocab from '../vocabulary/GeographyVocab';
import GettingAJobVocab from '../vocabulary/GettingAJobVocab';
import HouseVocab from '../vocabulary/HouseVocab';
import InstructionsVocab from '../vocabulary/InstructionsVocab';
import InternetVocab from '../vocabulary/InternetVocab';
import JobsVocab from '../vocabulary/JobsVocab';
import LegendsVocab from '../vocabulary/LegendsVocab';
import LocationVocab from '../vocabulary/LocationVocab';
import LoveVocab from '../vocabulary/LoveVocab';
import NationalityVocab from '../vocabulary/NationalityVocab';
import NourritureVocab from '../vocabulary/NourritureVocab';
import OpinionLevel1Vocab from '../vocabulary/OpinionLevel1Vocab';
import OpinionLevel2Vocab from '../vocabulary/OpinionLevel2Vocab';
import PersonalityLevel1Vocab from '../vocabulary/PersonalityLevel1Vocab';
import PersonalityLevel2Vocab from '../vocabulary/PersonalityLevel2Vocab';
import PhysicalDescriptionVocab from '../vocabulary/PhysicalDescriptionVocab';
import QuestionWordsVocab from '../vocabulary/QuestionWordsVocab';
import RobotsVocab from '../vocabulary/RobotsVocab';
import SchoolLvl2Vocab from '../vocabulary/SchoolLvl2Vocab';
import SegregationVocab from '../vocabulary/SegregationVocab';
import SpaceVocab from '../vocabulary/SpaceVocab';
import TastesVocab from '../vocabulary/TastesVocab';
import TheBlitzVocab from '../vocabulary/TheBlitzVocab';
import TimeVocab from '../vocabulary/TimeVocab';
import TypesOfDocumentsVocab from '../vocabulary/TypesOfDocumentsVocab';
import UKVocab from '../vocabulary/UKVocab';
import VideoGamePowersVocab from '../vocabulary/VideoGamePowersVocab';
import VideoGamesVocab from '../vocabulary/VideoGamesVocab';

const withDescription = (lesson: any, description: string) => ({
  ...lesson,
  description,
});

export const vocabularyCategories: Array<{ title: string; lessons: any[] }> = [
  {
    title: 'Classroom English',
    lessons: [
      withDescription(ClassroomEnglishVocab, 'Use simple classroom words.'),
      withDescription(InstructionsVocab, 'Understand easy class instructions.'),
      withDescription(DailyQuestionsVocab, 'Answer common everyday questions.'),
      withDescription(TypesOfDocumentsVocab, 'Name common school and work documents.'),
      withDescription(DescribingPictureVocab, 'Describe what you can see in a picture.'),
    ],
  },
  {
    title: 'Basics',
    lessons: [
      withDescription(TimeVocab, 'Tell the time in English.'),
      withDescription(DateVocab, 'Say days, months, and dates.'),
      withDescription(ColoursVocab, 'Name basic colours.'),
      withDescription(QuestionWordsVocab, 'Use who, what, where, and more.'),
      withDescription(FrequencyAdverbsVocab, 'Say how often things happen.'),
      withDescription(LocationVocab, 'Say where things are.'),
    ],
  },
  {
    title: 'People',
    lessons: [
      withDescription(FamilyVocab, 'Talk about your family.'),
      withDescription(BodyVocab, 'Name parts of the body.'),
      withDescription(PhysicalDescriptionVocab, 'Describe how people look.'),
      withDescription(PersonalityLevel1Vocab, 'Use easy words for personality.'),
      withDescription(PersonalityLevel2Vocab, 'Use more words for personality.'),
      withDescription(EmotionsVocab, 'Say how you feel.'),
      withDescription(EmotionsLevel2Vocab, 'Talk about feelings with more detail.'),
      withDescription(NationalityVocab, 'Talk about countries and nationalities.'),
    ],
  },
  {
    title: 'Opinions & Tastes',
    lessons: [
      withDescription(OpinionLevel1Vocab, 'Give simple opinions.'),
      withDescription(OpinionLevel2Vocab, 'Explain your opinion more clearly.'),
      withDescription(TastesVocab, 'Talk about food and flavour.'),
      withDescription(LoveVocab, 'Talk about love and relationships.'),
    ],
  },
  {
    title: 'Daily Life',
    lessons: [
      withDescription(DailyRoutineVocab, 'Talk about your day.'),
      withDescription(AtSchoolVocab, 'Use words for school life.'),
      withDescription(SchoolLvl2Vocab, 'Talk more about school and class.'),
      withDescription(ClothesVocab, 'Name clothes and what people wear.'),
      withDescription(FashionVocab, 'Talk about fashion and style.'),
      withDescription(HouseVocab, 'Talk about rooms at home.'),
      withDescription(FurnitureVocab, 'Name things you find in a house.'),
    ],
  },
  {
    title: 'Food',
    lessons: [
      withDescription(FoodVocab, 'Name everyday food.'),
      withDescription(BreakfastVocab, 'Talk about breakfast food.'),
      withDescription(CookingVocab, 'Use common cooking words.'),
      withDescription(NourritureVocab, 'Talk more about meals and food.'),
    ],
  },
  {
    title: 'Hobbies & Culture',
    lessons: [
      withDescription(ActivityVocab, 'Talk about free-time activities.'),
      withDescription(CinemaVocab, 'Talk about films and the cinema.'),
      withDescription(VideoGamesVocab, 'Use words for video games.'),
      withDescription(VideoGamePowersVocab, 'Talk about powers and game skills.'),
      withDescription(ExtremeSportsVocab, 'Talk about exciting sports.'),
      withDescription(LegendsVocab, 'Read and talk about legends.'),
      withDescription(UKVocab, 'Learn key words about the UK.'),
    ],
  },
  {
    title: 'Travel & Places',
    lessons: [
      withDescription(CityTravelVocab, 'Get around in a city.'),
      withDescription(GeographyVocab, 'Talk about places and landscapes.'),
    ],
  },
  {
    title: 'Science & Nature',
    lessons: [
      withDescription(AnimalsVocab, 'Name common animals.'),
      withDescription(EcologyVocab, 'Talk about nature and the planet.'),
      withDescription(SpaceVocab, 'Talk about space.'),
      withDescription(RobotsVocab, 'Talk about robots and technology.'),
    ],
  },
  {
    title: 'History & Society',
    lessons: [
      withDescription(DetectiveVocab, 'Use words from detective stories.'),
      withDescription(DystopiaVocab, 'Talk about control, freedom, and rebellion in dystopian stories.'),
      withDescription(TheBlitzVocab, 'Talk about the Blitz.'),
      withDescription(SegregationVocab, 'Use words about segregation and rights.'),
      withDescription(BullyingVocab, 'Talk about bullying.'),
      withDescription(InternetVocab, 'Talk about the internet and online life.'),
    ],
  },
  {
    title: 'Work',
    lessons: [
      withDescription(JobsVocab, 'Talk about jobs.'),
      withDescription(GettingAJobVocab, 'Prepare for getting a job.'),
    ],
  },
];

export const vocabularyLessons: any[] = vocabularyCategories.flatMap((category) => category.lessons);
