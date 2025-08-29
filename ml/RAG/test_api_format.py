#!/usr/bin/env python3
"""
Test different API key formats for IBM watsonx.ai
"""

import os
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()
console = Console()

def test_api_key_format():
    """Test different API key formats."""
    
    current_key = os.getenv("IBM_API_KEY")
    console.print(f"Current API Key: {current_key}")
    
    # Test if key has ApiKey- prefix
    if current_key and current_key.startswith("ApiKey-"):
        # Extract just the UUID part
        key_without_prefix = current_key.replace("ApiKey-", "")
        console.print(f"Key without prefix: {key_without_prefix}")
        
        console.print("\n🔧 Recommendation:")
        console.print("Try removing the 'ApiKey-' prefix from your API key")
        console.print("Update your .env file with just the UUID part:")
        console.print(f"IBM_API_KEY={key_without_prefix}")
        
        return key_without_prefix
    else:
        console.print("API key doesn't have ApiKey- prefix")
        return current_key

if __name__ == "__main__":
    test_api_key_format()