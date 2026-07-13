import { useAuthSession } from '~/domains/auth/application/use-auth-session';

export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) {
    return;
  }

  const authSession = useAuthSession();
  const isAuthenticated = await authSession.ensureAuthenticated();

  if (isAuthenticated) {
    return navigateTo('/dashboard');
  }
});