<template>
  <section
    class="animate-rise overflow-hidden rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
    :class="isDarkMode
      ? 'border-slate-700 bg-slate-900/65'
      : 'border-white/80 bg-white/70'"
  >
    <h1 class="font-display text-4xl font-bold leading-tight sm:text-5xl">{{ content.title }}</h1>
    <p class="mt-4 max-w-3xl text-base leading-7 sm:text-lg" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
      {{ content.lead }}
    </p>
    <div class="mt-6 flex flex-wrap gap-3">
      <NuxtLink
        class="rounded-xl px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        :class="isDarkMode
          ? 'bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-300/30 hover:bg-cyan-400/30'
          : 'bg-slate-900 text-slate-100 hover:bg-slate-800'"
        to="/auth/register"
      >
        Creer un compte
      </NuxtLink>
      <NuxtLink
        class="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        :class="isDarkMode
          ? 'border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-800'
          : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-white'"
        to="/auth/login"
      >
        Me connecter
      </NuxtLink>
    </div>

    <div class="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="card in content.cards"
        :key="card.title"
        class="rounded-2xl border p-4"
        :class="isDarkMode ? 'border-slate-700 bg-slate-950/45' : 'border-slate-200 bg-white/75'"
      >
        <h2 class="text-base font-bold">{{ card.title }}</h2>
        <p class="mt-2 text-sm leading-6" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
          {{ card.description }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLandingContent } from '~/domains/landing/application/use-landing-content';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

const content = useLandingContent();
const { isDarkMode } = useThemeMode();
</script>
