const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Only ever fetch pages on this host — without an allowlist this endpoint
// would be an open URL-fetch proxy for anyone with the anon key.
const ALLOWED_HOSTNAMES = ['digipad.app'];

// Digipad's <title> is "<pad name> - Digipad by La Digitale"; teachers only
// care about the pad name, so strip the platform suffix before returning it.
const DIGIPAD_TITLE_SUFFIX = /\s*-\s*Digipad by La Digitale\s*$/i;

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#039': "'",
  apos: "'",
  nbsp: ' ',
};

const decodeHtmlEntities = (value: string) =>
  value.replace(/&(#?\w+);/g, (match, entity) => HTML_ENTITIES[entity] ?? match);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Use POST with a JSON { url } body.' }, 405);
  }

  let body: { url?: unknown };

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Send a JSON body with a "url" field.' }, 400);
  }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';

  if (!rawUrl) {
    return jsonResponse({ error: 'Missing "url".' }, 400);
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return jsonResponse({ error: 'That is not a valid URL.' }, 400);
  }

  if (targetUrl.protocol !== 'https:' || !ALLOWED_HOSTNAMES.includes(targetUrl.hostname)) {
    return jsonResponse({ error: `Only https:// links on ${ALLOWED_HOSTNAMES.join(', ')} are supported.` }, 400);
  }

  let pageResponse: Response;

  try {
    pageResponse = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EllieLessonTitleFetch/1.0)' },
    });
  } catch {
    return jsonResponse({ error: 'Could not reach that page.' }, 502);
  }

  if (!pageResponse.ok) {
    return jsonResponse({ error: `Page returned status ${pageResponse.status}.` }, 502);
  }

  const html = await pageResponse.text();
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);

  if (!match) {
    return jsonResponse({ error: 'Could not find a title on that page.' }, 502);
  }

  const rawTitle = decodeHtmlEntities(match[1].trim());
  const title = rawTitle.replace(DIGIPAD_TITLE_SUFFIX, '').trim();

  if (!title) {
    return jsonResponse({ error: 'That page has an empty title.' }, 502);
  }

  return jsonResponse({ title });
});
