<template>
  <article
    class="min-w-0 rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
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
        @click="emit('toggleLeftSidebar')"
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

    <form v-show="!isLeftSidebarCollapsed" class="mt-5 flex flex-col gap-3" @submit.prevent="emit('createList')">
      <input
        :value="listName"
        type="text"
        maxlength="120"
        placeholder="Nom de la nouvelle liste"
        class="w-full rounded-xl border px-3 py-2 text-sm"
        :class="inputClass"
        @input="onListNameInput"
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

    <p
      v-if="listsSyncStatusMessage"
      class="mt-2 rounded-lg border px-3 py-2 text-xs font-semibold"
      :class="isDarkMode
        ? 'border-amber-300/30 bg-amber-900/10 text-amber-100'
        : 'border-amber-200 bg-amber-50 text-amber-800'"
    >
      {{ listsSyncStatusMessage }}
    </p>

    <p v-if="listsLoading" class="mt-4 text-sm" :class="mutedClass">
      Chargement des listes...
    </p>

    <div v-show="!isLeftSidebarCollapsed" v-else class="mt-5 grid gap-3">
      <article
        v-for="list in lists"
        :key="list.id"
        class="min-w-0 rounded-2xl border p-4"
        :class="isDarkMode ? 'border-slate-700 bg-slate-950/45' : 'border-slate-200 bg-white/85'"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold sm:whitespace-normal sm:break-words">{{ list.name }}</h2>
            <p v-if="list.pendingSync" class="mt-1 text-xs font-semibold" :class="isDarkMode ? 'text-amber-200' : 'text-amber-700'">
              En attente de synchronisation
            </p>
            <p class="mt-1 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
              Creee le {{ formatDate(list.createdAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isSelectedList(list.id)
                ? (isDarkMode ? 'border-cyan-300/60 bg-cyan-900/20 text-cyan-100' : 'border-cyan-400 bg-cyan-50 text-cyan-700')
                : (isDarkMode ? 'border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100')"
              @click="emit('selectList', list.id)"
            >
              {{ isSelectedList(list.id) ? 'Ouverte' : 'Ouvrir' }}
            </button>
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
              :class="isDarkMode
                ? 'border-rose-400/40 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30'
                : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
              aria-label="Supprimer la liste"
              :disabled="!isOnline"
              :aria-disabled="!isOnline"
              @click="emit('requestDeleteList', { id: list.id, label: list.name })"
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
</template>

<script setup lang="ts">
import type { ListSummary } from '~/domains/lists/domain/list-summary';

interface ListDeleteRequest {
  readonly id: string;
  readonly label: string;
}

interface Props {
  readonly isDarkMode: boolean;
  readonly isOnline: boolean;
  readonly isLeftSidebarCollapsed: boolean;
  readonly listName: string;
  readonly lists: readonly ListSummary[];
  readonly listsLoading: boolean;
  readonly listsError: string;
  readonly listsSyncStatusMessage: string;
  readonly networkBadgeClass: string;
  readonly networkStatusLabel: string;
  readonly inputClass: string;
  readonly primaryButtonClass: string;
  readonly disabledButtonClass: string;
  readonly errorClass: string;
  readonly mutedClass: string;
  readonly isSelectedList: (listId: string) => boolean;
  readonly formatDate: (iso: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'toggleLeftSidebar'): void;
  (event: 'updateListName', value: string): void;
  (event: 'createList'): void;
  (event: 'selectList', listId: string): void;
  (event: 'requestDeleteList', payload: ListDeleteRequest): void;
}>();

function onListNameInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('updateListName', target.value);
}

void props;
</script>
