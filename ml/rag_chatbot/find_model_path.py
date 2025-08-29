#!/usr/bin/env python3
"""
Find IBM Granite Model Path
===========================

Script to locate the exact path of the IBM Granite model cache on your system.
"""

import os
from pathlib import Path

def find_granite_model_path():
    """Find the IBM Granite model cache path on the system."""

    # Common cache locations
    possible_paths = []

    # 1. Default HuggingFace cache
    hf_home = os.environ.get('HF_HOME')
    if hf_home:
        possible_paths.append(Path(hf_home) / "hub" / "models--ibm-granite--granite-3.3-2b-instruct")

    # 2. Transformers cache
    transformers_cache = os.environ.get('TRANSFORMERS_CACHE')
    if transformers_cache:
        possible_paths.append(Path(transformers_cache) / "models--ibm-granite--granite-3.3-2b-instruct")

    # 3. Default Windows location
    user_home = Path.home()
    default_cache = user_home / ".cache" / "huggingface" / "hub" / "models--ibm-granite--granite-3.3-2b-instruct"
    possible_paths.append(default_cache)

    # 4. Alternative Windows location
    alt_cache = user_home / ".cache" / "torch" / "hub"
    possible_paths.append(alt_cache)

    print("🔍 Searching for IBM Granite model cache...")
    print(f"User home: {user_home}")
    print()

    found_paths = []

    for path in possible_paths:
        if path.exists():
            print(f"✅ Found: {path}")
            found_paths.append(path)

            # Check for model files
            if path.is_dir():
                model_files = list(path.glob("**/*.bin")) + list(path.glob("**/*.safetensors"))
                if model_files:
                    print(f"   📁 Contains {len(model_files)} model files")
                else:
                    print("   📁 Directory exists but no model files found")
        else:
            print(f"❌ Not found: {path}")

    print()

    if found_paths:
        print(f"🎯 IBM Granite model cached at:")
        for path in found_paths:
            print(f"   {path}")
    else:
        print("⚠️ IBM Granite model not yet downloaded/cached")
        print("   The model will be downloaded on first use to:")
        print(f"   {default_cache}")

    print()
    print("💡 To manually set cache location, use environment variables:")
    print("   set HF_HOME=C:\\your\\custom\\path")
    print("   set TRANSFORMERS_CACHE=C:\\your\\custom\\path")

if __name__ == "__main__":
    find_granite_model_path()
