"""Package bootstrap for standalone MCP/hook processes and local tests.

Crew's gateway already supplies a private package and its own reload lifecycle;
HTTP entry points use that directly. No global sys.path or custom import hooks.
"""
from __future__ import annotations
import hashlib
import importlib
import importlib.machinery
import importlib.util
import sys
from pathlib import Path


def load(name: str):
    root = Path(__file__).resolve().parent
    package_name = "_crew_calendar_cli_" + hashlib.sha256(str(root).encode()).hexdigest()[:16]
    if package_name not in sys.modules:
        package = importlib.util.module_from_spec(importlib.machinery.ModuleSpec(package_name, None, is_package=True))
        package.__path__ = [str(root)]
        sys.modules[package_name] = package
    return importlib.import_module(f"{package_name}.{name}")
