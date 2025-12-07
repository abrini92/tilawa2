import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Rate limiting configuration for Tilawa API.
 *
 * Default limits:
 * - Global: 100 requests per minute
 * - Upload endpoints: 10 uploads per minute (stricter)
 */
export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 1000, // 1 second
    limit: 10, // 10 requests per second
  },
  {
    name: 'medium',
    ttl: 10000, // 10 seconds
    limit: 50, // 50 requests per 10 seconds
  },
  {
    name: 'long',
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
];

/**
 * Stricter limits for upload endpoints.
 * Applied via @Throttle decorator on specific routes.
 */
export const uploadThrottleConfig = {
  short: { ttl: 1000, limit: 2 }, // 2 uploads per second
  medium: { ttl: 10000, limit: 5 }, // 5 uploads per 10 seconds
  long: { ttl: 60000, limit: 10 }, // 10 uploads per minute
};
