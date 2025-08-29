#!/usr/bin/env python3
"""
Simple test of IBM Granite without MongoDB dependency
"""

import sys
import os
from dotenv import load_dotenv
from rich.console import Console

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()
console = Console()

def test_granite_only():
    """Test IBM Granite without MongoDB."""
    
    console.print("🤖 Testing IBM Granite AI (without MongoDB)")
    
    try:
        from ibm_client import IBMGraniteClient
        
        console.print("✅ Importing IBM Granite client...")
        
        # Initialize the client
        console.print("🔗 Initializing IBM Granite client...")
        client = IBMGraniteClient()
        
        console.print("✅ IBM Granite client initialized!")
        
        # Test generation
        console.print("⚡ Testing text generation...")
        test_prompt = "What is artificial intelligence?"
        
        response = client.generate_response(test_prompt, None)
        
        console.print("✅ Text generation successful!")
        console.print(f"\n🤖 **Generated Response:**")
        console.print(f"{response}")
        
        return True
        
    except Exception as e:
        console.print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_granite_only()
    
    if success:
        console.print("\n🎉 **IBM Granite is working perfectly!**")
        console.print("📝 Next step: Set up MongoDB Atlas for full RAG functionality")
    else:
        console.print("\n❌ Issues with IBM Granite setup")