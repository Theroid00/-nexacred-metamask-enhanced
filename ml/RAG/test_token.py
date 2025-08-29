"""
Simple test script to verify Replicate API token.
"""

import replicate
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_replicate_token():
    """Test if the Replicate API token is valid."""
    
    # Get token from environment
    token = os.getenv("REPLICATE_API_TOKEN")
    print(f"Token from .env: {token[:10]}...{token[-10:] if token else 'None'}")
    
    if not token:
        print("❌ No REPLICATE_API_TOKEN found in environment variables")
        return False
    
    try:
        # Set the API token
        replicate.api_token = token
        
        # Try to list models (this requires authentication)
        print("🔍 Testing token by listing models...")
        
        # This should work if the token is valid
        models = list(replicate.models.list())[:5]  # Just get first 5
        print(f"✅ Token is valid! Found {len(models)} models")
        
        # Test the specific IBM Granite model
        model_name = "ibm-granite/granite-3.3-8b-instruct"
        print(f"🔍 Testing access to {model_name}...")
        
        model = replicate.models.get(model_name)
        print(f"✅ Model access confirmed: {model.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Token validation failed: {e}")
        print(f"Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Replicate API Token...")
    print("=" * 50)
    test_replicate_token()
