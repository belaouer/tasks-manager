export const SUPPORTED_USERS_PERSISTENCE_DRIVERS = [
  'in-memory',
  'typeorm',
  'prisma',
] as const;

export type UsersPersistenceDriver =
  (typeof SUPPORTED_USERS_PERSISTENCE_DRIVERS)[number];

export const DEFAULT_USERS_PERSISTENCE_DRIVER: UsersPersistenceDriver =
  'in-memory';

export function isUsersPersistenceDriver(
  value: string,
): value is UsersPersistenceDriver {
  return SUPPORTED_USERS_PERSISTENCE_DRIVERS.includes(
    value as UsersPersistenceDriver,
  );
}

export function resolveUsersPersistenceDriver(
  value: string | undefined,
): UsersPersistenceDriver {
  if (value && isUsersPersistenceDriver(value)) {
    return value;
  }

  return DEFAULT_USERS_PERSISTENCE_DRIVER;
}
