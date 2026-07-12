export type AuthTokenPayload = {
  readonly sub: string;
  readonly email: string;
};

export type IssuedAuthTokens = {
  readonly accessToken: string;
  readonly refreshToken: string;
};

export abstract class TokenIssuerPort {
  abstract issueTokens(payload: AuthTokenPayload): Promise<IssuedAuthTokens>;
}
