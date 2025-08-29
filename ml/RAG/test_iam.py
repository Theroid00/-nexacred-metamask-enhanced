#!/usr/bin/env python3
"""
Simple IBM Cloud API key validation test
"""

import requests
import os
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()
console = Console()

def test_iam_token():
    """Test getting IAM token directly."""
    
    api_key = os.getenv("IBM_API_KEY")
    
    console.print(f"Testing API Key: {api_key}")
    console.print("Attempting to get IAM token...")
    
    # IBM IAM token endpoint
    url = "https://iam.cloud.ibm.com/identity/token"
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": api_key
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        
        console.print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            console.print("✅ API Key is valid!")
            token_data = response.json()
            console.print(f"Token type: {token_data.get('token_type')}")
            console.print("✅ You can proceed with watsonx.ai setup")
            return True
        else:
            console.print("❌ API Key validation failed")
            console.print(f"Error: {response.text}")
            
            if response.status_code == 400:
                console.print("\n🔧 Possible issues:")
                console.print("• API key is invalid or malformed")
                console.print("• API key has been deleted or expired")
                console.print("• Wrong API key format")
            elif response.status_code == 401:
                console.print("\n🔧 Possible issues:")
                console.print("• API key doesn't exist")
                console.print("• API key is for wrong account")
            
            return False
            
    except Exception as e:
        console.print(f"❌ Error testing API key: {e}")
        return False

if __name__ == "__main__":
    test_iam_token()