#!/usr/bin/env python3
"""
Test script for IBM Granite on Replicate integration.
This script tests the configuration and basic functionality.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from replicate_client import ReplicateGraniteClient

# Load environment variables
load_dotenv()

def test_configuration():
    """Test configuration validation."""
    print("🔧 Testing Configuration...")
    
    is_valid, missing_keys = Config.validate_config()
    
    if is_valid:
        print("✅ Configuration is valid!")
        print(f"   API Token: {Config.REPLICATE_API_TOKEN[:10]}...")
        print(f"   Model: {Config.REPLICATE_MODEL}")
        return True
    else:
        print("❌ Configuration validation failed!")
        print(f"   Missing keys: {missing_keys}")
        return False

def test_replicate_granite_client():
    """Test Replicate Granite client initialization and basic functionality."""
    print("\n🤖 Testing Replicate Granite Client...")
    
    try:
        # Initialize client
        client = ReplicateGraniteClient()
        print("✅ Client initialized successfully!")
        
        # Health check
        print("🔍 Performing health check...")
        if client.health_check():
            print("✅ Health check passed!")
        else:
            print("❌ Health check failed!")
            return False
        
        # Test simple generation
        print("💬 Testing text generation...")
        response = client.generate_response("What is artificial intelligence?")
        
        if response and len(response.strip()) > 0:
            print("✅ Text generation successful!")
            print(f"   Response length: {len(response)} characters")
            print(f"   Response preview: {response[:100]}...")
            return True
        else:
            print("❌ Text generation failed or returned empty response!")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Replicate Granite client: {e}")
        return False

def test_available_models():
    """Test getting available Granite models."""
    print("\n📋 Testing Available Models...")
    
    try:
        client = ReplicateGraniteClient()
        models = client.get_available_granite_models()
        
        print("✅ Available IBM Granite models:")
        for model in models:
            print(f"   • {model['model_id']}: {model['description']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error getting available models: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 IBM Granite on Replicate Integration Test")
    print("=" * 50)
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Run tests
    tests = [
        test_configuration,
        test_replicate_granite_client,
        test_available_models
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your IBM Granite on Replicate integration is working!")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)