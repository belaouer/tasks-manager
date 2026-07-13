<template>
  <section class="grid animate-rise gap-4 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(280px,360px)]">
    <article
      class="rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
      :class="isDarkMode ? 'border-slate-700 bg-slate-900/65' : 'border-white/80 bg-white/75'"
    >
      <div class="flex items-center justify-between gap-3">
        <h1 class="font-display text-4xl font-bold">Mes listes</h1>
        <button
          type="button"
          class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
          :class="isDarkMode
            ? 'border-slate-500 bg-slate-900/60 text-slate-200 hover:bg-slate-800'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
          @click="toggleLeftSidebar"
        >
          {{ isLeftSidebarCollapsed ? 'Etendre' : 'Reduire' }}
        </button>
      </div>
      <div class="mt-3">
        <span
          class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase"
          :class="networkBadgeClass"
        >
          Reseau: {{ networkStatusLabel }}
        </span>
      </div>
      <p class="mt-3 text-sm leading-7" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
        Cree, consulte et supprime tes listes.
      </p>

      <form v-show="!isLeftSidebarCollapsed" class="mt-5 flex flex-col gap-3" @submit.prevent="handleCreateList">
        <input
          v-model="listName"
          type="text"
          maxlength="120"
          placeholder="Nom de la nouvelle liste"
          class="w-full rounded-xl border px-3 py-2 text-sm"
          :class="inputClass"
        />
        <button
          type="submit"
          class="rounded-xl px-4 py-2 text-sm font-semibold transition"
          :class="[primaryButtonClass, !isOnline ? disabledButtonClass : '']"
          :disabled="!isOnline"
        >
          Ajouter
        </button>
      </form>

      <p
        v-if="listsError"
        class="mt-4 rounded-lg border px-3 py-2 text-sm"
        :class="errorClass"
      >
        {{ listsError }}
      </p>

      <p v-if="listsLoading" class="mt-4 text-sm" :class="mutedClass">
        Chargement des listes...
      </p>

      <div v-show="!isLeftSidebarCollapsed" v-else class="mt-5 grid gap-3">
        <article
          v-for="list in lists"
          :key="list.id"
          class="rounded-2xl border p-4"
          :class="isDarkMode ? 'border-slate-700 bg-slate-950/45' : 'border-slate-200 bg-white/85'"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">{{ list.name }}</h2>
              <p class="mt-1 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                Creee le {{ formatDate(list.createdAt) }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                :class="isSelectedList(list.id)
                  ? (isDarkMode ? 'border-cyan-300/60 bg-cyan-900/20 text-cyan-100' : 'border-cyan-400 bg-cyan-50 text-cyan-700')
                  : (isDarkMode ? 'border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100')"
                @click="selectList(list.id)"
              >
                {{ isSelectedList(list.id) ? 'Ouverte' : 'Ouvrir' }}
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                :class="isDarkMode
                  ? 'border-rose-400/40 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30'
                  : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
                :disabled="!isOnline"
                :aria-disabled="!isOnline"
                @click="handleDeleteList(list.id)"
              >
                Supprimer
              </button>
            </div>
          </div>
        </article>

        <article
          v-if="lists.length === 0"
          class="rounded-2xl border border-dashed p-6 text-center text-sm"
          :class="isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'"
        >
          Aucune liste pour le moment.
        </article>
      </div>
    </article>

    <article
      class="rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
      :class="isDarkMode ? 'border-slate-700 bg-slate-900/65' : 'border-white/80 bg-white/75'"
    >
      <div class="flex items-start justify-between gap-3">
        <h2 class="font-display text-3xl font-bold">Taches</h2>
        <span
          class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase"
          :class="realtimeBadgeClass"
        >
          Socket: {{ realtimeStatusLabel }}
        </span>
      </div>
      <p class="mt-3 text-sm leading-7" :class="mutedClass">
        {{ selectedListId ? 'Gestion complete des taches de la liste selectionnee.' : 'Selectionne une liste pour afficher ses taches.' }}
      </p>

      <div class="mt-4 grid gap-2 sm:grid-cols-2">
        <article
          v-for="metric in realtimeMetrics"
          :key="metric.label"
          class="rounded-xl border px-3 py-2"
          :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">
            {{ metric.label }}
          </p>
          <p class="mt-1 text-sm font-semibold" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">
            {{ metric.value }}
          </p>
        </article>
      </div>

      <form
        v-if="selectedListId"
        class="mt-5 grid gap-3"
        @submit.prevent="handleCreateTask"
      >
        <input
          v-model="taskForm.shortDescription"
          type="text"
          maxlength="120"
          placeholder="Description courte"
          class="w-full rounded-xl border px-3 py-2 text-sm"
          :class="inputClass"
        />
        <textarea
          v-model="taskForm.longDescription"
          rows="3"
          placeholder="Description longue (optionnelle)"
          class="w-full rounded-xl border px-3 py-2 text-sm"
          :class="inputClass"
        />
        <input
          v-model="taskForm.dueDate"
          type="date"
          class="w-full rounded-xl border px-3 py-2 text-sm"
          :class="inputClass"
        />
        <button
          type="submit"
          class="rounded-xl px-4 py-2 text-sm font-semibold transition"
          :class="primaryButtonClass"
        >
          Ajouter la tache
        </button>
      </form>

      <p v-if="tasksError" class="mt-4 rounded-lg border px-3 py-2 text-sm" :class="errorClass">
        {{ tasksError }}
      </p>

      <p v-if="tasksLoading" class="mt-4 text-sm" :class="mutedClass">
        Chargement des taches...
      </p>

      <div v-else-if="selectedListId" class="mt-5 grid gap-3">
        <article
          v-for="task in selectedTasks"
          :key="task.id"
          class="rounded-2xl border p-4"
          :class="isDarkMode ? 'border-slate-700 bg-slate-950/45' : 'border-slate-200 bg-white/85'"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold">{{ task.shortDescription }}</h3>
              <p v-if="task.pendingSync" class="mt-1 text-xs font-semibold" :class="isDarkMode ? 'text-amber-200' : 'text-amber-700'">
                En attente de synchronisation
              </p>
              <p v-if="task.longDescription" class="mt-1 text-sm" :class="mutedClass">{{ task.longDescription }}</p>
              <p class="mt-2 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                Echeance: {{ formatDate(task.dueDate) }}
              </p>
            </div>
            <span
              class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase"
              :class="isTaskCompleted(task)
                ? (isDarkMode ? 'border-emerald-300/50 bg-emerald-900/20 text-emerald-100' : 'border-emerald-400 bg-emerald-50 text-emerald-700')
                : (isDarkMode ? 'border-amber-300/50 bg-amber-900/20 text-amber-100' : 'border-amber-400 bg-amber-50 text-amber-700')"
            >
              {{ isTaskCompleted(task) ? 'Terminee' : 'En cours' }}
            </span>
          </div>

          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="selectedTaskId === task.id
                ? (isDarkMode ? 'border-cyan-300/60 bg-cyan-900/20 text-cyan-100' : 'border-cyan-400 bg-cyan-50 text-cyan-700')
                : (isDarkMode ? 'border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100')"
              @click="openTaskDetails(task.id)"
            >
              Details
            </button>
            <button
              v-if="!isTaskCompleted(task)"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode ? 'border-emerald-300/50 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-900/30' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
              :disabled="!isOnline"
              @click="handleCompleteTask(task.id)"
            >
              Completer
            </button>
            <button
              v-else
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode ? 'border-amber-300/50 bg-amber-900/20 text-amber-100 hover:bg-amber-900/30' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'"
              :disabled="!isOnline"
              @click="handleReopenTask(task.id)"
            >
              Reouvrir
            </button>
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode ? 'border-rose-300/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
              :disabled="!isOnline"
              @click="handleDeleteTask(task.id)"
            >
              Supprimer
            </button>
          </div>
        </article>

        <article
          v-if="selectedTasks.length === 0"
          class="rounded-2xl border border-dashed p-6 text-center text-sm"
          :class="isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'"
        >
          Aucune tache pour cette liste.
        </article>
      </div>
    </article>

    <article
      v-if="selectedTask"
      class="rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
      :class="isDarkMode ? 'border-slate-700 bg-slate-900/65' : 'border-white/80 bg-white/75'"
    >
      <h2 class="font-display text-3xl font-bold">Detail de la tache</h2>
      <p class="mt-2 text-sm" :class="mutedClass">
        Informations completes de la tache selectionnee.
      </p>

      <div class="mt-5 space-y-4">
        <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
          <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Description courte</p>
          <p class="mt-1 text-sm font-semibold" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ selectedTask.shortDescription }}</p>
        </article>

        <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
          <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Description longue</p>
          <p class="mt-1 text-sm" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ selectedTask.longDescription ?? '-' }}</p>
        </article>

        <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
          <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Echeance</p>
          <p class="mt-1 text-sm" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ formatDate(selectedTask.dueDate) }}</p>
        </article>

        <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
          <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Creation</p>
          <p class="mt-1 text-sm" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ formatRealtimeDate(selectedTask.createdAt) }}</p>
        </article>

        <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
          <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Statut</p>
          <p class="mt-1 text-sm font-semibold" :class="isTaskCompleted(selectedTask)
            ? (isDarkMode ? 'text-emerald-200' : 'text-emerald-700')
            : (isDarkMode ? 'text-amber-200' : 'text-amber-700')"
          >
            {{ isTaskCompleted(selectedTask) ? 'Terminee' : 'En cours' }}
          </p>
        </article>
      </div>

      <button
        type="button"
        class="mt-5 rounded-xl border px-4 py-2 text-sm font-semibold transition"
        :class="isDarkMode ? 'border-rose-300/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
        :disabled="!isOnline"
        @click="handleDeleteTask(selectedTask.id)"
      >
        Supprimer la tache
      </button>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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
  loadLists,
  createList,
  deleteList
} = useLists();
const {
  isLoading: tasksLoading,
  errorMessage: tasksError,
  pendingSyncCount,
  getTasksForList,
  loadTasks,
  flushPendingCreates,
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
  await loadTasks(listId);
  subscribeToList(listId);
}

function toggleLeftSidebar(): void {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value;
}

function openTaskDetails(taskId: string): void {
  selectedTaskId.value = taskId;
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
  await flushPendingCreates();

  if (lists.value.length > 0) {
    await selectList(lists.value[0].id);
  }
});

watch(
  () => isOnline.value,
  async (online) => {
    if (online) {
      await flushPendingCreates();
    }
  }
);

onUnmounted(() => {
  stopNetworkTracking();
  stopRealtime();
});
</script>
