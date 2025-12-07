import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class CoreAiService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.CORE_AI_BASE_URL || 'http://127.0.0.1:8000',
      timeout: 30_000,
    });
  }

  async calibrate(recitationFiles: Buffer[], noiseFile?: Buffer): Promise<any> {
    const form = new FormData();

    recitationFiles.forEach((buf, idx) => {
      form.append('files', buf, {
        filename: `recitation_${idx}.wav`,
        contentType: 'audio/wav',
      });
    });

    if (noiseFile) {
      form.append('noise_file', noiseFile, {
        filename: 'noise.wav',
        contentType: 'audio/wav',
      });
    }

    const res = await this.client.post('/audio/calibrate', form, {
      headers: form.getHeaders(),
    });

    return res.data;
  }

  async enhanceAdaptive(audio: Buffer, _noiseProfile?: any): Promise<Buffer> {
    // Currently delegates to /audio/enhance-adaptive.
    const form = new FormData();
    form.append('file', audio, {
      filename: 'recording.wav',
      contentType: 'audio/wav',
    });

    const res = await this.client.post('/audio/enhance-adaptive', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
    });

    return Buffer.from(res.data);
  }

  async isQuran(audio: Buffer): Promise<any> {
    const form = new FormData();
    form.append('file', audio, {
      filename: 'recording.wav',
      contentType: 'audio/wav',
    });

    const res = await this.client.post('/quran/is-quran', form, {
      headers: form.getHeaders(),
    });

    return res.data;
  }

  async alignQuran(audio: Buffer): Promise<any> {
    const form = new FormData();
    form.append('file', audio, {
      filename: 'recording.wav',
      contentType: 'audio/wav',
    });

    const res = await this.client.post('/quran/align', form, {
      headers: form.getHeaders(),
    });

    return res.data;
  }
}
