import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bilingual } from '../shared/bilingual';
import {
  AccountSession,
  clearAccountSession,
  clearCloudProgressItems,
  clearLocalProgressOwner,
  createSupabaseAccount,
  deleteSupabaseAccount,
  fetchCloudProgressItems,
  getAccountBackendUrl,
  getLocalProgressOwner,
  isAccountBackendConfigured,
  loadAccountSession,
  refreshSupabaseUser,
  setLocalProgressOwner,
  signInWithSupabase,
  updateSupabaseDisplayName,
  updateSupabaseXP,
  upsertCloudProgressItems,
  type CloudProgressItem,
} from './accountStorage';
import {
  clearLocalStudentProgress,
  getLocalStudentProgressCloudItems,
  getLocalStudentProgressSnapshot,
  mergeCloudStudentProgressItems,
  replaceLocalStudentXP,
  replaceLocalStudentProgressFromCloud,
  restoreLocalStudentProgressSnapshot,
  type LocalStudentProgressSnapshot,
} from '../progress/studentProgressStorage';
import { getShinyEllieProgress } from '../progress/shinyEllieStorage';
import { getXP } from '../progress/xpStorage';
import { useTheme } from '../settings/ThemeContext';
import {
  DEFAULT_ACCOUNT_AVATAR_COLOR_ID,
  DEFAULT_ACCOUNT_AVATAR_ID,
  loadAccountAvatarColorId,
  loadAccountAvatarId,
  saveAccountAvatarColorId,
  saveAccountAvatarId,
  type AccountAvatarColorId,
  type AccountAvatarId,
} from './accountAvatarStorage';
import {
  findAccountPreferenceSnapshot,
  getAccountPreferencesCloudItems,
  saveLocalAccountPreferenceSnapshot,
  syncAccountPreferencesToCloudIfSignedIn,
} from './accountPreferencesStorage';

const GUEST_PROGRESS_SNAPSHOT_KEY = '@ellie_guest_progress_snapshot';
const PREFERENCE_SYNC_DELAY_MS = 1000;

const friendlyErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : '';
  const lower = raw.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) return bilingual('Incorrect username or password.', 'Nom d’utilisateur ou mot de passe incorrect.');
  if (lower.includes('email not confirmed')) return bilingual('Please confirm your email address before logging in.', 'Confirme ton adresse e-mail avant de te connecter.');
  if (lower.includes('duplicate key') || lower.includes('already registered') || lower.includes('already exists')) return bilingual('That username is already taken.', 'Ce nom d’utilisateur est déjà pris.');
  if (lower.includes('user not found') || lower.includes('no user found')) return bilingual('No account found with that username.', 'Aucun compte ne porte ce nom d’utilisateur.');
  if (lower.includes('failed to fetch') || lower.includes('network request failed') || lower.includes('networkerror')) return bilingual('Connection failed. Check your internet and try again.', 'La connexion a échoué. Vérifie ton accès à Internet et réessaie.');
  if (lower.includes('jwt expired') || lower.includes('session expired')) return bilingual('Your session has expired. Please log in again.', 'Ta session a expiré. Reconnecte-toi.');
  if (lower.includes('password') && lower.includes('weak')) return bilingual('Password is too weak. Use at least 6 characters.', 'Mot de passe trop faible. Utilise au moins 6 caractères.');
  return raw || bilingual('Something went wrong. Please try again.', 'Un problème est survenu. Réessaie.');
};

type AccountSyncStatus = 'local' | 'waiting' | 'syncing' | 'synced' | 'failed';

type AccountContextValue = {
  isConfigured: boolean;
  backendUrl: string;
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: AccountSyncStatus;
  session: AccountSession | null;
  accountAvatarId: AccountAvatarId;
  accountAvatarColorId: AccountAvatarColorId;
  error: string;
  lastSyncAt: Date | null;
  signIn: (username: string, password: string) => Promise<void>;
  createAccount: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetSavedProgress: () => Promise<void>;
  syncNow: () => Promise<void>;
  updateAccountDisplayName: (displayName: string) => Promise<void>;
  updateAccountAvatar: (avatarId: AccountAvatarId) => Promise<void>;
  updateAccountAvatarColor: (colorId: AccountAvatarColorId) => Promise<void>;
  clearError: () => void;
};

const AccountContext = createContext<AccountContextValue>({
  isConfigured: false,
  backendUrl: '',
  isLoading: true,
  isSyncing: false,
  syncStatus: 'local',
  session: null,
  accountAvatarId: DEFAULT_ACCOUNT_AVATAR_ID,
  accountAvatarColorId: DEFAULT_ACCOUNT_AVATAR_COLOR_ID,
  error: '',
  lastSyncAt: null,
  signIn: async () => {},
  createAccount: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
  resetSavedProgress: async () => {},
  syncNow: async () => {},
  updateAccountDisplayName: async () => {},
  updateAccountAvatar: async () => {},
  updateAccountAvatarColor: async () => {},
  clearError: () => {},
});

const getGuestProgressSnapshot = async (): Promise<LocalStudentProgressSnapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(GUEST_PROGRESS_SNAPSHOT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
      return null;
    }

    return {
      entries: parsed.entries.filter(
        (entry: unknown): entry is [string, string] =>
          Array.isArray(entry) &&
          entry.length === 2 &&
          typeof entry[0] === 'string' &&
          typeof entry[1] === 'string'
      ),
    };
  } catch {
    return null;
  }
};

const saveGuestProgressSnapshot = async () => {
  try {
    const snapshot = await getLocalStudentProgressSnapshot();
    await AsyncStorage.setItem(GUEST_PROGRESS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {}
};

const clearGuestProgressSnapshot = async () => {
  try {
    await AsyncStorage.removeItem(GUEST_PROGRESS_SNAPSHOT_KEY);
  } catch {}
};

const AccountProviderInner = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<AccountSyncStatus>('local');
  const [error, setError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [accountAvatarId, setAccountAvatarId] = useState<AccountAvatarId>(DEFAULT_ACCOUNT_AVATAR_ID);
  const [accountAvatarColorId, setAccountAvatarColorId] = useState<AccountAvatarColorId>(
    DEFAULT_ACCOUNT_AVATAR_COLOR_ID
  );
  const { applyAccountPreferences, updateShinyEllieProgress } = useTheme();
  const isConfigured = isAccountBackendConfigured();
  const backendUrl = getAccountBackendUrl();

  const mergeSessionWithLocalXP = useCallback(async (nextSession: AccountSession) => {
    const cloudXP = nextSession.user.xp;
    let syncedSession = nextSession;
    let cloudProgressItems: CloudProgressItem[] = [];
    let progressSyncFailed = false;
    const localProgressOwner = await getLocalProgressOwner();
    const canMergeLocalProgress = localProgressOwner === nextSession.user.id;

    try {
      cloudProgressItems = await fetchCloudProgressItems();
    } catch {
      progressSyncFailed = true;
    }

    let mergedProgress: Awaited<ReturnType<typeof mergeCloudStudentProgressItems>>;

    if (canMergeLocalProgress) {
      const localXP = await getXP();
      const mergedXP = Math.max(localXP, cloudXP);

      if (mergedXP !== localXP) {
        await replaceLocalStudentXP(mergedXP);
      }

      if (mergedXP !== cloudXP) {
        syncedSession = await updateSupabaseXP(nextSession, mergedXP);
      }

      mergedProgress = await mergeCloudStudentProgressItems(cloudProgressItems);

      try {
        const localProgressItems = await getLocalStudentProgressCloudItems();
        await upsertCloudProgressItems(localProgressItems);
      } catch {
        progressSyncFailed = true;
      }
    } else {
      mergedProgress = await replaceLocalStudentProgressFromCloud(cloudXP, cloudProgressItems);
    }

    let preferredShinyEllieMode: boolean | null = null;
    let preferredShinyEllieColorVariant: 'cool' | 'warm' | null = null;

    try {
      const cloudPreferences = findAccountPreferenceSnapshot(cloudProgressItems);
      if (cloudPreferences) {
        preferredShinyEllieMode = cloudPreferences.shinyEllieMode;
        preferredShinyEllieColorVariant = cloudPreferences.shinyEllieColorVariant;
        await saveLocalAccountPreferenceSnapshot(cloudPreferences, nextSession.user.id);
        applyAccountPreferences(cloudPreferences);
        setAccountAvatarId(cloudPreferences.accountAvatarId);
        setAccountAvatarColorId(cloudPreferences.accountAvatarColorId);
      } else {
        await upsertCloudProgressItems(await getAccountPreferencesCloudItems(nextSession.user.id));
      }
    } catch {
      progressSyncFailed = true;
    }

    updateShinyEllieProgress(
      mergedProgress.shinyEllie.unlocked,
      mergedProgress.shinyEllie.unlocked
        ? preferredShinyEllieMode ?? mergedProgress.shinyEllie.mode
        : false,
      mergedProgress.shinyEllie.unlocked
        ? preferredShinyEllieColorVariant ?? mergedProgress.shinyEllie.colorVariant
        : 'cool',
      mergedProgress.shinyEllie.unlocked
        ? mergedProgress.shinyEllie.presentationMode
        : false
    );

    await setLocalProgressOwner(nextSession.user.id);
    setSession(syncedSession);
    setLastSyncAt(new Date());
    setSyncStatus(progressSyncFailed ? 'failed' : 'synced');

    if (progressSyncFailed) {
      setError(bilingual('Some work could not be saved online. Tap Retry.', 'Une partie de ton travail n’a pas pu être sauvegardée en ligne. Appuie sur « Retry ».'));
    }
  }, [applyAccountPreferences, updateShinyEllieProgress]);

  const runWithSyncState = useCallback(async (task: () => Promise<void>) => {
    setError('');
    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      await task();
    } catch (nextError) {
      setError(friendlyErrorMessage(nextError));
      setSyncStatus('failed');
      throw nextError;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!isConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const savedSession = await loadAccountSession();

        if (!active) return;

        if (!savedSession) {
          setSession(null);
          setSyncStatus('local');
          return;
        }



        setSession(savedSession);
        setSyncStatus('waiting');
        setIsLoading(false);

        try {
          const refreshedSession = await refreshSupabaseUser();

          if (!active) return;

          await mergeSessionWithLocalXP(refreshedSession);
        } catch {
          if (!active) return;
          setSyncStatus('failed');
        }
      } catch {
        if (!active) return;
        await clearAccountSession();
        setSession(null);
        setSyncStatus('failed');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [isConfigured, mergeSessionWithLocalXP]);

  useEffect(() => {
    let active = true;

    Promise.all([
      loadAccountAvatarId(session?.user.id),
      loadAccountAvatarColorId(session?.user.id),
    ]).then(([avatarId, colorId]) => {
      if (!active) return;

      setAccountAvatarId(avatarId);
      setAccountAvatarColorId(colorId);
    });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      await runWithSyncState(async () => {
        if (!session) {
          await saveGuestProgressSnapshot();
        }

        const nextSession = await signInWithSupabase(username, password);
        await mergeSessionWithLocalXP(nextSession);
      });
    },
    [mergeSessionWithLocalXP, runWithSyncState, session]
  );

  const createAccount = useCallback(
    async (username: string, password: string) => {
      await runWithSyncState(async () => {
        if (!session) {
          await saveGuestProgressSnapshot();
        }

        const nextSession = await createSupabaseAccount(username, password, 0);
        await mergeSessionWithLocalXP(nextSession);
      });
    },
    [mergeSessionWithLocalXP, runWithSyncState, session]
  );

  const syncNow = useCallback(async () => {
    if (!session) return;

    await runWithSyncState(async () => {
        const refreshedSession = await refreshSupabaseUser();
        await mergeSessionWithLocalXP(refreshedSession);
        const localProgressItems = await getLocalStudentProgressCloudItems();
        await upsertCloudProgressItems(localProgressItems);
        await syncAccountPreferencesToCloudIfSignedIn();
        setLastSyncAt(new Date());
        setError('');
        setSyncStatus('synced');
      });
  }, [mergeSessionWithLocalXP, runWithSyncState, session]);

  const preferenceSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Students tap through several avatars and colours in a row, and each tap used to start
  // its own upload, so an early pick could land online after a later one. Waiting until
  // they stop sends one upload with the final choice. Nothing is lost if the app closes
  // inside the wait: going to the background runs autoSyncQuietly, which uploads
  // preferences too.
  const syncPreferencesQuietly = useCallback(() => {
    if (!session) return;

    if (preferenceSyncTimerRef.current) clearTimeout(preferenceSyncTimerRef.current);
    preferenceSyncTimerRef.current = setTimeout(() => {
      preferenceSyncTimerRef.current = null;
      syncAccountPreferencesToCloudIfSignedIn()
        .then(() => {
          setLastSyncAt(new Date());
          setSyncStatus('synced');
          setError('');
        })
        .catch(() => {
          setSyncStatus('failed');
          setError(bilingual('Profile changes are saved on this device. Tap Retry to save them online.', 'Tes changements de profil sont enregistrés sur cet appareil. Appuie sur « Retry » pour les sauvegarder en ligne.'));
        });
    }, PREFERENCE_SYNC_DELAY_MS);
  }, [session]);

  const sessionUserId = session?.user.id;
  useEffect(() => () => {
    // A pending upload belongs to the account that scheduled it; drop it on sign-out or switch.
    if (preferenceSyncTimerRef.current) {
      clearTimeout(preferenceSyncTimerRef.current);
      preferenceSyncTimerRef.current = null;
    }
  }, [sessionUserId]);

  const autoSyncInFlightRef = useRef(false);

  const autoSyncQuietly = useCallback(async () => {
    if (!session || autoSyncInFlightRef.current) return;

    autoSyncInFlightRef.current = true;

    try {
      const localProgressItems = await getLocalStudentProgressCloudItems();
      await upsertCloudProgressItems(localProgressItems);
      await syncAccountPreferencesToCloudIfSignedIn();
      setLastSyncAt(new Date());
      setError('');
      setSyncStatus('synced');
    } catch {
      setSyncStatus('failed');
    } finally {
      autoSyncInFlightRef.current = false;
    }
  }, [session]);


  useEffect(() => {
    if (!session) return;

    const intervalId = setInterval(() => {
      void autoSyncQuietly();
    }, 90000);

    return () => clearInterval(intervalId);
  }, [session, autoSyncQuietly]);


  useEffect(() => {
    if (!session) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        void autoSyncQuietly();
      }
    });

    return () => subscription.remove();
  }, [session, autoSyncQuietly]);

  const signOut = useCallback(async () => {
    setError('');
    setIsSyncing(true);

    try {
      const guestSnapshot = await getGuestProgressSnapshot();
      await restoreLocalStudentProgressSnapshot(guestSnapshot);
      const restoredShinyEllie = await getShinyEllieProgress();
      updateShinyEllieProgress(
        restoredShinyEllie.unlocked,
        restoredShinyEllie.mode,
        restoredShinyEllie.colorVariant,
        restoredShinyEllie.presentationMode
      );
      await clearLocalProgressOwner();
      await clearAccountSession();
      setSession(null);
      setLastSyncAt(null);
      setSyncStatus('local');
    } catch (nextError) {
      setError(friendlyErrorMessage(nextError));
      setSyncStatus('failed');
      throw nextError;
    } finally {
      setIsSyncing(false);
    }
  }, [updateShinyEllieProgress]);

  const resetSavedProgress = useCallback(async () => {
    await runWithSyncState(async () => {
      await clearLocalStudentProgress();
      updateShinyEllieProgress(false, false, 'cool', false);

      if (session) {
        await clearCloudProgressItems();
        const resetSession = await updateSupabaseXP(session, 0);
        await upsertCloudProgressItems(await getAccountPreferencesCloudItems(session.user.id));
        setSession(resetSession);
        await setLocalProgressOwner(session.user.id);
        setLastSyncAt(new Date());
        setSyncStatus('synced');
        return;
      }

      await clearLocalProgressOwner();
      await clearGuestProgressSnapshot();
      setLastSyncAt(null);
      setSyncStatus('local');
    });
  }, [runWithSyncState, session, updateShinyEllieProgress]);

  const deleteAccount = useCallback(async () => {
    if (!session) return;

    await runWithSyncState(async () => {
      await deleteSupabaseAccount();
      await clearLocalProgressOwner();
      setSession(null);
      setLastSyncAt(null);
      setSyncStatus('local');
    });
  }, [runWithSyncState, session]);

  const updateAccountAvatar = useCallback(async (avatarId: AccountAvatarId) => {
    setAccountAvatarId(avatarId);
    await saveAccountAvatarId(session?.user.id, avatarId);
    syncPreferencesQuietly();
  }, [session?.user.id, syncPreferencesQuietly]);

  const updateAccountAvatarColor = useCallback(async (colorId: AccountAvatarColorId) => {
    setAccountAvatarColorId(colorId);
    await saveAccountAvatarColorId(session?.user.id, colorId);
    syncPreferencesQuietly();
  }, [session?.user.id, syncPreferencesQuietly]);

  const updateAccountDisplayName = useCallback(async (displayName: string) => {
    if (!session) return;

    await runWithSyncState(async () => {
      const updatedSession = await updateSupabaseDisplayName(session, displayName);
      setSession(updatedSession);
      setLastSyncAt(new Date());
      setSyncStatus('synced');
    });
  }, [runWithSyncState, session]);

  const value = useMemo<AccountContextValue>(
    () => ({
      isConfigured,
      backendUrl,
      isLoading,
      isSyncing,
      syncStatus,
      session,
      accountAvatarId,
      accountAvatarColorId,
      error,
      lastSyncAt,
      signIn,
      createAccount,
      signOut,
      deleteAccount,
      resetSavedProgress,
      syncNow,
      updateAccountDisplayName,
      updateAccountAvatar,
      updateAccountAvatarColor,
      clearError: () => setError(''),
    }),
    [
      accountAvatarColorId,
      accountAvatarId,
      backendUrl,
      createAccount,
      deleteAccount,
      error,
      isConfigured,
      isLoading,
      isSyncing,
      syncStatus,
      lastSyncAt,
      session,
      signIn,
      signOut,
      resetSavedProgress,
      syncNow,
      updateAccountDisplayName,
      updateAccountAvatar,
      updateAccountAvatarColor,
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const AccountProvider = ({ children }: { children: React.ReactNode }) => (
  <AccountProviderInner>{children}</AccountProviderInner>
);

export const useAccount = () => useContext(AccountContext);
