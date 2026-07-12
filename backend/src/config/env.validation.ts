import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  PERSISTENCE_DRIVER: Joi.string()
    .valid('in-memory', 'typeorm', 'prisma')
    .default('in-memory'),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ISSUER: Joi.string().min(3).required(),
  JWT_AUDIENCE: Joi.string().min(3).required(),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  DATABASE_URL: Joi.when('PERSISTENCE_DRIVER', {
    is: Joi.string().valid('typeorm', 'prisma'),
    then: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
    otherwise: Joi.string().optional(),
  }),
}).unknown(true);