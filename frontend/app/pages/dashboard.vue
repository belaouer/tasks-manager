<template>
  <section
    class="grid animate-rise gap-4"
    :class="selectedTask
      ? 'xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)_minmax(280px,360px)]'
      : 'xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]'"
  >
    <ListsSidebarPanel
      :is-dark-mode="isDarkMode"
      :is-online="isOnline"
      :is-left-sidebar-collapsed="isLeftSidebarCollapsed"
      :list-name="listName"
      :lists="lists"
      :lists-loading="listsLoading"
      :lists-error="listsError"
      :lists-sync-status-message="listsSyncStatusMessage"
      :network-badge-class="networkBadgeClass"
      :network-status-label="networkStatusLabel"
      :input-class="inputClass"
      :primary-button-class="primaryButtonClass"
      :disabled-button-class="disabledButtonClass"
      :error-class="errorClass"
      :muted-class="mutedClass"
      :is-selected-list="isSelectedList"
      :format-date="formatDate"
      @toggle-left-sidebar="toggleLeftSidebar"
      @update-list-name="listName = $event"
      @create-list="handleCreateList"
      @select-list="selectList"
      @request-delete-list="requestDeleteList($event.id, $event.label)"
    />

    <TasksPanel
      :is-dark-mode="isDarkMode"
      :is-online="isOnline"
      :selected-list-id="selectedListId"
      :selected-task-id="selectedTaskId"
      :task-form="taskForm"
      :tasks-loading="tasksLoading"
      :tasks-error="tasksError"
      :tasks-sync-status-message="tasksSyncStatusMessage"
      :realtime-status-label="realtimeStatusLabel"
      :realtime-badge-class="realtimeBadgeClass"
      :realtime-metrics="realtimeMetrics"
      :input-class="inputClass"
      :primary-button-class="primaryButtonClass"
      :error-class="errorClass"
      :muted-class="mutedClass"
      :active-tasks="activeTasks"
      :completed-tasks="completedTasks"
      :is-completed-tasks-collapsed="isCompletedTasksCollapsed"
      :is-task-completed="isTaskCompleted"
      :format-date="formatDate"
      @update-task-form="taskForm = $event"
      @create-task="handleCreateTask"
      @open-task-details="openTaskDetails"
      @complete-task="handleCompleteTask"
      @reopen-task="handleReopenTask"
      @request-delete-task="requestDeleteTask($event.id, $event.label)"
      @toggle-completed-tasks-section="toggleCompletedTasksSection"
    />

    <TaskDetailPanel
      v-if="selectedTask"
      :is-dark-mode="isDarkMode"
      :is-online="isOnline"
      :muted-class="mutedClass"
      :task="selectedTask"
      :is-task-completed="isTaskCompleted"
      :format-date="formatDate"
      :format-realtime-date="formatRealtimeDate"
      @request-delete-task="requestDeleteTask($event.id, $event.label)"
    />

    <DeleteConfirmationModal
      :is-dark-mode="isDarkMode"
      :is-online="isOnline"
      :muted-class="mutedClass"
      :confirmation="deleteConfirmation"
      @cancel="closeDeleteConfirmation"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import DeleteConfirmationModal from '~/components/shared/delete-confirmation-modal.vue';
import ListsSidebarPanel from '~/components/domains/lists/lists-sidebar-panel.vue';
import TaskDetailPanel from '~/components/domains/tasks/task-detail-panel.vue';
import TasksPanel from '~/components/domains/tasks/tasks-panel.vue';
import { useNetworkStatus } from '~/domains/connectivity/application/use-network-status';
import { useLists } from '~/domains/lists/application/use-lists';
import { useTasks } from '~/domains/tasks/application/use-tasks';
import { useTasksRealtime } from '~/domains/tasks/application/use-tasks-realtime';
import { isTaskCompleted } from '~/domains/tasks/domain/task-summary';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

definePageMeta({
  middleware: ['authenticated']
});

const { isDarkMode } = useThemeMode();
const { isOnline, startTracking: startNetworkTracking, stopTracking: stopNetworkTracking } = useNetworkStatus();
const {
  lists,
  isLoading: listsLoading,
  errorMessage: listsError,
  syncStatusMessage: listsSyncStatusMessage,
  loadLists,
  createList,
  deleteList,
  flushPendingMutations: flushPendingListMutations
} = useLists();
const {
  isLoading: tasksLoading,
  errorMessage: tasksError,
  syncStatusMessage: tasksSyncStatusMessage,
  pendingSyncCount,
  getTasksForList,
  loadTasks,
  flushPendingMutations,
  createTask,
  completeTask,
  reopenTask,
  deleteTask,
  upsertTaskFromRealtime,
  deleteTaskFromRealtime
} = useTasks();
const {
  subscribeToList,
  stop: stopRealtime,
  status: realtimeStatus,
  observability: realtimeObservability
} = useTasksRealtime({
  onTaskUpsert: (task) => upsertTaskFromRealtime(task),
  onTaskDeleted: (payload) => deleteTaskFromRealtime(payload)
});

const listName = ref('');
const selectedListId = ref('');
const selectedTaskId = ref('');
const isLeftSidebarCollapsed = ref(false);
const isCompletedTasksCollapsed = ref(true);
const deleteConfirmation = ref<{
  kind: 'list' | 'task';
  id: string;
  label: string;
} | null>(null);
const taskForm = ref({
  shortDescription: '',
  longDescription: '',
  dueDate: ''
});

const inputClass = computed(() =>
  isDarkMode.value
    ? 'border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-400'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
);

const mutedClass = computed(() =>
  isDarkMode.value ? 'text-slate-300' : 'text-slate-600'
);

const errorClass = computed(() =>
  isDarkMode.value
    ? 'border-rose-400/40 bg-rose-900/20 text-rose-100'
    : 'border-rose-300 bg-rose-50 text-rose-700'
);

const primaryButtonClass = computed(() =>
  isDarkMode.value
    ? 'bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-300/40 hover:bg-cyan-400/30'
    : 'bg-slate-900 text-slate-100 hover:bg-slate-800'
);

const disabledButtonClass = computed(() =>
  isDarkMode.value
    ? 'cursor-not-allowed opacity-45'
    : 'cursor-not-allowed opacity-60'
);

const networkStatusLabel = computed(() => (isOnline.value ? 'en ligne' : 'hors ligne'));

const networkBadgeClass = computed(() => {
  if (isOnline.value) {
    return isDarkMode.value
      ? 'border-emerald-300/50 bg-emerald-900/20 text-emerald-100'
      : 'border-emerald-400 bg-emerald-50 text-emerald-700';
  }

  return isDarkMode.value
    ? 'border-rose-300/50 bg-rose-900/20 text-rose-100'
    : 'border-rose-300 bg-rose-50 text-rose-700';
});

const realtimeStatusLabel = computed(() => {
  switch (realtimeStatus.value) {
    case 'connected':
      return 'connecte';
    case 'connecting':
      return 'connexion';
    case 'reconnecting':
      return 'reconnexion';
    case 'disconnected':
      return 'deconnecte';
    case 'error':
      return 'erreur';
    default:
      return 'inactif';
  }
});

const realtimeBadgeClass = computed(() => {
  if (realtimeStatus.value === 'connected') {
    return isDarkMode.value
      ? 'border-emerald-300/50 bg-emerald-900/20 text-emerald-100'
      : 'border-emerald-400 bg-emerald-50 text-emerald-700';
  }

  if (realtimeStatus.value === 'connecting' || realtimeStatus.value === 'reconnecting') {
    return isDarkMode.value
      ? 'border-amber-300/50 bg-amber-900/20 text-amber-100'
      : 'border-amber-400 bg-amber-50 text-amber-700';
  }

  if (realtimeStatus.value === 'error') {
    return isDarkMode.value
      ? 'border-rose-300/50 bg-rose-900/20 text-rose-100'
      : 'border-rose-300 bg-rose-50 text-rose-700';
  }

  return isDarkMode.value
    ? 'border-slate-600 bg-slate-900/50 text-slate-200'
    : 'border-slate-300 bg-slate-50 text-slate-700';
});

const realtimeMetrics = computed(() => [
  {
    label: 'Sync en attente',
    value: String(pendingSyncCount.value)
  },
  {
    label: 'Reconnexions',
    value: String(realtimeObservability.value.reconnectAttempts)
  },
  {
    label: 'Derniere connexion',
    value: formatRealtimeDate(realtimeObservability.value.lastConnectedAt)
  },
  {
    label: 'Derniere deconnexion',
    value: formatRealtimeDate(realtimeObservability.value.lastDisconnectedAt)
  },
  {
    label: 'Derniere erreur',
    value: formatRealtimeDate(realtimeObservability.value.lastErrorAt)
  }
]);

const selectedTasks = computed(() => {
  if (selectedListId.value.length === 0) {
    return [];
  }

  return getTasksForList(selectedListId.value).value;
});

const activeTasks = computed(() =>
  selectedTasks.value.filter((task) => !isTaskCompleted(task))
);

const completedTasks = computed(() =>
  selectedTasks.value.filter((task) => isTaskCompleted(task))
);

const selectedTask = computed(() =>
  selectedTasks.value.find((task) => task.id === selectedTaskId.value) ?? null
);

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function formatRealtimeDate(iso: string | null): string {
  if (!iso) {
    return '-';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('fr-FR');
}

async function handleCreateList(): Promise<void> {
  const success = await createList(listName.value);
  if (success) {
    listName.value = '';
    const newList = lists.value[0];
    if (newList) {
      await selectList(newList.id);
    }
  }
}

async function handleDeleteList(listId: string): Promise<void> {
  await deleteList(listId);

  if (selectedListId.value === listId) {
    selectedListId.value = '';
  }
}

function isSelectedList(listId: string): boolean {
  return selectedListId.value === listId;
}

async function selectList(listId: string): Promise<void> {
  selectedListId.value = listId;
  selectedTaskId.value = '';
  isCompletedTasksCollapsed.value = true;
  await loadTasks(listId);
  subscribeToList(listId);
}

function toggleLeftSidebar(): void {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value;
}

function toggleCompletedTasksSection(): void {
  isCompletedTasksCollapsed.value = !isCompletedTasksCollapsed.value;
}

function openTaskDetails(taskId: string): void {
  selectedTaskId.value = taskId;
}

function requestDeleteList(listId: string, listNameLabel: string): void {
  deleteConfirmation.value = {
    kind: 'list',
    id: listId,
    label: listNameLabel
  };
}

function requestDeleteTask(taskId: string, taskLabel: string): void {
  deleteConfirmation.value = {
    kind: 'task',
    id: taskId,
    label: taskLabel
  };
}

function closeDeleteConfirmation(): void {
  deleteConfirmation.value = null;
}

async function confirmDelete(): Promise<void> {
  if (!deleteConfirmation.value) {
    return;
  }

  const target = deleteConfirmation.value;
  closeDeleteConfirmation();

  if (target.kind === 'list') {
    await handleDeleteList(target.id);
    return;
  }

  await handleDeleteTask(target.id);
}

async function handleCreateTask(): Promise<void> {
  if (selectedListId.value.length === 0) {
    return;
  }

  const payload = {
    shortDescription: taskForm.value.shortDescription,
    longDescription:
      taskForm.value.longDescription.trim().length === 0
        ? null
        : taskForm.value.longDescription,
    dueDate: new Date(`${taskForm.value.dueDate}T12:00:00.000Z`).toISOString()
  };

  const success = await createTask(selectedListId.value, payload);
  if (success) {
    taskForm.value = {
      shortDescription: '',
      longDescription: '',
      dueDate: ''
    };
  }
}

async function handleCompleteTask(taskId: string): Promise<void> {
  if (selectedListId.value.length === 0) {
    return;
  }

  await completeTask(selectedListId.value, taskId);
}

async function handleReopenTask(taskId: string): Promise<void> {
  if (selectedListId.value.length === 0) {
    return;
  }

  await reopenTask(selectedListId.value, taskId);
}

async function handleDeleteTask(taskId: string): Promise<void> {
  if (selectedListId.value.length === 0) {
    return;
  }

  await deleteTask(selectedListId.value, taskId);

  if (selectedTaskId.value === taskId) {
    selectedTaskId.value = '';
  }
}

onMounted(async () => {
  startNetworkTracking();
  await loadLists();
  await flushPendingListMutations();
  await flushPendingMutations();

  if (lists.value.length > 0) {
    await selectList(lists.value[0].id);
  }
});

watch(
  () => isOnline.value,
  async (online) => {
    if (online) {
      await flushPendingListMutations();
      await flushPendingMutations();
    }
  }
);

onUnmounted(() => {
  stopNetworkTracking();
  stopRealtime();
});
</script>
