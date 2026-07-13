export const SUPPORTED_TASKS_PERSISTENCE_DRIVERS = [
  'in-memory',
  'typeorm',
  'prisma',
] as const;

export type TasksPersistenceDriver =
  (typeof SUPPORTED_TASKS_PERSISTENCE_DRIVERS)[number];

export const DEFAULT_TASKS_PERSISTENCE_DRIVER: TasksPersistenceDriver =
  'in-memory';

export function isTasksPersistenceDriver(
  value: string,
): value is TasksPersistenceDriver {
  return SUPPORTED_TASKS_PERSISTENCE_DRIVERS.includes(
    value as TasksPersistenceDriver,
  );
}

export function resolveTasksPersistenceDriver(
  value: string | undefined,
): TasksPersistenceDriver {
  if (value && isTasksPersistenceDriver(value)) {
    return value;
  }

  return DEFAULT_TASKS_PERSISTENCE_DRIVER;
}
