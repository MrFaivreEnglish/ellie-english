jest.mock('../lib/config', () => ({
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'public-anon-key',
}));

const fetchMock = jest.fn(() => Promise.resolve({ ok: true }));

describe('reportAppError', () => {
  const originalDev = (globalThis as any).__DEV__;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockClear();
    (globalThis as any).__DEV__ = false;
    globalThis.fetch = fetchMock as any;
  });

  afterAll(() => {
    (globalThis as any).__DEV__ = originalDev;
    globalThis.fetch = originalFetch;
  });

  const load = () => require('../features/system/errorReporting') as typeof import('../features/system/errorReporting');

  it('sends what broke and which build, and nothing about the student', async () => {
    const { reportAppError } = load();
    const error = new TypeError('x is undefined');
    error.stack = 'TypeError: x is undefined\n' + 'at frame\n'.repeat(1000);

    await reportAppError(error, { source: 'screen', componentStack: 'in LessonsScreen' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://example.supabase.co/rest/v1/app_error_reports');
    const body = JSON.parse(String(init.body));
    expect(Object.keys(body).sort()).toEqual(
      ['app_version', 'component_stack', 'message', 'platform', 'source', 'stack', 'update_id'].sort()
    );
    expect(body.message).toBe('TypeError: x is undefined');
    expect(body.stack.length).toBe(4000);
    expect(body.component_stack).toBe('in LessonsScreen');
  });

  it('stops after a few reports so a crash loop cannot flood the table', async () => {
    const { reportAppError } = load();

    for (let i = 0; i < 8; i += 1) {
      await reportAppError(new Error(`boom ${i}`), { source: 'app' });
    }

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('stays quiet in development builds and when the network fails', async () => {
    (globalThis as any).__DEV__ = true;
    const { reportAppError } = load();
    await reportAppError(new Error('dev only'), { source: 'screen' });
    expect(fetchMock).not.toHaveBeenCalled();

    (globalThis as any).__DEV__ = false;
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    await expect(reportAppError(new Error('offline'), { source: 'screen' })).resolves.toBeUndefined();
  });
});
