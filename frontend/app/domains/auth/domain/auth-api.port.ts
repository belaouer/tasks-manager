import type {
  AccessTokenView,
  LoginPayload,
  RegisterPayload
} from './auth-payloads';

export abstract class AuthApiPort {
  abstract register(payload: RegisterPayload): Promise<AccessTokenView>;

  abstract login(payload: LoginPayload): Promise<AccessTokenView>;

  abstract refresh(): Promise<AccessTokenView>;

  abstract logout(): Promise<void>;
}
