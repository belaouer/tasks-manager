export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface RegisterPayload {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface AccessTokenView {
  readonly accessToken: string;
}

export interface AuthSessionView {
  readonly accessToken: string;
  readonly isAuthenticated: boolean;
}
