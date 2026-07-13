<template>
  <div
    v-if="confirmation"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
    role="dialog"
    aria-modal="true"
  >
    <article
      class="w-full max-w-md rounded-2xl border p-6 shadow-shell"
      :class="isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'"
    >
      <h3 class="font-display text-2xl font-bold">Confirmer la suppression</h3>
      <p class="mt-3 text-sm leading-7" :class="mutedClass">
        {{ confirmation.kind === 'list'
          ? `Tu vas supprimer la liste \"${confirmation.label}\" et toutes ses taches.`
          : `Tu vas supprimer la tache \"${confirmation.label}\".` }}
      </p>
      <p class="mt-2 text-xs font-semibold uppercase tracking-wide" :class="isDarkMode ? 'text-rose-200' : 'text-rose-700'">
        Cette action est irreversible.
      </p>

      <div class="mt-5 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border px-4 py-2 text-sm font-semibold transition"
          :class="isDarkMode
            ? 'border-slate-600 bg-slate-950/50 text-slate-100 hover:bg-slate-800'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
          @click="emit('cancel')"
        >
          Annuler
        </button>
        <button
          type="button"
          class="rounded-lg border px-4 py-2 text-sm font-semibold transition"
          :class="isDarkMode
            ? 'border-rose-300/50 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30'
            : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
          :disabled="!isOnline"
          @click="emit('confirm')"
        >
          Confirmer la suppression
        </button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
interface DeleteConfirmation {
  readonly kind: 'list' | 'task';
  readonly id: string;
  readonly label: string;
}

interface Props {
  readonly isDarkMode: boolean;
  readonly isOnline: boolean;
  readonly mutedClass: string;
  readonly confirmation: DeleteConfirmation | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: 'cancel'): void;
  (event: 'confirm'): void;
}>();
</script>
