import { ref, type Ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

const stateStore = new Map<string, Ref<unknown>>();

(globalThis as any).useState = <T>(
  key: string,
  init: () => T
): Ref<T> => {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init()) as Ref<unknown>);
  }

  return stateStore.get(key) as Ref<T>;
};

(globalThis as any).useRuntimeConfig = () => ({
  public: {
    apiBaseUrl: 'http://localhost:3000'
  }
});

setActivePinia(createPinia());

(globalThis as any).__resetNuxtStateStore = () => {
  stateStore.clear();
  setActivePinia(createPinia());
};
