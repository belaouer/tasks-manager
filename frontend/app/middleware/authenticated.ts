import { useAuthSession } from '~/domains/auth/application/use-auth-session';

export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) {
    return;
  }

  const authSession = useAuthSession();
  const isAllowed = await authSession.ensureAuthenticated();

  if (!isAllowed) {
    return navigateTo('/auth/login');
  }
});
