import { AuthSessionPort } from '../domain/auth-session.port';

const AUTH_TOKEN_STATE_KEY = 'tasks-manager.auth.access-token';

export class StateAuthSessionAdapter extends AuthSessionPort {
  private readonly accessToken = useState<string>(AUTH_TOKEN_STATE_KEY, () => '');

  readAccessToken(): string {
    return this.accessToken.value;
  }

  writeAccessToken(token: string): void {
    this.accessToken.value = token;
  }

  clear(): void {
    this.accessToken.value = '';
  }
}
