import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasherAdapter extends PasswordHasherPort {
  private static readonly SALT_ROUNDS = 12;

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, BcryptPasswordHasherAdapter.SALT_ROUNDS);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
