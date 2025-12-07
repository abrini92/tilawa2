#!/usr/bin/env python3
"""Benchmark script comparing faster-whisper vs openai-whisper performance.

Generates a 5-minute test audio file and measures transcription time for each model.
Outputs results to benchmark_results.json.

Usage:
    python scripts/benchmark_whisper.py
"""

import json
import os
import sys
import time
import wave
import struct
import math
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from colorama import Fore, Style, init
    init(autoreset=True)
except ImportError:
    # Fallback if colorama not installed
    class Fore:
        GREEN = RED = YELLOW = CYAN = RESET = ""
    class Style:
        BRIGHT = RESET_ALL = ""


def generate_sine_wave(
    filename: str,
    duration_sec: float = 300.0,  # 5 minutes
    sample_rate: int = 16000,
    frequency: float = 440.0,
) -> str:
    """Generate a mono WAV file with a sine wave."""
    print(f"{Fore.CYAN}Generating {duration_sec}s test audio file...{Style.RESET_ALL}")
    
    num_samples = int(duration_sec * sample_rate)
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = i / sample_rate
            # Add some variation to make it more speech-like
            value = int(32767 * 0.5 * math.sin(2 * math.pi * frequency * t))
            wav_file.writeframes(struct.pack('<h', value))
    
    file_size = os.path.getsize(filename)
    print(f"{Fore.GREEN}✓ Generated: {filename} ({file_size / 1024 / 1024:.2f} MB){Style.RESET_ALL}")
    return filename


def benchmark_faster_whisper(audio_path: str) -> Dict[str, Any]:
    """Benchmark faster-whisper transcription."""
    result = {
        "model": "faster-whisper",
        "status": "not_installed",
        "time_sec": None,
        "rtf": None,
        "error": None,
    }
    
    try:
        from faster_whisper import WhisperModel
        
        print(f"{Fore.CYAN}Loading faster-whisper model (small, int8)...{Style.RESET_ALL}")
        load_start = time.perf_counter()
        model = WhisperModel("small", device="cpu", compute_type="int8")
        load_time = time.perf_counter() - load_start
        print(f"{Fore.GREEN}✓ Model loaded in {load_time:.2f}s{Style.RESET_ALL}")
        
        # Get audio duration
        with wave.open(audio_path, 'r') as wav:
            frames = wav.getnframes()
            rate = wav.getframerate()
            audio_duration = frames / rate
        
        print(f"{Fore.CYAN}Transcribing with faster-whisper...{Style.RESET_ALL}")
        start_time = time.perf_counter()
        
        segments, info = model.transcribe(audio_path, language="ar", beam_size=5)
        # Consume the generator to complete transcription
        transcript = " ".join(segment.text for segment in segments)
        
        elapsed = time.perf_counter() - start_time
        rtf = elapsed / audio_duration
        
        result["status"] = "success"
        result["time_sec"] = round(elapsed, 2)
        result["rtf"] = round(rtf, 4)
        result["audio_duration"] = round(audio_duration, 2)
        result["transcript_length"] = len(transcript)
        
        print(f"{Fore.GREEN}✓ faster-whisper: {elapsed:.2f}s (RTF: {rtf:.4f}){Style.RESET_ALL}")
        
    except ImportError:
        result["error"] = "faster-whisper not installed"
        print(f"{Fore.YELLOW}⚠ faster-whisper not installed{Style.RESET_ALL}")
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        print(f"{Fore.RED}✗ faster-whisper error: {e}{Style.RESET_ALL}")
    
    return result


def benchmark_openai_whisper(audio_path: str) -> Dict[str, Any]:
    """Benchmark openai-whisper transcription."""
    result = {
        "model": "openai-whisper",
        "status": "not_installed",
        "time_sec": None,
        "rtf": None,
        "error": None,
    }
    
    try:
        import whisper
        
        print(f"{Fore.CYAN}Loading openai-whisper model (small)...{Style.RESET_ALL}")
        load_start = time.perf_counter()
        model = whisper.load_model("small")
        load_time = time.perf_counter() - load_start
        print(f"{Fore.GREEN}✓ Model loaded in {load_time:.2f}s{Style.RESET_ALL}")
        
        # Get audio duration
        with wave.open(audio_path, 'r') as wav:
            frames = wav.getnframes()
            rate = wav.getframerate()
            audio_duration = frames / rate
        
        print(f"{Fore.CYAN}Transcribing with openai-whisper...{Style.RESET_ALL}")
        start_time = time.perf_counter()
        
        result_whisper = model.transcribe(audio_path, language="ar")
        transcript = result_whisper.get("text", "")
        
        elapsed = time.perf_counter() - start_time
        rtf = elapsed / audio_duration
        
        result["status"] = "success"
        result["time_sec"] = round(elapsed, 2)
        result["rtf"] = round(rtf, 4)
        result["audio_duration"] = round(audio_duration, 2)
        result["transcript_length"] = len(transcript)
        
        print(f"{Fore.GREEN}✓ openai-whisper: {elapsed:.2f}s (RTF: {rtf:.4f}){Style.RESET_ALL}")
        
    except ImportError:
        result["error"] = "openai-whisper not installed"
        print(f"{Fore.YELLOW}⚠ openai-whisper not installed{Style.RESET_ALL}")
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        print(f"{Fore.RED}✗ openai-whisper error: {e}{Style.RESET_ALL}")
    
    return result


def print_results_table(results: List[Dict[str, Any]]) -> None:
    """Print a formatted comparison table."""
    print("\n" + "=" * 60)
    print(f"{Style.BRIGHT}BENCHMARK RESULTS{Style.RESET_ALL}")
    print("=" * 60)
    print(f"{'Model':<20} {'Time (sec)':<12} {'RTF':<10} {'Status':<15}")
    print("-" * 60)
    
    for r in results:
        model = r["model"]
        time_str = f"{r['time_sec']:.2f}" if r["time_sec"] else "N/A"
        rtf_str = f"{r['rtf']:.4f}" if r["rtf"] else "N/A"
        
        if r["status"] == "success":
            status = f"{Fore.GREEN}✓ PASSED{Style.RESET_ALL}"
        elif r["status"] == "not_installed":
            status = f"{Fore.YELLOW}⚠ NOT INSTALLED{Style.RESET_ALL}"
        else:
            status = f"{Fore.RED}✗ FAILED{Style.RESET_ALL}"
        
        print(f"{model:<20} {time_str:<12} {rtf_str:<10} {status}")
    
    print("=" * 60)
    
    # Comparison if both succeeded
    faster = next((r for r in results if r["model"] == "faster-whisper" and r["status"] == "success"), None)
    openai = next((r for r in results if r["model"] == "openai-whisper" and r["status"] == "success"), None)
    
    if faster and openai and faster["time_sec"] and openai["time_sec"]:
        speedup = openai["time_sec"] / faster["time_sec"]
        print(f"\n{Fore.CYAN}faster-whisper is {speedup:.2f}x faster than openai-whisper{Style.RESET_ALL}")


def main() -> int:
    """Main benchmark function."""
    print(f"\n{Style.BRIGHT}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Style.BRIGHT}TILAWA WHISPER BENCHMARK{Style.RESET_ALL}")
    print(f"{Style.BRIGHT}{'=' * 60}{Style.RESET_ALL}\n")
    
    # Setup paths
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    test_audio = script_dir / "test_audio_5min.wav"
    results_file = script_dir / "benchmark_results.json"
    
    # Generate test audio (5 minutes)
    generate_sine_wave(str(test_audio), duration_sec=300.0)
    
    # Run benchmarks
    results = []
    
    print(f"\n{Style.BRIGHT}--- faster-whisper ---{Style.RESET_ALL}")
    results.append(benchmark_faster_whisper(str(test_audio)))
    
    print(f"\n{Style.BRIGHT}--- openai-whisper ---{Style.RESET_ALL}")
    results.append(benchmark_openai_whisper(str(test_audio)))
    
    # Print results table
    print_results_table(results)
    
    # Save results to JSON
    output = {
        "timestamp": datetime.now().isoformat(),
        "audio_duration_sec": 300.0,
        "results": results,
    }
    
    with open(results_file, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n{Fore.GREEN}✓ Results saved to: {results_file}{Style.RESET_ALL}")
    
    # Cleanup test audio
    if test_audio.exists():
        test_audio.unlink()
        print(f"{Fore.GREEN}✓ Cleaned up test audio file{Style.RESET_ALL}")
    
    # Exit code: 0 if at least one model works
    success_count = sum(1 for r in results if r["status"] == "success")
    if success_count > 0:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}BENCHMARK PASSED ({success_count}/2 models working){Style.RESET_ALL}")
        return 0
    else:
        print(f"\n{Fore.RED}{Style.BRIGHT}BENCHMARK FAILED (no models working){Style.RESET_ALL}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
