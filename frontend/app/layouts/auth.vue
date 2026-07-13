<template>
  <div
    class="min-h-screen px-4 py-10 transition-colors duration-500 sm:px-6 lg:px-8"
    :class="isDarkMode ? 'bg-shell-gradient-dark text-slate-100' : 'bg-shell-gradient-light text-slate-900'"
  >
    <main class="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

const { isDarkMode, initialize } = useThemeMode();

onMounted(() => {
  initialize();
});
</script>
