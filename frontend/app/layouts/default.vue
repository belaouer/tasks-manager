<template>
  <div
    class="min-h-screen transition-colors duration-500"
    :class="isDarkMode ? 'bg-shell-gradient-dark text-slate-100' : 'bg-shell-gradient-light text-slate-900'"
  >
    <div class="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header class="animate-rise mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink class="font-display text-3xl font-bold tracking-tight" to="/">Tasks Manager</NuxtLink>
        <div class="flex items-center gap-3">
          <nav class="flex items-center gap-2 text-sm font-medium">
            <NuxtLink
              to="/auth/login"
              class="rounded-lg px-3 py-2 transition"
              :class="isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'"
            >
              Login
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="rounded-lg px-3 py-2 transition"
              :class="isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'"
            >
              Register
            </NuxtLink>
            <NuxtLink
              to="/dashboard"
              class="rounded-lg px-3 py-2 transition"
              :class="isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'"
            >
              Dashboard
            </NuxtLink>
          </nav>
          <span class="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            :class="isDarkMode ? 'border-slate-700 bg-slate-900/60 text-slate-300' : 'border-slate-300 bg-white/70 text-slate-700'"
          >
            {{ isAuthenticated ? 'Session active' : 'Session invite' }}
          </span>
          <button
            v-if="isAuthenticated"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
            :class="isDarkMode
              ? 'border-rose-300/40 bg-rose-900/20 text-rose-100 hover:bg-rose-900/30'
              : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'"
            @click="handleLogout"
          >
            Logout
          </button>
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
            :class="isDarkMode
              ? 'border-cyan-300/40 bg-slate-900/70 text-cyan-200 hover:bg-slate-800'
              : 'border-slate-300 bg-white/75 text-slate-700 hover:bg-white'"
            @click="toggle"
          >
            {{ isDarkMode ? 'Passer en clair' : 'Passer en sombre' }}
          </button>
        </div>
      </header>
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from '#imports';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

const { isDarkMode, initialize, toggle } = useThemeMode();
const { isAuthenticated, logout } = useAuthSession();
const router = useRouter();

async function handleLogout(): Promise<void> {
  await logout();
  await router.push('/auth/login');
}

onMounted(() => {
  initialize();
});
</script>
