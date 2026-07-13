import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { TaskSummary } from '../domain/task-summary';
import type { TaskDeletedEvent } from '../domain/tasks-realtime-events';
import type { TasksRealtimeStatus } from '../domain/tasks-realtime-lifecycle';
import { SocketIoTasksRealtimeAdapter } from '../infrastructure/socketio-tasks-realtime.adapter';

interface UseTasksRealtimeDependencies {
  readonly realtimeAdapter?: {
    connect(accessToken: string): void;
    disconnect(): void;
    joinList(listId: string): void;
    leaveList(listId: string): void;
    onEvents(handlers: {
      onTaskCreated: (task: TaskSummary) => void;
      onTaskUpdated: (task: TaskSummary) => void;
      onTaskCompleted: (task: TaskSummary) => void;
      onTaskDeleted: (payload: TaskDeletedEvent) => void;
    }): void;
    onLifecycle(handlers: {
      onConnecting: () => void;
      onConnected: () => void;
      onReconnecting: () => void;
      onDisconnected: () => void;
      onError: () => void;
    }): void;
    removeAllListeners(): void;
  };
  readonly getAccessToken?: () => string;
  readonly onTaskUpsert: (task: TaskSummary) => void;
  readonly onTaskDeleted: (payload: TaskDeletedEvent) => void;
}

const REALTIME_CONNECTED_KEY = 'tasks-manager.tasks.realtime.connected';
const REALTIME_LIST_KEY = 'tasks-manager.tasks.realtime.list';
const REALTIME_BOUND_KEY = 'tasks-manager.tasks.realtime.bound';
const REALTIME_STATUS_KEY = 'tasks-manager.tasks.realtime.status';

const defaultAdapter = new SocketIoTasksRealtimeAdapter();

export function useTasksRealtime(deps: UseTasksRealtimeDependencies) {
  const authSession = useAuthSession();
  const getAccessToken = deps.getAccessToken ?? (() => authSession.accessToken.value);
  const realtimeAdapter = deps.realtimeAdapter ?? defaultAdapter;

  const isConnected = useState<boolean>(REALTIME_CONNECTED_KEY, () => false);
  const activeListId = useState<string>(REALTIME_LIST_KEY, () => '');
  const listenersBound = useState<boolean>(REALTIME_BOUND_KEY, () => false);
  const status = useState<TasksRealtimeStatus>(REALTIME_STATUS_KEY, () => 'idle');

  function ensureConnected(): boolean {
    const token = getAccessToken();
    if (token.length === 0) {
      return false;
    }

    if (!isConnected.value) {
      realtimeAdapter.connect(token);
      isConnected.value = true;
      status.value = 'connecting';
    }

    return true;
  }

  function bindListeners(): void {
    if (listenersBound.value) {
      return;
    }

    realtimeAdapter.onEvents({
      onTaskCreated: (task) => deps.onTaskUpsert(task),
      onTaskUpdated: (task) => deps.onTaskUpsert(task),
      onTaskCompleted: (task) => deps.onTaskUpsert(task),
      onTaskDeleted: (payload) => deps.onTaskDeleted(payload)
    });

    realtimeAdapter.onLifecycle({
      onConnecting: () => {
        status.value = 'connecting';
      },
      onConnected: () => {
        status.value = 'connected';
        if (activeListId.value.length > 0) {
          realtimeAdapter.joinList(activeListId.value);
        }
      },
      onReconnecting: () => {
        status.value = 'reconnecting';
      },
      onDisconnected: () => {
        status.value = 'disconnected';
      },
      onError: () => {
        status.value = 'error';
      }
    });

    listenersBound.value = true;
  }

  function subscribeToList(listId: string): void {
    if (!ensureConnected()) {
      return;
    }

    bindListeners();

    if (activeListId.value.length > 0 && activeListId.value !== listId) {
      realtimeAdapter.leaveList(activeListId.value);
    }

    activeListId.value = listId;
    realtimeAdapter.joinList(listId);
  }

  function stop(): void {
    if (activeListId.value.length > 0) {
      realtimeAdapter.leaveList(activeListId.value);
    }

    realtimeAdapter.removeAllListeners();
    realtimeAdapter.disconnect();
    activeListId.value = '';
    isConnected.value = false;
    listenersBound.value = false;
    status.value = 'idle';
  }

  return {
    isConnected: computed(() => isConnected.value),
    status: computed(() => status.value),
    activeListId: computed(() => activeListId.value),
    subscribeToList,
    stop
  };
}
