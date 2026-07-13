export const SUPPORTED_LISTS_PERSISTENCE_DRIVERS = [
  'in-memory',
  'typeorm',
  'prisma',
] as const;

export type ListsPersistenceDriver =
  (typeof SUPPORTED_LISTS_PERSISTENCE_DRIVERS)[number];

export const DEFAULT_LISTS_PERSISTENCE_DRIVER: ListsPersistenceDriver =
  'in-memory';

export function isListsPersistenceDriver(
  value: string,
): value is ListsPersistenceDriver {
  return SUPPORTED_LISTS_PERSISTENCE_DRIVERS.includes(
    value as ListsPersistenceDriver,
  );
}

export function resolveListsPersistenceDriver(
  value: string | undefined,
): ListsPersistenceDriver {
  if (value && isListsPersistenceDriver(value)) {
    return value;
  }

  return DEFAULT_LISTS_PERSISTENCE_DRIVER;
}
