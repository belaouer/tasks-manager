import { useAuthSession } from '~/domains/auth/application/use-auth-session';

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    const refreshCookie = useCookie<string | null>('refreshToken', {
      default: () => null,
      path: '/auth'
    });

    if ((refreshCookie.value ?? '').length === 0) {
      return navigateTo('/auth/login');
    }

    return;
  }

  const authSession = useAuthSession();
  const isAllowed = await authSession.ensureAuthenticated();

  if (!isAllowed) {
    return navigateTo('/auth/login');
  }
});
