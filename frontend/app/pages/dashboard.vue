<template>
  <section
    class="animate-rise rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
    :class="isDarkMode ? 'border-slate-700 bg-slate-900/65' : 'border-white/80 bg-white/75'"
  >
    <h1 class="font-display text-4xl font-bold">Dashboard</h1>
    <p class="mt-3 max-w-2xl text-sm leading-7 sm:text-base" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
      Tu es authentifie. Cette page est protegee par le middleware frontend et servira de point d'entree
      pour les modules Lists et Tasks.
    </p>

    <div class="mt-5 rounded-2xl border p-4 text-sm" :class="isDarkMode ? 'border-slate-700 bg-slate-950/45 text-slate-300' : 'border-slate-200 bg-white/80 text-slate-700'">
      <p><strong>Etat session:</strong> {{ isAuthenticated ? 'active' : 'inactive' }}</p>
      <p class="mt-2 break-all"><strong>Access token:</strong> {{ tokenPreview }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

definePageMeta({
  middleware: ['authenticated']
});

const { isDarkMode } = useThemeMode();
const { accessToken, isAuthenticated } = useAuthSession();

const tokenPreview = computed(() => {
  if (accessToken.value.length === 0) {
    return 'aucun';
  }

  return `${accessToken.value.slice(0, 24)}...`;
});
</script>
