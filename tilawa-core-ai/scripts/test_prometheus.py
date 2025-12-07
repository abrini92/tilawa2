#!/usr/bin/env python3
"""Test script to validate Prometheus metrics exposure.

Checks that all required Tilawa metrics are exposed at /metrics endpoint.
Generates a minimal Grafana dashboard JSON.

Usage:
    python scripts/test_prometheus.py

Assumes FastAPI is running on localhost:8000.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Set

import requests

try:
    from colorama import Fore, Style, init
    init(autoreset=True)
except ImportError:
    class Fore:
        GREEN = RED = YELLOW = CYAN = RESET = ""
    class Style:
        BRIGHT = RESET_ALL = ""


# Required metrics to validate
REQUIRED_METRICS = [
    "tilawa_transcription_seconds",
    "tilawa_transcription_realtime_factor",
    "tilawa_quran_alignment_seconds",
    "tilawa_quran_detection_total",
    "tilawa_model_load_seconds",
]

METRICS_URL = "http://localhost:8000/metrics"


def fetch_metrics() -> str:
    """Fetch raw metrics from the /metrics endpoint."""
    print(f"{Fore.CYAN}Fetching metrics from {METRICS_URL}...{Style.RESET_ALL}")
    
    try:
        response = requests.get(METRICS_URL, timeout=10)
        response.raise_for_status()
        print(f"{Fore.GREEN}✓ Metrics endpoint responded (status {response.status_code}){Style.RESET_ALL}")
        return response.text
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}✗ Cannot connect to {METRICS_URL}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}  Make sure FastAPI is running: uvicorn app.main:app --port 8000{Style.RESET_ALL}")
        raise
    except requests.exceptions.HTTPError as e:
        print(f"{Fore.RED}✗ HTTP error: {e}{Style.RESET_ALL}")
        raise


def parse_metric_names(metrics_text: str) -> Set[str]:
    """Extract metric names from Prometheus text format."""
    names = set()
    for line in metrics_text.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Metric line format: metric_name{labels} value
        # or: metric_name value
        if "{" in line:
            name = line.split("{")[0]
        else:
            name = line.split()[0] if line.split() else ""
        if name:
            names.add(name)
    return names


def validate_metrics(metrics_text: str) -> Dict[str, bool]:
    """Check which required metrics are present."""
    found_names = parse_metric_names(metrics_text)
    
    results = {}
    for metric in REQUIRED_METRICS:
        # Check if metric exists (with or without suffix like _bucket, _count, _sum)
        found = any(
            name == metric or name.startswith(f"{metric}_")
            for name in found_names
        )
        results[metric] = found
    
    return results


def print_validation_results(results: Dict[str, bool]) -> None:
    """Print validation results with colored output."""
    print("\n" + "=" * 60)
    print(f"{Style.BRIGHT}PROMETHEUS METRICS VALIDATION{Style.RESET_ALL}")
    print("=" * 60)
    
    for metric, found in results.items():
        if found:
            status = f"{Fore.GREEN}✅ FOUND{Style.RESET_ALL}"
        else:
            status = f"{Fore.RED}❌ MISSING{Style.RESET_ALL}"
        print(f"  {metric:<40} {status}")
    
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    if passed == total:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}ALL METRICS PRESENT ({passed}/{total}){Style.RESET_ALL}")
    else:
        print(f"\n{Fore.RED}{Style.BRIGHT}MISSING METRICS ({passed}/{total} found){Style.RESET_ALL}")


def generate_grafana_dashboard(results: Dict[str, bool]) -> Dict[str, Any]:
    """Generate a minimal Grafana dashboard JSON."""
    panels = []
    grid_y = 0
    
    for i, metric in enumerate(REQUIRED_METRICS):
        panel = {
            "id": i + 1,
            "title": metric.replace("tilawa_", "").replace("_", " ").title(),
            "type": "stat" if "total" in metric else "graph",
            "gridPos": {"x": (i % 2) * 12, "y": grid_y, "w": 12, "h": 8},
            "targets": [
                {
                    "expr": metric if "total" in metric else f"rate({metric}[5m])",
                    "legendFormat": "{{model}}" if "model" in metric else "value",
                }
            ],
            "options": {
                "colorMode": "value",
                "graphMode": "area",
            },
        }
        panels.append(panel)
        if i % 2 == 1:
            grid_y += 8
    
    dashboard = {
        "title": "Tilawa Core AI Metrics",
        "uid": "tilawa-core-ai",
        "version": 1,
        "schemaVersion": 38,
        "refresh": "30s",
        "time": {"from": "now-1h", "to": "now"},
        "panels": panels,
        "templating": {"list": []},
        "annotations": {"list": []},
    }
    
    return dashboard


def main() -> int:
    """Main validation function."""
    print(f"\n{Style.BRIGHT}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Style.BRIGHT}TILAWA PROMETHEUS METRICS TEST{Style.RESET_ALL}")
    print(f"{Style.BRIGHT}{'=' * 60}{Style.RESET_ALL}\n")
    
    script_dir = Path(__file__).parent
    results_file = script_dir / "metrics_validation.json"
    dashboard_file = script_dir / "grafana_dashboard.json"
    
    try:
        # Fetch and validate metrics
        metrics_text = fetch_metrics()
        results = validate_metrics(metrics_text)
        
        # Print results
        print_validation_results(results)
        
        # Generate Grafana dashboard
        dashboard = generate_grafana_dashboard(results)
        with open(dashboard_file, "w") as f:
            json.dump(dashboard, f, indent=2)
        print(f"\n{Fore.GREEN}✓ Grafana dashboard saved to: {dashboard_file}{Style.RESET_ALL}")
        
        # Save validation results
        output = {
            "timestamp": datetime.now().isoformat(),
            "metrics_url": METRICS_URL,
            "results": results,
            "all_passed": all(results.values()),
        }
        with open(results_file, "w") as f:
            json.dump(output, f, indent=2)
        print(f"{Fore.GREEN}✓ Validation results saved to: {results_file}{Style.RESET_ALL}")
        
        # Exit code
        if all(results.values()):
            print(f"\n{Fore.GREEN}{Style.BRIGHT}PROMETHEUS TEST PASSED{Style.RESET_ALL}")
            return 0
        else:
            print(f"\n{Fore.RED}{Style.BRIGHT}PROMETHEUS TEST FAILED{Style.RESET_ALL}")
            return 1
            
    except requests.exceptions.RequestException:
        # Save failure result
        output = {
            "timestamp": datetime.now().isoformat(),
            "metrics_url": METRICS_URL,
            "results": {m: False for m in REQUIRED_METRICS},
            "all_passed": False,
            "error": "Could not connect to metrics endpoint",
        }
        with open(results_file, "w") as f:
            json.dump(output, f, indent=2)
        
        print(f"\n{Fore.RED}{Style.BRIGHT}PROMETHEUS TEST FAILED (connection error){Style.RESET_ALL}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
