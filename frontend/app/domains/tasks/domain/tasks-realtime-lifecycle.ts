export type TasksRealtimeStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface TasksRealtimeLifecycleHandlers {
  readonly onConnecting: () => void;
  readonly onConnected: () => void;
  readonly onReconnecting: () => void;
  readonly onDisconnected: () => void;
  readonly onError: () => void;
}
