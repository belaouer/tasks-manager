<template>
  <article
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
        <p class="mt-1 text-sm font-semibold" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ task.shortDescription }}</p>
      </article>

      <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
        <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Description longue</p>
        <p class="mt-1 text-sm" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ task.longDescription ?? '-' }}</p>
      </article>

      <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
        <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Echeance</p>
        <p class="mt-1 text-sm" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ formatDate(task.dueDate) }}</p>
      </article>

      <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
        <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Creation</p>
        <p class="mt-1 text-sm" :class="isDarkMode ? 'text-slate-100' : 'text-slate-800'">{{ formatRealtimeDate(task.createdAt) }}</p>
      </article>

      <article class="rounded-xl border p-4" :class="isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-white/70'">
        <p class="text-[11px] font-semibold uppercase tracking-wide" :class="mutedClass">Statut</p>
        <p class="mt-1 text-sm font-semibold" :class="isTaskCompleted(task)
          ? (isDarkMode ? 'text-emerald-200' : 'text-emerald-700')
          : (isDarkMode ? 'text-amber-200' : 'text-amber-700')"
        >
          {{ isTaskCompleted(task) ? 'Terminee' : 'En cours' }}
        </p>
      </article>
    </div>

    <button
      type="button"
      class="mt-5 rounded-xl border px-4 py-2 text-sm font-semibold transition"
      :class="isDarkMode ? 'border-rose-300/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
      :disabled="!isOnline"
      @click="emit('requestDeleteTask', { id: task.id, label: task.shortDescription })"
    >
      Supprimer la tache
    </button>
  </article>
</template>

<script setup lang="ts">
import type { TaskSummary } from '~/domains/tasks/domain/task-summary';

interface TaskDeleteRequest {
  readonly id: string;
  readonly label: string;
}

interface Props {
  readonly isDarkMode: boolean;
  readonly isOnline: boolean;
  readonly mutedClass: string;
  readonly task: TaskSummary;
  readonly isTaskCompleted: (task: TaskSummary) => boolean;
  readonly formatDate: (iso: string) => string;
  readonly formatRealtimeDate: (iso: string | null) => string;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: 'requestDeleteTask', payload: TaskDeleteRequest): void;
}>();
</script>
