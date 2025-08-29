#!/usr/bin/env python3
"""
Extract Project ID from current watsonx.ai session
"""

from dotenv import load_dotenv
import os

load_dotenv()

print("Current configuration:")
print(f"API Key: {'✅ Set' if os.getenv('IBM_API_KEY') else '❌ Missing'}")
print(f"Project ID: {os.getenv('IBM_PROJECT_ID', 'Not set')}")
print(f"URL: {os.getenv('IBM_URL')}")

print("\nPlease update your .env file with the complete Project ID from watsonx.ai")
print("The Project ID should be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")