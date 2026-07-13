export interface TasksRealtimeObservability {
  readonly reconnectAttempts: number;
  readonly lastConnectedAt: string | null;
  readonly lastDisconnectedAt: string | null;
  readonly lastErrorAt: string | null;
}
