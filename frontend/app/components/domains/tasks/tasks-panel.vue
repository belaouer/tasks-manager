<template>
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
      @submit.prevent="emit('createTask')"
    >
      <input
        :value="taskForm.shortDescription"
        type="text"
        maxlength="120"
        placeholder="Description courte"
        class="w-full rounded-xl border px-3 py-2 text-sm"
        :class="inputClass"
        @input="onTaskFieldInput('shortDescription', $event)"
      />
      <textarea
        :value="taskForm.longDescription"
        rows="3"
        placeholder="Description longue (optionnelle)"
        class="w-full rounded-xl border px-3 py-2 text-sm"
        :class="inputClass"
        @input="onTaskFieldInput('longDescription', $event)"
      />
      <input
        :value="taskForm.dueDate"
        type="date"
        class="w-full rounded-xl border px-3 py-2 text-sm"
        :class="inputClass"
        @input="onTaskFieldInput('dueDate', $event)"
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

    <p
      v-if="tasksSyncStatusMessage"
      class="mt-2 rounded-lg border px-3 py-2 text-xs font-semibold"
      :class="isDarkMode
        ? 'border-amber-300/30 bg-amber-900/10 text-amber-100'
        : 'border-amber-200 bg-amber-50 text-amber-800'"
    >
      {{ tasksSyncStatusMessage }}
    </p>

    <p v-if="tasksLoading" class="mt-4 text-sm" :class="mutedClass">
      Chargement des taches...
    </p>

    <div v-else-if="selectedListId" class="mt-5 space-y-4">
      <div class="grid gap-3">
        <article
          v-for="task in activeTasks"
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
              @click="emit('openTaskDetails', task.id)"
            >
              Details
            </button>
            <button
              v-if="!isTaskCompleted(task)"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode ? 'border-emerald-300/50 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-900/30' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
              :disabled="!isOnline"
              @click="emit('completeTask', task.id)"
            >
              Completer
            </button>
            <button
              v-else
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode ? 'border-amber-300/50 bg-amber-900/20 text-amber-100 hover:bg-amber-900/30' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'"
              :disabled="!isOnline"
              @click="emit('reopenTask', task.id)"
            >
              Reouvrir
            </button>
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode ? 'border-rose-300/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
              aria-label="Supprimer la tache"
              :disabled="!isOnline"
              @click="emit('requestDeleteTask', { id: task.id, label: task.shortDescription })"
            >
              Supprimer
            </button>
          </div>
        </article>
      </div>

      <article
        v-if="activeTasks.length === 0"
        class="rounded-2xl border border-dashed p-6 text-center text-sm"
        :class="isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'"
      >
        Aucune tache en cours pour cette liste.
      </article>

      <section class="rounded-2xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/45' : 'border-slate-200 bg-white/85'">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-base font-semibold">Mes taches terminees</h3>
          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            :class="isDarkMode
              ? 'border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
            :aria-expanded="!isCompletedTasksCollapsed"
            @click="emit('toggleCompletedTasksSection')"
          >
            {{ isCompletedTasksCollapsed ? 'Afficher' : 'Masquer' }} ({{ completedTasks.length }})
          </button>
        </div>

        <div v-show="!isCompletedTasksCollapsed" class="mt-4 grid gap-3">
          <article
            v-for="task in completedTasks"
            :key="task.id"
            class="rounded-2xl border p-4"
            :class="isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50/80'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h4 class="text-base font-semibold">{{ task.shortDescription }}</h4>
                <p v-if="task.longDescription" class="mt-1 text-sm" :class="mutedClass">{{ task.longDescription }}</p>
                <p class="mt-2 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                  Echeance: {{ formatDate(task.dueDate) }}
                </p>
              </div>
              <span
                class="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase"
                :class="isDarkMode ? 'border-emerald-300/50 bg-emerald-900/20 text-emerald-100' : 'border-emerald-400 bg-emerald-50 text-emerald-700'"
              >
                Terminee
              </span>
            </div>

            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                :class="selectedTaskId === task.id
                  ? (isDarkMode ? 'border-cyan-300/60 bg-cyan-900/20 text-cyan-100' : 'border-cyan-400 bg-cyan-50 text-cyan-700')
                  : (isDarkMode ? 'border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100')"
                @click="emit('openTaskDetails', task.id)"
              >
                Details
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                :class="isDarkMode ? 'border-amber-300/50 bg-amber-900/20 text-amber-100 hover:bg-amber-900/30' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'"
                :disabled="!isOnline"
                @click="emit('reopenTask', task.id)"
              >
                Reouvrir
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                :class="isDarkMode ? 'border-rose-300/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
                aria-label="Supprimer la tache"
                :disabled="!isOnline"
                @click="emit('requestDeleteTask', { id: task.id, label: task.shortDescription })"
              >
                Supprimer
              </button>
            </div>
          </article>

          <article
            v-if="completedTasks.length === 0"
            class="rounded-2xl border border-dashed p-6 text-center text-sm"
            :class="isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'"
          >
            Aucune tache terminee pour cette liste.
          </article>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { TaskSummary } from '~/domains/tasks/domain/task-summary';

interface TaskDeleteRequest {
  readonly id: string;
  readonly label: string;
}

interface TaskFormState {
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly dueDate: string;
}

interface RealtimeMetric {
  readonly label: string;
  readonly value: string;
}

interface Props {
  readonly isDarkMode: boolean;
  readonly isOnline: boolean;
  readonly selectedListId: string;
  readonly selectedTaskId: string;
  readonly taskForm: TaskFormState;
  readonly tasksLoading: boolean;
  readonly tasksError: string;
  readonly tasksSyncStatusMessage: string;
  readonly realtimeStatusLabel: string;
  readonly realtimeBadgeClass: string;
  readonly realtimeMetrics: readonly RealtimeMetric[];
  readonly inputClass: string;
  readonly primaryButtonClass: string;
  readonly errorClass: string;
  readonly mutedClass: string;
  readonly activeTasks: readonly TaskSummary[];
  readonly completedTasks: readonly TaskSummary[];
  readonly isCompletedTasksCollapsed: boolean;
  readonly isTaskCompleted: (task: TaskSummary) => boolean;
  readonly formatDate: (iso: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'updateTaskForm', value: TaskFormState): void;
  (event: 'createTask'): void;
  (event: 'openTaskDetails', taskId: string): void;
  (event: 'completeTask', taskId: string): void;
  (event: 'reopenTask', taskId: string): void;
  (event: 'requestDeleteTask', payload: TaskDeleteRequest): void;
  (event: 'toggleCompletedTasksSection'): void;
}>();

function onTaskFieldInput(
  field: keyof TaskFormState,
  event: Event
): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  emit('updateTaskForm', {
    ...props.taskForm,
    [field]: target.value
  });
}

void props;
</script>
