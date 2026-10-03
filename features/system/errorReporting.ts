import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { supabaseAnonKey, supabaseUrl } from '../../lib/config';

// APKs are handed out by hand, so a crash used to reach the teacher only if a student
// mentioned it. Reports go to the app_error_reports table (see the migration of the same
// name). They carry no account, username or device id: just what broke and which build.

export type ErrorReportSource = 'screen' | 'app' | 'fatal';

const REPORT_TABLE = 'app_error_reports';
// A crash loop on one phone shouldn't flood the table.
const MAX_REPORTS_PER_SESSION = 5;
// How long a fatal error waits for its report before the app is allowed to close.
const FATAL_REPORT_WAIT_MS = 1500;

let reportsThisSession = 0;

const clip = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length > 0 ? value.slice(0, maxLength) : null;

const getUpdateId = () => {
  try {
    return Updates.updateId ?? null;
  } catch {
    return null;
  }
};

export const reportAppError = async (
  error: unknown,
  details: { source: ErrorReportSource; componentStack?: string | null }
) => {
  // Development builds show the red error screen already.
  if (__DEV__) return;
  if (!supabaseUrl || !supabaseAnonKey) return;
  if (reportsThisSession >= MAX_REPORTS_PER_SESSION) return;
  reportsThisSession += 1;

  const normalized = error instanceof Error ? error : new Error(String(error));

  try {
    await fetch(`${supabaseUrl}/rest/v1/${REPORT_TABLE}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        source: details.source,
        message: clip(`${normalized.name}: ${normalized.message}`, 500) ?? 'Unknown error',
        stack: clip(normalized.stack, 4000),
        component_stack: clip(details.componentStack, 4000),
        platform: Platform.OS,
        app_version: clip(Constants.expoConfig?.version, 40),
        update_id: clip(getUpdateId(), 64),
      }),
    });
  } catch {}
};

let isGlobalReporterInstalled = false;

/**
 * Reports errors that escape React entirely (timers, promise callbacks, native events).
 * For fatal ones the default handler closes the app, so it waits briefly for the report.
 */
export const installGlobalErrorReporter = () => {
  const errorUtils = (globalThis as any).ErrorUtils;
  if (isGlobalReporterInstalled || !errorUtils?.getGlobalHandler || !errorUtils?.setGlobalHandler) return;
  isGlobalReporterInstalled = true;

  const previousHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const report = reportAppError(error, { source: isFatal ? 'fatal' : 'app' });

    if (!isFatal) {
      previousHandler?.(error, isFatal);
      return;
    }

    const wait = new Promise((resolve) => setTimeout(resolve, FATAL_REPORT_WAIT_MS));
    void Promise.race([report, wait]).finally(() => previousHandler?.(error, isFatal));
  });
};
