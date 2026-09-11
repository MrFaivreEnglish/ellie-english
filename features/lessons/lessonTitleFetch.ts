import { supabaseAnonKey, supabaseUrl } from '../../lib/config';




export const isLessonTitleFetchConfigured = () => supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const fetchLessonTitleFromUrl = async (url: string): Promise<string> => {
  if (!isLessonTitleFetchConfigured()) {
    throw new Error('Supabase is not configured on this build.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/fetch-lesson-title`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ url }),
  });

  const payload = await response.json().catch(() => null) as { title?: string; error?: string } | null;

  if (!response.ok || !payload?.title) {
    throw new Error(payload?.error || 'Could not fetch the page title.');
  }

  return payload.title;
};
