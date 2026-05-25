// lib/apiFetch.ts

export class LimitExceededError extends Error {
  used: number;
  dailyLimit: number;
  constructor(used: number, dailyLimit: number) {
    super(`Лимит генераций исчерпан (${used}/${dailyLimit})`);
    this.name = 'LimitExceededError';
    this.used = used;
    this.dailyLimit = dailyLimit;
  }
}

export class GlobalLimitExceededError extends Error {
  globalUsed: number;
  globalLimit: number;
  constructor(globalUsed: number, globalLimit: number) {
    super(`Глобальный лимит сервиса исчерпан (${globalUsed}/${globalLimit})`);
    this.name = 'GlobalLimitExceededError';
    this.globalUsed = globalUsed;
    this.globalLimit = globalLimit;
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super('AUTH_REQUIRED');
    this.name = 'AuthRequiredError';
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  userId?: string
): Promise<Response> {

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 180_000);

  const callerSignal = options.signal as AbortSignal | undefined;
  let signal = timeoutController.signal;
  if (callerSignal) {
    const combined = new AbortController();
    callerSignal.addEventListener('abort', () => combined.abort(), { once: true });
    timeoutController.signal.addEventListener('abort', () => combined.abort(), { once: true });
    signal = combined.signal;
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      if (callerSignal?.aborted) throw err;
      throw new Error('Превышено время ожидания. Попробуйте ещё раз.');
    }
    throw new Error('Нет соединения с сервером. Проверьте подключение к интернету.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    throw new AuthRequiredError();
  }

  if (response.status === 429) {
    let body: {
      code?: string;
      used?: number;
      dailyLimit?: number;
      globalUsed?: number;
      globalLimit?: number;
    } = {};
    try { body = await response.clone().json(); } catch { /* ignore */ }

    if (body.code === 'GLOBAL_LIMIT_EXCEEDED') {
      throw new GlobalLimitExceededError(body.globalUsed ?? 0, body.globalLimit ?? 1000);
    }

    throw new LimitExceededError(body.used ?? 0, body.dailyLimit ?? 20);
  }

  return response;
}