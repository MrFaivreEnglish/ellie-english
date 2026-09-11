import { createClient } from 'npm:@supabase/supabase-js@2';

const CHAPTER_LINKS_TABLE = 'chapter_link_overrides';
const VOCAB_LESSONS_TABLE = 'custom_vocabulary_lessons';
const LIVE_CONTENT_TABLE = 'published_admin_content';
const ADMIN_TABLE = 'admin_content_publishers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const asTrimmedString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim() : fallback;

const asIsoDate = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  return Number.isNaN(Date.parse(value)) ? fallback : value;
};

const normalizeAppLink = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as { target?: unknown; lessonTitle?: unknown; lessonId?: unknown };
  const target = value.target === 'grammar' || value.target === 'vocabulary' ? value.target : null;
  const lessonTitle = asTrimmedString(value.lessonTitle);
  const lessonId = asTrimmedString(value.lessonId);
  if (!target || (!lessonTitle && !lessonId)) return null;
  return { target, lessonTitle, ...(lessonId ? { lessonId } : {}) };
};

const normalizeChapterLink = (raw: any, now: string) => {
  const categoryTitle = asTrimmedString(raw?.categoryTitle);
  const lessonTitle = asTrimmedString(raw?.lessonTitle);
  const displayTitle = asTrimmedString(raw?.displayTitle) || lessonTitle;
  const url = asTrimmedString(raw?.url);
  const id = asTrimmedString(raw?.id) || `${categoryTitle}::${lessonTitle}`;
  const appLink = normalizeAppLink(raw?.appLink);
  if (!id || !categoryTitle || !lessonTitle || (!url && !appLink)) return null;

  return {
    id,
    categoryTitle,
    lessonTitle,
    displayTitle,
    url,
    ...(appLink ? { appLink } : {}),
    createdAt: asIsoDate(raw?.createdAt, now),
    updatedAt: now,
  };
};

const normalizeCustomChapter = (raw: any, now: string) => {
  const id = asTrimmedString(raw?.id);
  const categoryTitle = asTrimmedString(raw?.categoryTitle);
  const title = asTrimmedString(raw?.title);
  const url = asTrimmedString(raw?.url);
  const appLink = normalizeAppLink(raw?.appLink);
  const rawPosition = Number(raw?.position);
  if (!id || !categoryTitle || !title || (!url && !appLink)) return null;

  return {
    id,
    categoryTitle,
    categoryIcon: asTrimmedString(raw?.categoryIcon) || '📚',
    categoryColor: asTrimmedString(raw?.categoryColor) || '#1671B6',
    title,
    url,
    ...(appLink ? { appLink } : {}),
    position: Number.isFinite(rawPosition) ? Math.max(0, Math.floor(rawPosition)) : 0,
    isCustom: true,
    createdAt: asIsoDate(raw?.createdAt, now),
    updatedAt: now,
  };
};

const normalizeVocabLesson = (raw: any, now: string) => {
  const id = asTrimmedString(raw?.id);
  const title = asTrimmedString(raw?.title);
  const flashcards = Array.isArray(raw?.flashcards)
    ? raw.flashcards
        .map((word: any) => ({
          english: asTrimmedString(word?.english),
          french: asTrimmedString(word?.french),
        }))
        .filter((word: { english: string; french: string }) => word.english && word.french)
        .slice(0, 2000)
    : [];
  if (!id || !title || flashcards.length === 0) return null;

  return {
    id,
    title,
    description: asTrimmedString(raw?.description),
    imageUrl: asTrimmedString(raw?.imageUrl),
    category: asTrimmedString(raw?.category) || 'Custom',
    flashcards,
    isCustom: true,
    createdAt: asIsoDate(raw?.createdAt, now),
    updatedAt: now,
  };
};

const replaceLegacyRows = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  table: string,
  rows: Array<Record<string, unknown>>
) => {
  if (rows.length) {
    const { error } = await supabaseAdmin.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  const { data: existing, error: selectError } = await supabaseAdmin.from(table).select('id');
  if (selectError) throw selectError;
  const keepIds = new Set(rows.map((row) => String(row.id)));
  const deleteIds = (existing ?? []).map((row: any) => String(row.id)).filter((id) => !keepIds.has(id));
  if (!deleteIds.length) return;
  const { error: deleteError } = await supabaseAdmin.from(table).delete().in('id', deleteIds);
  if (deleteError) throw deleteError;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ error: 'Use GET or POST.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase credentials are not configured.' }, 500);
  }

  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return jsonResponse({ error: 'Sign in with your admin account.' }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: 'Your admin session is invalid or expired.' }, 401);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const appRole = asTrimmedString(authData.user.app_metadata?.role).toLowerCase();
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from(ADMIN_TABLE)
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (membershipError) return jsonResponse({ error: 'Admin access is not configured yet.' }, 500);
  if (appRole !== 'admin' && !membership) return jsonResponse({ error: 'This account is not an administrator.' }, 403);

  const { data: current, error: currentError } = await supabaseAdmin
    .from(LIVE_CONTENT_TABLE)
    .select('version,published_at')
    .eq('id', 'live')
    .maybeSingle();
  if (currentError) return jsonResponse({ error: 'Live content storage is not configured yet.' }, 500);

  if (request.method === 'GET') {
    return jsonResponse({
      isAdmin: true,
      version: Number(current?.version ?? 0),
      publishedAt: current?.published_at ?? '',
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Send a JSON body.' }, 400);
  }

  const baseVersion = Number(body?.baseVersion);
  const currentVersion = Number(current?.version ?? 0);
  if (!Number.isInteger(baseVersion) || baseVersion !== currentVersion) {
    return jsonResponse({ error: 'Live content changed since this editor was opened. Reopen Admin Tools and try again.' }, 409);
  }

  const rawLinks = Array.isArray(body?.chapterLinkOverrides) ? body.chapterLinkOverrides : [];
  const rawChapters = Array.isArray(body?.customChapters) ? body.customChapters : [];
  const rawLessons = Array.isArray(body?.customVocabularyLessons) ? body.customVocabularyLessons : [];
  if (rawLinks.length > 1000 || rawChapters.length > 1000 || rawLessons.length > 1000) {
    return jsonResponse({ error: 'The content payload is too large.' }, 400);
  }

  const now = new Date().toISOString();
  const chapterLinks = rawLinks.map((value: any) => normalizeChapterLink(value, now)).filter(Boolean);
  const customChapters = rawChapters.map((value: any) => normalizeCustomChapter(value, now)).filter(Boolean);
  const vocabLessons = rawLessons.map((value: any) => normalizeVocabLesson(value, now)).filter(Boolean);
  if (chapterLinks.length !== rawLinks.length || customChapters.length !== rawChapters.length || vocabLessons.length !== rawLessons.length) {
    return jsonResponse({ error: 'Some content is incomplete or invalid. Fix it before publishing.' }, 400);
  }

  const payload = {
    chapterLinkOverrides: chapterLinks,
    customChapters,
    customVocabularyLessons: vocabLessons,
  };
  const nextVersion = currentVersion + 1;

  const snapshotMutation = current
    ? supabaseAdmin
        .from(LIVE_CONTENT_TABLE)
        .update({ version: nextVersion, payload, published_at: now, published_by: authData.user.id })
        .eq('id', 'live')
        .eq('version', currentVersion)
        .select('version,published_at')
        .maybeSingle()
    : supabaseAdmin
        .from(LIVE_CONTENT_TABLE)
        .insert({ id: 'live', version: nextVersion, payload, published_at: now, published_by: authData.user.id })
        .select('version,published_at')
        .maybeSingle();
  const { data: published, error: publishError } = await snapshotMutation;
  if (publishError || !published) {
    return jsonResponse({ error: 'Another publish won the race. Reopen Admin Tools before publishing again.' }, 409);
  }

  let legacySyncWarning = '';
  try {
    await replaceLegacyRows(supabaseAdmin, CHAPTER_LINKS_TABLE, chapterLinks.map((item: any) => ({
      id: item.id,
      category_title: item.categoryTitle,
      lesson_title: item.lessonTitle,
      display_title: item.displayTitle,
      url: item.url,
      app_link_target: item.appLink?.target ?? null,
      app_link_lesson_title: item.appLink?.lessonTitle ?? null,
      app_link_lesson_id: item.appLink?.lessonId ?? null,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    })));
    await replaceLegacyRows(supabaseAdmin, VOCAB_LESSONS_TABLE, vocabLessons.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || null,
      image_url: item.imageUrl || null,
      category: item.category,
      flashcards: item.flashcards,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    })));
  } catch (error) {
    legacySyncWarning = error instanceof Error ? error.message : 'Legacy table sync failed.';
  }

  return jsonResponse({
    chapterLinkCount: chapterLinks.length,
    customChapterCount: customChapters.length,
    vocabularyLessonCount: vocabLessons.length,
    version: Number(published.version),
    publishedAt: published.published_at,
    ...(legacySyncWarning ? { legacySyncWarning } : {}),
  });
});
