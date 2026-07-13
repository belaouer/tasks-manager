<template>
  <section
    class="animate-rise rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
    :class="isDarkMode ? 'border-slate-700 bg-slate-900/65' : 'border-white/80 bg-white/75'"
  >
    <h1 class="font-display text-4xl font-bold">Mes listes</h1>
    <p class="mt-3 max-w-2xl text-sm leading-7 sm:text-base" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
      Cree, consulte et supprime tes listes. Les appels utilisent le bearer token issu de la session Auth.
    </p>

    <form class="mt-5 flex flex-col gap-3 sm:flex-row" @submit.prevent="handleCreateList">
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
        :class="isDarkMode ? 'bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-300/40 hover:bg-cyan-400/30' : 'bg-slate-900 text-slate-100 hover:bg-slate-800'"
      >
        Ajouter
      </button>
    </form>

    <p
      v-if="errorMessage"
      class="mt-4 rounded-lg border px-3 py-2 text-sm"
      :class="isDarkMode ? 'border-rose-400/40 bg-rose-900/20 text-rose-100' : 'border-rose-300 bg-rose-50 text-rose-700'"
    >
      {{ errorMessage }}
    </p>

    <p v-if="isLoading" class="mt-4 text-sm" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
      Chargement des listes...
    </p>

    <div v-else class="mt-5 grid gap-3">
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
          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            :class="isDarkMode
              ? 'border-rose-400/40 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30'
              : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
            @click="handleDeleteList(list.id)"
          >
            Supprimer
          </button>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useLists } from '~/domains/lists/application/use-lists';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

definePageMeta({
  middleware: ['authenticated']
});

const { isDarkMode } = useThemeMode();
const { lists, isLoading, errorMessage, loadLists, createList, deleteList } = useLists();

const listName = ref('');

const inputClass = computed(() =>
  isDarkMode.value
    ? 'border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-400'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
);

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

async function handleCreateList(): Promise<void> {
  const success = await createList(listName.value);
  if (success) {
    listName.value = '';
  }
}

async function handleDeleteList(listId: string): Promise<void> {
  await deleteList(listId);
}

onMounted(async () => {
  await loadLists();
});
</script>
