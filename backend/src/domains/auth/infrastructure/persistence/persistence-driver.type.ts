export const SUPPORTED_PERSISTENCE_DRIVERS = [
  'in-memory',
  'typeorm',
  'prisma',
] as const;

export type PersistenceDriver =
  (typeof SUPPORTED_PERSISTENCE_DRIVERS)[number];

export const DEFAULT_PERSISTENCE_DRIVER: PersistenceDriver = 'in-memory';

export function isPersistenceDriver(value: string): value is PersistenceDriver {
  return SUPPORTED_PERSISTENCE_DRIVERS.includes(value as PersistenceDriver);
}

export function resolvePersistenceDriver(
  value: string | undefined,
): PersistenceDriver {
  if (value && isPersistenceDriver(value)) {
    return value;
  }

  return DEFAULT_PERSISTENCE_DRIVER;
}
