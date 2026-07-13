import type {
  AccessTokenView,
  LoginPayload,
  RegisterPayload
} from '../domain/auth-payloads';
import { AuthApiPort } from '../domain/auth-api.port';

export class HttpAuthApiAdapter extends AuthApiPort {
  private get baseUrl(): string {
    const config = useRuntimeConfig();
    return config.public.apiBaseUrl;
  }

  async register(payload: RegisterPayload): Promise<AccessTokenView> {
    return $fetch<AccessTokenView>('/auth/register', {
      baseURL: this.baseUrl,
      method: 'POST',
      credentials: 'include',
      body: payload
    });
  }

  async login(payload: LoginPayload): Promise<AccessTokenView> {
    return $fetch<AccessTokenView>('/auth/login', {
      baseURL: this.baseUrl,
      method: 'POST',
      credentials: 'include',
      body: payload
    });
  }

  async refresh(): Promise<AccessTokenView> {
    return $fetch<AccessTokenView>('/auth/refresh', {
      baseURL: this.baseUrl,
      method: 'POST',
      credentials: 'include'
    });
  }

  async logout(): Promise<void> {
    await $fetch('/auth/logout', {
      baseURL: this.baseUrl,
      method: 'POST',
      credentials: 'include'
    });
  }
}
