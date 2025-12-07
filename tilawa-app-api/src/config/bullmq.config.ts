/**
 * BullMQ configuration for async job processing.
 *
 * Queues:
 * - audio-processing: Heavy audio enhancement jobs
 * - quran-alignment: ASR + alignment jobs
 */
export const bullmqConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
};

export const QUEUE_NAMES = {
  AUDIO_PROCESSING: 'audio-processing',
  QURAN_ALIGNMENT: 'quran-alignment',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
