<template>
  <section
    class="animate-rise mx-auto max-w-xl rounded-3xl border p-6 shadow-shell backdrop-blur sm:p-8"
    :class="isDarkMode ? 'border-slate-700 bg-slate-900/65' : 'border-white/80 bg-white/75'"
  >
    <h1 class="font-display text-3xl font-bold">Inscription</h1>
    <p class="mt-2 text-sm" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
      Cree ton compte pour demarrer la gestion de tes listes et taches.
    </p>

    <form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
      <label class="block text-sm font-semibold sm:col-span-1">
        Prenom
        <input v-model="form.firstName" type="text" required minlength="2" class="mt-1 w-full rounded-xl border px-3 py-2" :class="inputClass" />
      </label>

      <label class="block text-sm font-semibold sm:col-span-1">
        Nom
        <input v-model="form.lastName" type="text" required minlength="2" class="mt-1 w-full rounded-xl border px-3 py-2" :class="inputClass" />
      </label>

      <label class="block text-sm font-semibold sm:col-span-2">
        Email
        <input v-model="form.email" type="email" required class="mt-1 w-full rounded-xl border px-3 py-2" :class="inputClass" autocomplete="email" />
      </label>

      <label class="block text-sm font-semibold sm:col-span-2">
        Confirmation email
        <input v-model="form.emailConfirmation" type="email" required class="mt-1 w-full rounded-xl border px-3 py-2" :class="inputClass" autocomplete="email" />
      </label>

      <label class="block text-sm font-semibold sm:col-span-2">
        Mot de passe
        <input v-model="form.password" type="password" required minlength="8" class="mt-1 w-full rounded-xl border px-3 py-2" :class="inputClass" autocomplete="new-password" />
      </label>

      <label class="block text-sm font-semibold sm:col-span-2">
        Confirmation mot de passe
        <input v-model="form.passwordConfirmation" type="password" required minlength="8" class="mt-1 w-full rounded-xl border px-3 py-2" :class="inputClass" autocomplete="new-password" />
      </label>

      <p v-if="errorMessage" class="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
        :class="isDarkMode ? 'border-rose-400/40 bg-rose-900/20 text-rose-100' : 'border-rose-300 bg-rose-50 text-rose-700'">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="rounded-xl px-4 py-2 text-sm font-semibold transition sm:col-span-2"
        :class="isDarkMode ? 'bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-300/40 hover:bg-cyan-400/30' : 'bg-slate-900 text-slate-100 hover:bg-slate-800'"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Creation...' : 'Creer mon compte' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from '#imports';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import { useThemeMode } from '~/domains/theme/application/use-theme-mode';

definePageMeta({
  middleware: ['guest']
});

const router = useRouter();
const authSession = useAuthSession();
const { isDarkMode } = useThemeMode();

const form = reactive({
  email: '',
  emailConfirmation: '',
  password: '',
  passwordConfirmation: '',
  firstName: '',
  lastName: ''
});
const isSubmitting = ref(false);
const errorMessage = ref('');

const inputClass = computed(() =>
  isDarkMode.value
    ? 'border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-400'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
);

async function onSubmit(): Promise<void> {
  errorMessage.value = '';

  if (form.email !== form.emailConfirmation) {
    errorMessage.value = 'La confirmation email ne correspond pas.';
    return;
  }

  if (form.password !== form.passwordConfirmation) {
    errorMessage.value = 'La confirmation du mot de passe ne correspond pas.';
    return;
  }

  isSubmitting.value = true;

  try {
    await authSession.register({
      email: form.email,
      emailConfirmation: form.emailConfirmation,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
      firstName: form.firstName,
      lastName: form.lastName
    });
    await router.push('/dashboard');
  } catch {
    errorMessage.value = 'Impossible de creer le compte (email peut-etre deja utilise).';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
