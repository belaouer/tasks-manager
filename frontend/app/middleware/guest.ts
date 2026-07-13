import { useAuthSession } from '~/domains/auth/application/use-auth-session';

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    const refreshCookie = useCookie<string | null>('refreshToken', {
      default: () => null,
      path: '/auth'
    });

    if ((refreshCookie.value ?? '').length > 0) {
      return navigateTo('/dashboard');
    }

    return;
  }

  const authSession = useAuthSession();
  const isAuthenticated = await authSession.ensureAuthenticated();

  if (isAuthenticated) {
    return navigateTo('/dashboard');
  }
});