import { useAuthSession } from '~/domains/auth/application/use-auth-session';

export default defineNuxtPlugin(async () => {
  const authSession = useAuthSession();
  await authSession.ensureBootstrapped();
});
