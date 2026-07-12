import { AuthTokenPayload } from './token-issuer.port';

export abstract class TokenVerifierPort {
  abstract verifyRefreshToken(token: string): Promise<AuthTokenPayload | null>;
}
