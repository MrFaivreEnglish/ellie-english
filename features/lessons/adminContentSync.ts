import { supabaseAnonKey, supabaseUrl } from '../../lib/config';
import { getSignedInAccountAccessToken } from '../account/accountStorage';
import type { ChapterLinkOverride } from './chapterLinkStorage';
import type { CustomChapter } from './customChapterStorage';
import type { CustomVocabularyLesson } from './customLessonStorage';
import { setLiveContentSnapshotCache, type LiveContentPayload } from './liveContentStorage';

export const isAdminContentSyncConfigured = () => supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export type PublishAdminContentResult = {
  chapterLinkCount: number;
  customChapterCount: number;
  vocabularyLessonCount: number;
  version: number;
  publishedAt: string;
};

export type AdminContentAccess = {
  isAdmin: boolean;
  version: number;
  publishedAt: string;
};

const getAccessToken = async () => {
  if (!isAdminContentSyncConfigured()) {
    throw new Error('Supabase is not configured on this build.');
  }

  const token = await getSignedInAccountAccessToken();
  if (!token) throw new Error('Sign in with your admin account first.');
  return token;
};

const functionHeaders = (token: string) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${token}`,
});

export const getAdminContentAccess = async (): Promise<AdminContentAccess> => {
  const token = await getAccessToken();
  const response = await fetch(`${supabaseUrl}/functions/v1/publish-admin-content`, {
    method: 'GET',
    headers: functionHeaders(token),
  });
  const payload = await response.json().catch(() => null) as
    | { isAdmin?: boolean; version?: number; publishedAt?: string; error?: string }
    | null;

  if (response.status === 403) {
    return { isAdmin: false, version: 0, publishedAt: '' };
  }

  if (!response.ok || !payload) {
    throw new Error(payload?.error || `Admin access check failed (${response.status}).`);
  }

  return {
    isAdmin: payload.isAdmin === true,
    version: Number.isFinite(payload.version) ? Number(payload.version) : 0,
    publishedAt: typeof payload.publishedAt === 'string' ? payload.publishedAt : '',
  };
};

export const publishAdminContent = async (
  content: {
    chapterLinkOverrides: ChapterLinkOverride[];
    customChapters: CustomChapter[];
    customVocabularyLessons: CustomVocabularyLesson[];
  },
  baseVersion: number
): Promise<PublishAdminContentResult> => {
  const token = await getAccessToken();

  const response = await fetch(`${supabaseUrl}/functions/v1/publish-admin-content`, {
    method: 'POST',
    headers: {
      ...functionHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      baseVersion,
      chapterLinkOverrides: content.chapterLinkOverrides,
      customChapters: content.customChapters,
      customVocabularyLessons: content.customVocabularyLessons,
    }),
  });

  const payload = await response.json().catch(() => null) as
    | {
        chapterLinkCount?: number;
        customChapterCount?: number;
        vocabularyLessonCount?: number;
        version?: number;
        publishedAt?: string;
        error?: string;
      }
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.error || `Publish failed (${response.status}).`);
  }

  const version = Number(payload.version ?? baseVersion + 1);
  const publishedAt = typeof payload.publishedAt === 'string' ? payload.publishedAt : new Date().toISOString();
  const livePayload: LiveContentPayload = {
    chapterLinkOverrides: content.chapterLinkOverrides,
    customChapters: content.customChapters,
    customVocabularyLessons: content.customVocabularyLessons,
  };
  await setLiveContentSnapshotCache({ version, publishedAt, payload: livePayload });

  return {
    chapterLinkCount: payload.chapterLinkCount ?? 0,
    customChapterCount: payload.customChapterCount ?? 0,
    vocabularyLessonCount: payload.vocabularyLessonCount ?? 0,
    version,
    publishedAt,
  };
};
