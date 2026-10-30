"""Test configuration and shared fixtures."""
import sys
from pathlib import Path

# Ensure backend/ is on sys.path so `from app...` imports work
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
