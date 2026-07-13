const DEFAULT_BASE_RETRY_DELAY_MS = 2000;
const DEFAULT_MAX_RETRY_DELAY_MS = 30000;

export interface PendingMutationSyncState {
  readonly retryCount: number;
  readonly nextRetryAt: string | null;
  readonly lastAttemptAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly lastFailureAt: string | null;
  readonly lastErrorMessage: string;
}

export function createInitialPendingMutationSyncState(): PendingMutationSyncState {
  return {
    retryCount: 0,
    nextRetryAt: null,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastErrorMessage: ''
  };
}

export function computeRetryDelayMs(
  retryCount: number,
  baseDelayMs: number = DEFAULT_BASE_RETRY_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_RETRY_DELAY_MS
): number {
  const normalizedRetryCount = Math.max(0, retryCount);
  const delayMs = baseDelayMs * 2 ** Math.max(0, normalizedRetryCount - 1);
  return Math.min(delayMs, maxDelayMs);
}

export function formatRetryDelayLabel(delayMs: number): string {
  if (delayMs <= 0) {
    return 'maintenant';
  }

  const seconds = Math.max(1, Math.ceil(delayMs / 1000));
  return seconds === 1 ? '1 seconde' : `${seconds} secondes`;
}

export function buildPendingMutationSyncMessage(
  resourceLabel: string,
  pendingCount: number,
  state: PendingMutationSyncState,
  nowMs: number = Date.now()
): string {
  if (pendingCount === 0) {
    return '';
  }

  if (state.nextRetryAt) {
    const retryDelayMs = Math.max(0, new Date(state.nextRetryAt).getTime() - nowMs);
    const retryLabel = formatRetryDelayLabel(retryDelayMs);

    return `Synchronisation ${resourceLabel} en attente: nouvelle tentative dans ${retryLabel}.`;
  }

  if (state.lastErrorMessage.length > 0) {
    return `Synchronisation ${resourceLabel} en attente: ${state.lastErrorMessage}`;
  }

  return `Synchronisation ${resourceLabel} en attente.`;
}

export function recordPendingMutationSyncSuccess(
  state: PendingMutationSyncState,
  nowIso: string = new Date().toISOString()
): PendingMutationSyncState {
  return {
    ...state,
    retryCount: 0,
    nextRetryAt: null,
    lastAttemptAt: nowIso,
    lastSuccessAt: nowIso,
    lastErrorMessage: ''
  };
}

export function recordPendingMutationSyncFailure(
  state: PendingMutationSyncState,
  lastErrorMessage: string,
  retryable: boolean,
  nowIso: string = new Date().toISOString()
): PendingMutationSyncState {
  if (!retryable) {
    return {
      ...state,
      retryCount: 0,
      nextRetryAt: null,
      lastAttemptAt: nowIso,
      lastFailureAt: nowIso,
      lastErrorMessage
    };
  }

  const nextRetryCount = state.retryCount + 1;

  return {
    ...state,
    retryCount: nextRetryCount,
    nextRetryAt: new Date(nowIso).getTime() + computeRetryDelayMs(nextRetryCount) > 0
      ? new Date(new Date(nowIso).getTime() + computeRetryDelayMs(nextRetryCount)).toISOString()
      : null,
    lastAttemptAt: nowIso,
    lastFailureAt: nowIso,
    lastErrorMessage
  };
}