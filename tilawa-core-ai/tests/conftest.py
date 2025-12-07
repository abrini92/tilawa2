"""Pytest configuration and fixtures for Tilawa Core AI tests."""

import io
import os
import sys
import wave
import numpy as np
import pytest
from fastapi.testclient import TestClient

# Ensure project root is on sys.path so "app" package is importable
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """FastAPI test client fixture."""
    return TestClient(app)


@pytest.fixture
def sample_audio_bytes() -> bytes:
    """Generate valid WAV audio bytes for testing."""
    sample_rate = 16000
    duration = 1.0  # 1 second
    frequency = 440  # A4 note
    
    t = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float32)
    samples = (np.sin(2 * np.pi * frequency * t) * 0.5).astype(np.float32)
    
    # Convert to 16-bit PCM
    samples_int16 = (samples * 32767).astype(np.int16)
    
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(samples_int16.tobytes())
    
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def noisy_audio_bytes() -> bytes:
    """Generate noisy WAV audio bytes for testing."""
    sample_rate = 16000
    duration = 1.0
    
    # Signal + noise
    t = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float32)
    signal = np.sin(2 * np.pi * 440 * t) * 0.3
    noise = np.random.randn(len(t)).astype(np.float32) * 0.2
    samples = (signal + noise).astype(np.float32)
    
    samples_int16 = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(samples_int16.tobytes())
    
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def silence_audio_bytes() -> bytes:
    """Generate silent WAV audio bytes for testing."""
    sample_rate = 16000
    duration = 1.0
    
    samples = np.zeros(int(sample_rate * duration), dtype=np.float32)
    samples_int16 = (samples * 32767).astype(np.int16)
    
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(samples_int16.tobytes())
    
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def long_audio_bytes() -> bytes:
    """Generate 10-second WAV audio for testing longer files."""
    sample_rate = 16000
    duration = 10.0
    
    t = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float32)
    samples = (np.sin(2 * np.pi * 440 * t) * 0.5).astype(np.float32)
    samples_int16 = (samples * 32767).astype(np.int16)
    
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(samples_int16.tobytes())
    
    buffer.seek(0)
    return buffer.getvalue()
