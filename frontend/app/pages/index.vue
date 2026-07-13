<template>
  <section class="hero fade-in fade-in--2">
    <h1 class="hero__title">{{ content.title }}</h1>
    <p class="hero__lead">{{ content.lead }}</p>
    <div class="hero__actions">
      <a class="btn btn--primary" href="http://localhost:3000/docs" target="_blank" rel="noreferrer">Voir l'API backend</a>
      <a class="btn btn--secondary" href="https://nuxt.com/docs" target="_blank" rel="noreferrer">Guide Nuxt</a>
    </div>

    <div class="grid fade-in fade-in--3">
      <article v-for="card in content.cards" :key="card.title" class="card">
        <h2 class="card__title">{{ card.title }}</h2>
        <p class="card__text">{{ card.description }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLandingContent } from '~/domains/landing/application/use-landing-content';

const content = useLandingContent();
</script>
