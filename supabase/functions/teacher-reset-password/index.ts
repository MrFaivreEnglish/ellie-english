import { createClient } from 'npm:@supabase/supabase-js@2';

const PROFILE_TABLE = 'student_profiles';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-teacher-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ResetRequestBody = {
  username?: unknown;
  newPassword?: unknown;
};

type StudentProfile = {
  id: string;
  username: string | null;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const normalizeUsername = (username: string) =>
  username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');

const safeEquals = (left: string, right: string) => {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
};

const getSupabaseSecretKey = () => {
  const secretKeysText = Deno.env.get('SUPABASE_SECRET_KEYS');

  if (secretKeysText) {
    try {
      const secretKeys = JSON.parse(secretKeysText) as Record<string, unknown>;
      const defaultSecret = secretKeys.default;

      if (typeof defaultSecret === 'string' && defaultSecret.length > 0) {
        return defaultSecret;
      }
    } catch {
      // Fall back to the legacy service role variable below.
    }
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  throw new Error('Missing Supabase service role secret.');
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Use POST to reset a password.' }, 405);
  }

  const expectedTeacherSecret = Deno.env.get('TEACHER_RESET_SECRET')?.trim();
  const receivedTeacherSecret = request.headers.get('x-teacher-secret')?.trim() ?? '';

  if (!expectedTeacherSecret) {
    return jsonResponse({ error: 'Teacher reset secret is not configured.' }, 500);
  }

  if (!receivedTeacherSecret || !safeEquals(receivedTeacherSecret, expectedTeacherSecret)) {
    return jsonResponse({ error: 'Wrong teacher code.' }, 403);
  }

  let body: ResetRequestBody;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Send a username and a new password.' }, 400);
  }

  const username = normalizeUsername(typeof body.username === 'string' ? body.username : '');
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return jsonResponse({ error: 'Username must be 3 to 32 letters, numbers, dots, dashes, or underscores.' }, 400);
  }

  if (newPassword.length < 6 || newPassword.length > 72) {
    return jsonResponse({ error: 'New password must be 6 to 72 characters.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (!supabaseUrl) {
    return jsonResponse({ error: 'Supabase URL is not configured.' }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from(PROFILE_TABLE)
    .select('id, username')
    .eq('username', username)
    .maybeSingle<StudentProfile>();

  if (profileError) {
    return jsonResponse({ error: 'Could not find the student profile.' }, 500);
  }

  if (!profile?.id) {
    return jsonResponse({ error: 'Student not found.' }, 404);
  }

  const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (resetError) {
    return jsonResponse({ error: resetError.message || 'Could not reset the password.' }, 400);
  }

  return jsonResponse({
    ok: true,
    username: profile.username ?? username,
  });
});
