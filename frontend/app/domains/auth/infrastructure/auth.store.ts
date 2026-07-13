import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('');
  const isBootstrapped = ref(false);

  return {
    accessToken,
    isBootstrapped
  };
});
