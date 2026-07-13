import type {
  AccessTokenView,
  LoginPayload,
  RegisterPayload
} from '../domain/auth-payloads';
import { AuthApiPort } from '../domain/auth-api.port';

export class HttpAuthApiAdapter extends AuthApiPort {
  private get api() {
    const { $api } = useNuxtApp();
    return $api;
  }

  async register(payload: RegisterPayload): Promise<AccessTokenView> {
    return this.api<AccessTokenView>('/auth/register', {
      method: 'POST',
      body: payload
    });
  }

  async login(payload: LoginPayload): Promise<AccessTokenView> {
    return this.api<AccessTokenView>('/auth/login', {
      method: 'POST',
      body: payload
    });
  }

  async refresh(): Promise<AccessTokenView> {
    return this.api<AccessTokenView>('/auth/refresh', {
      method: 'POST'
    });
  }

  async logout(): Promise<void> {
    await this.api('/auth/logout', {
      method: 'POST'
    });
  }
}
