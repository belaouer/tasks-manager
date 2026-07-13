const AUTH_ROUTES_PATTERN = /\/auth\/(register|login|refresh|logout)(?:$|[/?#])/;

export type AuthenticatedRequestOptions = {
  readonly headers?: HeadersInit;
  _authRetry?: boolean;
  [key: string]: unknown;
};

type Fetcher = <T>(request: RequestInfo, options?: any) => Promise<T>;

interface AuthenticatedApiClientDependencies {
  readonly fetcher: Fetcher;
  readonly getAccessToken: () => string;
  readonly refreshAccessToken: () => Promise<string | null>;
  readonly redirectToLogin?: () => Promise<void> | void;
}

function resolveRequestPath(request: RequestInfo): string {
  if (typeof request === 'string') {
    return request;
  }

  if (request instanceof Request) {
    return request.url;
  }

  return String(request);
}

function isAuthRoute(request: RequestInfo): boolean {
  return AUTH_ROUTES_PATTERN.test(resolveRequestPath(request));
}

function withAuthorizationHeader(headers: HeadersInit | undefined, token: string): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('Authorization', `Bearer ${token}`);
  return nextHeaders;
}

export function createAuthenticatedApiClient({
  fetcher,
  getAccessToken,
  refreshAccessToken,
  redirectToLogin
}: AuthenticatedApiClientDependencies) {
  const requestWithAuth = async <T>(
    request: RequestInfo,
    options: any = {}
  ): Promise<T> => {
    try {
      if (!isAuthRoute(request) && getAccessToken().length > 0) {
        options = {
          ...options,
          headers: withAuthorizationHeader(options.headers, getAccessToken())
        };
      }

      return await fetcher<T>(request, options);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status !== 401 || options._authRetry || isAuthRoute(request)) {
        throw error;
      }

      const refreshedToken = await refreshAccessToken();
      if (!refreshedToken) {
        if (redirectToLogin) {
          await redirectToLogin();
        }

        throw error;
      }

      const retryOptions: AuthenticatedRequestOptions = {
        ...options,
        _authRetry: true,
        headers: withAuthorizationHeader(options.headers, refreshedToken)
      };

      return fetcher<T>(request, retryOptions);
    }
  };

  return {
    requestWithAuth
  };
}