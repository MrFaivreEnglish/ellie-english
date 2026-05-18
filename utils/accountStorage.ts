import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from '../lib/config';

const LEGACY_ACCOUNT_SESSION_KEY = '@ellie_account_session';
const PROFILE_TABLE = 'student_profiles';
const PROGRESS_TABLE = 'student_progress_items';
const DELETE_ACCOUNT_RPC = 'delete_current_student_account';
const USERNAME_EMAIL_DOMAIN = 'ellie-students.example.com';
const BLOCKED_ACCOUNT_NAME_PARTS = [
  'asshole',
  'bastard',
  'batard',
  'batarde',
  'bitch',
  'bollocks',
  'branleur',
  'branleuse',
  'branler',
  'bordel',
  'bouffon',
  'bouffonne',
  'connard',
  'connarde',
  'connasse',
  'crap',
  'cunt',
  'damn',
  'dick',
  'encule',
  'enculee',
  'enculer',
  'fdp',
  'filsdepute',
  'fuck',
  'fuk',
  'hitler',
  'merde',
  'ntm',
  'petasse',
  'nazi',
  'putain',
  'salaud',
  'salope',
  'shit',
  'slut',
  'suceur',
  'suceuse',
  'tamere',
  'whore',
];

const BLOCKED_ACCOUNT_NAME_EXACT_WORDS = [
  'bite',
  'chatte',
  'conne',
  'couille',
  'couilles',
  'pd',
  'pute',
  'tg',
];

export type AccountUser = {
  id: string;
  username: string;
  displayName: string;
  xp: number;
  updatedAt?: string;
};

export type AccountSession = {
  token: string;
  user: AccountUser;
};

type StudentProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  xp: number | null;
  updated_at?: string | null;
};

export type CloudProgressType = 'grammar_correct' | 'vocab_learnt' | 'timer_best' | 'achievement';

export type CloudProgressItem = {
  type: CloudProgressType;
  itemKey: string;
  value?: Record<string, unknown>;
  updatedAt?: string;
};

type StudentProgressRow = {
  user_id: string;
  type: string | null;
  item_key: string | null;
  value: Record<string, unknown> | null;
  updated_at?: string | null;
};

let supabaseClient: SupabaseClient | null = null;

export const isAccountBackendConfigured = () => supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const getAccountBackendUrl = () => supabaseUrl;

const getSupabaseClient = () => {
  if (!isAccountBackendConfigured()) {
    throw new Error('Supabase is not configured yet.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
};

const normalizeXP = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numberValue)) return 0;

  return Math.max(0, Math.floor(numberValue));
};

const normalizeUsername = (username: string) =>
  username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');

const normalizeNameForSafetyCheck = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z]/g, '');

const normalizeNameTokensForSafetyCheck = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .split(/[^a-z]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const assertStudentNameIsAllowed = (value: string, label: string) => {
  const checked = normalizeNameForSafetyCheck(value);
  if (!checked) return;

  const blocked = BLOCKED_ACCOUNT_NAME_PARTS.some((part) => checked.includes(normalizeNameForSafetyCheck(part)));
  const tokens = normalizeNameTokensForSafetyCheck(value);
  const blockedExact = BLOCKED_ACCOUNT_NAME_EXACT_WORDS.some((word) => {
    const normalizedWord = normalizeNameForSafetyCheck(word);
    return checked === normalizedWord || tokens.includes(normalizedWord);
  });

  if (blocked || blockedExact) {
    throw new Error(`${label} is not allowed. Choose a respectful name.`);
  }
};

const usernameToEmail = (username: string) => `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;

const getReadableAuthError = (error: unknown) => {
  let message = '';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    const messageParts = ['message', 'error_description', 'details', 'hint', 'code']
      .map((key) => errorRecord[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    message = messageParts.join(' ');

    if (!message) {
      try {
        message = JSON.stringify(error);
      } catch {
        message = '';
      }
    }
  }

  if (!message) {
    message = 'Account action failed.';
  }

  const normalized = message.toLowerCase();

  if (normalized.includes('email rate limit')) {
    return 'Supabase is trying to send auth emails. Disable Confirm email in Supabase Auth settings, then wait for the rate limit to reset.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Wrong username or password.';
  }

  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'This username already exists. Choose another username or sign in.';
  }

  if (
    normalized.includes('student_profiles') &&
    (normalized.includes('does not exist') || normalized.includes('schema cache') || normalized.includes('could not find'))
  ) {
    return 'Supabase is linked, but the student_profiles table is missing. Run the SQL setup in docs/supabase-accounts.md.';
  }

  if (
    normalized.includes('student_progress_items') &&
    (normalized.includes('does not exist') || normalized.includes('schema cache') || normalized.includes('could not find'))
  ) {
    return 'Supabase is linked, but the student_progress_items table is missing. Run the progress SQL setup in docs/supabase-accounts.md.';
  }

  if (
    normalized.includes(DELETE_ACCOUNT_RPC) ||
    normalized.includes('could not find the function') ||
    normalized.includes('function') && normalized.includes('schema cache')
  ) {
    return 'Delete account is not set up in Supabase yet. Run the delete-account SQL in docs/supabase-accounts.md.';
  }

  return message;
};

const getAuthMetadata = (user: User) => {
  const metadata = user.user_metadata ?? {};
  const username = typeof metadata.username === 'string' ? metadata.username : '';
  const displayName = typeof metadata.display_name === 'string' ? metadata.display_name : '';

  return {
    username,
    displayName,
  };
};

const mapProfileToUser = (authUser: User, profile?: StudentProfile | null): AccountUser => {
  const metadata = getAuthMetadata(authUser);
  const username = profile?.username || metadata.username || authUser.email?.split('@')[0] || '';
  const displayName = profile?.display_name || metadata.displayName || username;

  return {
    id: authUser.id,
    username,
    displayName,
    xp: normalizeXP(profile?.xp),
    updatedAt: profile?.updated_at ?? undefined,
  };
};

const fetchProfile = async (userId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('id, username, display_name, xp, updated_at')
    .eq('id', userId)
    .maybeSingle<StudentProfile>();

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  return data;
};

const upsertProfile = async (
  authUser: User,
  username: string,
  displayName: string,
  xp: number
) => {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert({
      id: authUser.id,
      username: normalizeUsername(username),
      display_name: displayName.trim() || normalizeUsername(username),
      xp: normalizeXP(xp),
      updated_at: now,
    })
    .select('id, username, display_name, xp, updated_at')
    .single<StudentProfile>();

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  return data;
};

const buildAccountSession = async (
  authSession: Session,
  options: { fallbackUsername?: string; fallbackDisplayName?: string; initialXP?: number } = {}
) => {
  const profile = await fetchProfile(authSession.user.id);
  const metadata = getAuthMetadata(authSession.user);
  const fallbackUsername = normalizeUsername(
    options.fallbackUsername || metadata.username || authSession.user.email?.split('@')[0] || ''
  );

  if (!profile) {
    const createdProfile = await upsertProfile(
      authSession.user,
      fallbackUsername,
      options.fallbackDisplayName || metadata.displayName || fallbackUsername,
      options.initialXP ?? 0
    );

    return {
      token: authSession.access_token,
      user: mapProfileToUser(authSession.user, createdProfile),
    };
  }

  return {
    token: authSession.access_token,
    user: mapProfileToUser(authSession.user, profile),
  };
};

const getActiveAuthSession = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  return data.session;
};

const normalizeProgressValue = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
};

const mapProgressRow = (row: StudentProgressRow): CloudProgressItem | null => {
  if (!row.type || !row.item_key) return null;

  const validTypes: CloudProgressType[] = ['grammar_correct', 'vocab_learnt', 'timer_best', 'achievement'];
  if (!validTypes.includes(row.type as CloudProgressType)) return null;

  return {
    type: row.type as CloudProgressType,
    itemKey: row.item_key,
    value: normalizeProgressValue(row.value),
    updatedAt: row.updated_at ?? undefined,
  };
};

export const fetchCloudProgressItems = async (): Promise<CloudProgressItem[]> => {
  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  const { data, error } = await getSupabaseClient()
    .from(PROGRESS_TABLE)
    .select('user_id, type, item_key, value, updated_at')
    .eq('user_id', authSession.user.id);

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  return ((data ?? []) as StudentProgressRow[])
    .map(mapProgressRow)
    .filter((item): item is CloudProgressItem => !!item);
};

export const upsertCloudProgressItems = async (items: CloudProgressItem[]) => {
  const validItems = items.filter((item) => item.itemKey.trim().length > 0);
  if (validItems.length === 0) return;

  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  const now = new Date().toISOString();
  const rows = validItems.map((item) => ({
    user_id: authSession.user.id,
    type: item.type,
    item_key: item.itemKey,
    value: item.value ?? {},
    updated_at: now,
  }));

  const { error } = await getSupabaseClient()
    .from(PROGRESS_TABLE)
    .upsert(rows, { onConflict: 'user_id,type,item_key' });

  if (error) {
    throw new Error(getReadableAuthError(error));
  }
};

export const deleteCloudProgressItem = async (type: CloudProgressType, itemKey: string) => {
  const normalizedItemKey = itemKey.trim();
  if (!normalizedItemKey) return;

  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  const { error } = await getSupabaseClient()
    .from(PROGRESS_TABLE)
    .delete()
    .eq('user_id', authSession.user.id)
    .eq('type', type)
    .eq('item_key', normalizedItemKey);

  if (error) {
    throw new Error(getReadableAuthError(error));
  }
};

export const clearCloudProgressItems = async () => {
  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  const { error } = await getSupabaseClient()
    .from(PROGRESS_TABLE)
    .delete()
    .eq('user_id', authSession.user.id);

  if (error) {
    throw new Error(getReadableAuthError(error));
  }
};

export const loadAccountSession = async (): Promise<AccountSession | null> => {
  if (!isAccountBackendConfigured()) return null;

  try {
    await AsyncStorage.removeItem(LEGACY_ACCOUNT_SESSION_KEY);
    const authSession = await getActiveAuthSession();

    if (!authSession) {
      return null;
    }

    return buildAccountSession(authSession);
  } catch {
    return null;
  }
};

export const clearAccountSession = async () => {
  await AsyncStorage.removeItem(LEGACY_ACCOUNT_SESSION_KEY);

  if (!isAccountBackendConfigured()) return;

  try {
    await getSupabaseClient().auth.signOut();
  } catch {}
};

export const deleteSupabaseAccount = async () => {
  const supabase = getSupabaseClient();
  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  const { error } = await supabase.rpc(DELETE_ACCOUNT_RPC);

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  await AsyncStorage.removeItem(LEGACY_ACCOUNT_SESSION_KEY);

  try {
    await supabase.auth.signOut();
  } catch {}
};

export const signInWithSupabase = async (username: string, password: string) => {
  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername.length < 3) {
    throw new Error('Enter a username with at least 3 characters.');
  }

  assertStudentNameIsAllowed(normalizedUsername, 'Username');

  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: usernameToEmail(normalizedUsername),
    password,
  });

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  if (!data.session) {
    throw new Error('Sign in failed. Check the account settings in Supabase.');
  }

  return buildAccountSession(data.session, { fallbackUsername: normalizedUsername });
};

export const createSupabaseAccount = async (
  username: string,
  password: string,
  initialXP: number
) => {
  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername.length < 3) {
    throw new Error('Choose a username with at least 3 characters.');
  }

  assertStudentNameIsAllowed(normalizedUsername, 'Username');

  if (password.length < 6) {
    throw new Error('Choose a password with at least 6 characters.');
  }

  const normalizedDisplayName = normalizedUsername;
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: usernameToEmail(normalizedUsername),
    password,
    options: {
      data: {
        username: normalizedUsername,
        display_name: normalizedDisplayName,
      },
    },
  });

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  if (!data.session) {
    throw new Error('Account created, but email confirmation is enabled. Disable Confirm email in Supabase Auth settings for username-only accounts.');
  }

  await upsertProfile(data.session.user, normalizedUsername, normalizedDisplayName, initialXP);

  return buildAccountSession(data.session, {
    fallbackUsername: normalizedUsername,
    fallbackDisplayName: normalizedDisplayName,
    initialXP,
  });
};

export const refreshSupabaseUser = async () => {
  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  return buildAccountSession(authSession);
};

export const updateSupabaseXP = async (session: AccountSession, xp: number) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .update({
      xp: normalizeXP(xp),
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('id, username, display_name, xp, updated_at')
    .single<StudentProfile>();

  if (error) {
    throw new Error(getReadableAuthError(error));
  }

  const authSession = await getActiveAuthSession();

  if (!authSession) {
    throw new Error('You are not signed in.');
  }

  return {
    token: authSession.access_token,
    user: mapProfileToUser(authSession.user, data),
  };
};

export const syncXPToCloudIfSignedIn = async (xp: number) => {
  if (!isAccountBackendConfigured()) return null;

  const authSession = await getActiveAuthSession();
  if (!authSession) return null;

  try {
    const accountSession = {
      token: authSession.access_token,
      user: mapProfileToUser(authSession.user),
    };

    return await updateSupabaseXP(accountSession, xp);
  } catch {
    return null;
  }
};

export const syncProgressItemToCloudIfSignedIn = async (item: CloudProgressItem) => {
  if (!isAccountBackendConfigured()) return null;

  try {
    const authSession = await getActiveAuthSession();
    if (!authSession) return null;

    await upsertCloudProgressItems([item]);
    return item;
  } catch {
    return null;
  }
};

export const deleteProgressItemFromCloudIfSignedIn = async (
  type: CloudProgressType,
  itemKey: string
) => {
  if (!isAccountBackendConfigured()) return null;

  try {
    const authSession = await getActiveAuthSession();
    if (!authSession) return null;

    await deleteCloudProgressItem(type, itemKey);
    return true;
  } catch {
    return null;
  }
};
