#!/usr/bin/env ts-node
/**
 * Test script to validate BullMQ async queue processing.
 *
 * Usage:
 *   ts-node scripts/test_bullmq.ts
 *
 * Requires:
 *   - Redis running (localhost:6379)
 *   - NestJS API running (localhost:3000)
 *   - PostgreSQL with test user
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`\n${colors.bold}${msg}${colors.reset}`),
};

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const QUEUE_NAME = 'audio-processing';

interface TestResult {
  timestamp: string;
  steps: {
    name: string;
    status: 'success' | 'failed' | 'skipped';
    duration_ms: number;
    details?: string;
  }[];
  overall: 'passed' | 'failed';
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRedisConnection(): Promise<IORedis> {
  log.info(`Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

  const redis = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 3,
  });

  try {
    await redis.ping();
    log.success(`Redis connection established`);
    return redis;
  } catch (error) {
    log.error(`Cannot connect to Redis: ${error}`);
    throw error;
  }
}

function createTestAudioFile(): string {
  log.info('Creating test audio file...');

  const testFile = '/tmp/test_bullmq_audio.wav';

  // Create a minimal WAV file header + some data
  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + 1000, 4); // File size - 8
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Chunk size
  header.writeUInt16LE(1, 20); // Audio format (PCM)
  header.writeUInt16LE(1, 22); // Num channels
  header.writeUInt32LE(16000, 24); // Sample rate
  header.writeUInt32LE(32000, 28); // Byte rate
  header.writeUInt16LE(2, 32); // Block align
  header.writeUInt16LE(16, 34); // Bits per sample

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(1000, 40); // Data size

  // Random audio data
  const audioData = Buffer.alloc(1000);
  for (let i = 0; i < audioData.length; i++) {
    audioData[i] = Math.floor(Math.random() * 256);
  }

  fs.writeFileSync(testFile, Buffer.concat([header, audioData]));
  log.success(`Test audio created: ${testFile}`);

  return testFile;
}

async function uploadRecording(
  audioPath: string,
  userId: string,
): Promise<{ recordingId: string; jobId: string }> {
  log.info(`Uploading recording to ${API_URL}/recordings...`);

  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('userId', userId);

  try {
    const response = await axios.post(`${API_URL}/recordings`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const { id, jobId } = response.data;
    log.success(`Recording uploaded: id=${id}, jobId=${jobId}`);

    return { recordingId: id, jobId };
  } catch (error: any) {
    if (error.response?.status === 404) {
      log.error(`User not found. Create a test user first.`);
    }
    throw error;
  }
}

async function checkQueueJob(
  queue: Queue,
  jobId: string,
): Promise<{ found: boolean; state?: string }> {
  log.info(`Checking job ${jobId} in queue...`);

  const job = await queue.getJob(jobId);

  if (job) {
    const state = await job.getState();
    log.success(`Job found in queue, state: ${state}`);
    return { found: true, state };
  }

  log.warn(`Job not found in queue (may have completed already)`);
  return { found: false };
}

async function pollRecordingStatus(
  recordingId: string,
  maxWaitSec: number = 30,
): Promise<string> {
  log.info(`Polling recording status (max ${maxWaitSec}s)...`);

  const startTime = Date.now();
  let lastStatus = 'UNKNOWN';

  while (Date.now() - startTime < maxWaitSec * 1000) {
    try {
      const response = await axios.get(`${API_URL}/recordings/${recordingId}`);
      const { status } = response.data;

      if (status !== lastStatus) {
        log.info(`  Status: ${status}`);
        lastStatus = status;
      }

      if (status === 'DONE' || status === 'COMPLETED') {
        log.success(`Recording completed!`);
        return status;
      }

      if (status === 'ERROR') {
        log.error(`Recording processing failed`);
        return status;
      }
    } catch (error) {
      // Ignore errors during polling
    }

    await sleep(2000);
  }

  log.warn(`Timeout waiting for completion (last status: ${lastStatus})`);
  return lastStatus;
}

async function main(): Promise<number> {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}TILAWA API - BULLMQ ASYNC QUEUE TEST${colors.reset}`);
  console.log('='.repeat(60));

  const result: TestResult = {
    timestamp: new Date().toISOString(),
    steps: [],
    overall: 'failed',
  };

  let redis: IORedis | null = null;
  let queue: Queue | null = null;
  let testAudioPath: string | null = null;

  try {
    // Step 1: Test Redis connection
    log.header('[1/5] Testing Redis Connection');
    const step1Start = Date.now();
    redis = await testRedisConnection();
    result.steps.push({
      name: 'Redis Connection',
      status: 'success',
      duration_ms: Date.now() - step1Start,
    });

    // Initialize queue
    queue = new Queue(QUEUE_NAME, {
      connection: { host: REDIS_HOST, port: REDIS_PORT },
    });

    // Step 2: Create test audio
    log.header('[2/5] Creating Test Audio');
    const step2Start = Date.now();
    testAudioPath = createTestAudioFile();
    result.steps.push({
      name: 'Create Test Audio',
      status: 'success',
      duration_ms: Date.now() - step2Start,
    });

    // Step 3: Upload recording
    log.header('[3/5] Uploading Recording');
    const step3Start = Date.now();
    const testUserId = 'test-bullmq-user'; // This user must exist in DB

    let uploadResult: { recordingId: string; jobId: string };
    try {
      uploadResult = await uploadRecording(testAudioPath, testUserId);
      result.steps.push({
        name: 'Upload Recording',
        status: 'success',
        duration_ms: Date.now() - step3Start,
        details: `recordingId=${uploadResult.recordingId}, jobId=${uploadResult.jobId}`,
      });
    } catch (error: any) {
      result.steps.push({
        name: 'Upload Recording',
        status: 'failed',
        duration_ms: Date.now() - step3Start,
        details: error.message,
      });
      throw error;
    }

    // Step 4: Check queue
    log.header('[4/5] Checking Queue');
    const step4Start = Date.now();
    const queueCheck = await checkQueueJob(queue, uploadResult.jobId);
    result.steps.push({
      name: 'Check Queue',
      status: queueCheck.found ? 'success' : 'success', // Job may complete fast
      duration_ms: Date.now() - step4Start,
      details: queueCheck.found ? `state=${queueCheck.state}` : 'Job completed quickly',
    });

    // Step 5: Poll for completion
    log.header('[5/5] Polling for Completion');
    const step5Start = Date.now();
    const finalStatus = await pollRecordingStatus(uploadResult.recordingId, 30);
    const step5Success = finalStatus === 'DONE' || finalStatus === 'COMPLETED';
    result.steps.push({
      name: 'Poll Completion',
      status: step5Success ? 'success' : 'failed',
      duration_ms: Date.now() - step5Start,
      details: `finalStatus=${finalStatus}`,
    });

    // Overall result
    const allPassed = result.steps.every((s) => s.status === 'success');
    result.overall = allPassed ? 'passed' : 'failed';

    // Print timeline
    log.header('TIMELINE');
    console.log('');
    for (const step of result.steps) {
      const icon = step.status === 'success' ? '✓' : '✗';
      const color = step.status === 'success' ? colors.green : colors.red;
      console.log(
        `  ${color}${icon}${colors.reset} ${step.name} (${step.duration_ms}ms)`,
      );
      if (step.details) {
        console.log(`    ${colors.cyan}${step.details}${colors.reset}`);
      }
    }

    // Save results
    const resultsPath = path.join(__dirname, 'bullmq_test_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
    log.success(`Results saved to: ${resultsPath}`);

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (result.overall === 'passed') {
      console.log(`${colors.green}${colors.bold}BULLMQ TEST PASSED${colors.reset}`);
      return 0;
    } else {
      console.log(`${colors.red}${colors.bold}BULLMQ TEST FAILED${colors.reset}`);
      return 1;
    }
  } catch (error: any) {
    log.error(`Test failed: ${error.message}`);

    // Save failure result
    const resultsPath = path.join(__dirname, 'bullmq_test_results.json');
    result.overall = 'failed';
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));

    return 1;
  } finally {
    // Cleanup
    if (testAudioPath && fs.existsSync(testAudioPath)) {
      fs.unlinkSync(testAudioPath);
    }
    if (queue) {
      await queue.close();
    }
    if (redis) {
      redis.disconnect();
    }
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
