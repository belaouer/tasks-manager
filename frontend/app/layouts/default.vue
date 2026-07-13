<template>
  <div class="shell">
    <header class="shell__header fade-in">
      <NuxtLink class="shell__brand" to="/">Tasks Manager</NuxtLink>
      <span class="shell__meta">Frontend Nuxt - Fondation UI</span>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
