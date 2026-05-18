import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccountSession,
  clearAccountSession,
  clearCloudProgressItems,
  createSupabaseAccount,
  deleteSupabaseAccount,
  fetchCloudProgressItems,
  getAccountBackendUrl,
  isAccountBackendConfigured,
  loadAccountSession,
  refreshSupabaseUser,
  signInWithSupabase,
  updateSupabaseXP,
  upsertCloudProgressItems,
  type CloudProgressItem,
} from '../utils/accountStorage';
import {
  clearLocalStudentProgress,
  getLocalStudentProgressCloudItems,
  getLocalStudentProgressSnapshot,
  mergeCloudStudentProgressItems,
  replaceLocalStudentXP,
  restoreLocalStudentProgressSnapshot,
  type LocalStudentProgressSnapshot,
} from '../utils/studentProgressStorage';
import { getShinyEllieProgress } from '../utils/shinyEllieStorage';
import { getXP } from '../utils/xpStorage';
import { useTheme } from './ThemeContext';

const ACCOUNT_PROGRESS_OWNER_KEY = '@ellie_account_progress_owner';
const GUEST_PROGRESS_SNAPSHOT_KEY = '@ellie_guest_progress_snapshot';

type AccountSyncStatus = 'local' | 'waiting' | 'syncing' | 'synced' | 'failed';

type AccountContextValue = {
  isConfigured: boolean;
  backendUrl: string;
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: AccountSyncStatus;
  session: AccountSession | null;
  error: string;
  lastSyncAt: Date | null;
  signIn: (username: string, password: string) => Promise<void>;
  createAccount: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetSavedProgress: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearError: () => void;
};

const AccountContext = createContext<AccountContextValue>({
  isConfigured: false,
  backendUrl: '',
  isLoading: true,
  isSyncing: false,
  syncStatus: 'local',
  session: null,
  error: '',
  lastSyncAt: null,
  signIn: async () => {},
  createAccount: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
  resetSavedProgress: async () => {},
  syncNow: async () => {},
  clearError: () => {},
});

const setLocalProgressOwner = async (accountId: string) => {
  try {
    await AsyncStorage.setItem(ACCOUNT_PROGRESS_OWNER_KEY, accountId);
  } catch {}
};

const clearLocalProgressOwner = async () => {
  try {
    await AsyncStorage.removeItem(ACCOUNT_PROGRESS_OWNER_KEY);
  } catch {}
};

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
  const { updateShinyEllieProgress } = useTheme();
  const isConfigured = isAccountBackendConfigured();
  const backendUrl = getAccountBackendUrl();

  const mergeSessionWithLocalXP = useCallback(async (nextSession: AccountSession) => {
    const cloudXP = nextSession.user.xp;
    let syncedSession = nextSession;
    let cloudProgressItems: CloudProgressItem[] = [];
    let progressSyncFailed = false;

    try {
      cloudProgressItems = await fetchCloudProgressItems();
    } catch {
      progressSyncFailed = true;
    }

    const localXP = await getXP();
    const mergedXP = Math.max(localXP, cloudXP);

    if (mergedXP !== localXP) {
      await replaceLocalStudentXP(mergedXP);
    }

    if (mergedXP !== cloudXP) {
      syncedSession = await updateSupabaseXP(nextSession, mergedXP);
    }

    const mergedProgress = await mergeCloudStudentProgressItems(cloudProgressItems);

    try {
      const localProgressItems = await getLocalStudentProgressCloudItems();
      await upsertCloudProgressItems(localProgressItems);
    } catch {
      progressSyncFailed = true;
    }

    updateShinyEllieProgress(mergedProgress.shinyEllie.unlocked, mergedProgress.shinyEllie.mode);

    await setLocalProgressOwner(nextSession.user.id);
    setSession(syncedSession);
    setLastSyncAt(new Date());
    setSyncStatus(progressSyncFailed ? 'failed' : 'synced');

    if (progressSyncFailed) {
      setError('Some work could not be saved online. Tap Try again.');
    }
  }, [updateShinyEllieProgress]);

  const runWithSyncState = useCallback(async (task: () => Promise<void>) => {
    setError('');
    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      await task();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Account action failed.';
      setError(message);
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

        const refreshedSession = await refreshSupabaseUser();

        if (!active) return;

        await mergeSessionWithLocalXP(refreshedSession);
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

        const initialXP = await getXP();
        const nextSession = await createSupabaseAccount(username, password, initialXP);
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
        setLastSyncAt(new Date());
        setError('');
        setSyncStatus('synced');
      });
  }, [mergeSessionWithLocalXP, runWithSyncState, session]);

  const signOut = useCallback(async () => {
    setError('');
    setIsSyncing(true);

    try {
      const guestSnapshot = await getGuestProgressSnapshot();
      await restoreLocalStudentProgressSnapshot(guestSnapshot);
      const restoredShinyEllie = await getShinyEllieProgress();
      updateShinyEllieProgress(restoredShinyEllie.unlocked, restoredShinyEllie.mode);
      await clearLocalProgressOwner();
      await clearAccountSession();
      setSession(null);
      setLastSyncAt(null);
      setSyncStatus('local');
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Sign out failed.';
      setError(message);
      setSyncStatus('failed');
      throw nextError;
    } finally {
      setIsSyncing(false);
    }
  }, [updateShinyEllieProgress]);

  const resetSavedProgress = useCallback(async () => {
    await runWithSyncState(async () => {
      await clearLocalStudentProgress();
      updateShinyEllieProgress(false, false);

      if (session) {
        await clearCloudProgressItems();
        const resetSession = await updateSupabaseXP(session, 0);
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

  const value = useMemo<AccountContextValue>(
    () => ({
      isConfigured,
      backendUrl,
      isLoading,
      isSyncing,
      syncStatus,
      session,
      error,
      lastSyncAt,
      signIn,
      createAccount,
      signOut,
      deleteAccount,
      resetSavedProgress,
      syncNow,
      clearError: () => setError(''),
    }),
    [
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
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const AccountProvider = ({ children }: { children: React.ReactNode }) => (
  <AccountProviderInner>{children}</AccountProviderInner>
);

export const useAccount = () => useContext(AccountContext);
