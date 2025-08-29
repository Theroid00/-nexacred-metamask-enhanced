#!/usr/bin/env python3
"""
Test script to verify IBM API key and Granite model access.
This script will help you verify your IBM credentials and model availability.
"""

import sys
import os
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# Load environment variables
load_dotenv()

console = Console()

def test_credentials():
    """Test if credentials are properly configured."""
    console.print("\n[bold blue]🔐 Testing IBM Credentials Configuration[/bold blue]\n")
    
    api_key = os.getenv("IBM_API_KEY")
    project_id = os.getenv("IBM_PROJECT_ID") 
    url = os.getenv("IBM_URL", "https://us-south.ml.cloud.ibm.com")
    
    issues = []
    
    if not api_key or api_key == "your_ibm_api_key_here":
        issues.append("❌ IBM_API_KEY not set or using placeholder")
    else:
        console.print(f"✅ IBM_API_KEY: Found (length: {len(api_key)} chars)")
        
    if not project_id or project_id == "your_ibm_project_id_here":
        issues.append("❌ IBM_PROJECT_ID not set or using placeholder")
    else:
        console.print(f"✅ IBM_PROJECT_ID: {project_id}")
        
    console.print(f"✅ IBM_URL: {url}")
    
    if issues:
        console.print(Panel("\n".join(issues), title="❌ Configuration Issues", style="red"))
        return False
    else:
        console.print(Panel("✅ All credentials configured!", title="✅ Configuration OK", style="green"))
        return True

def test_ibm_connection():
    """Test connection to IBM watsonx.ai and model access."""
    console.print("\n[bold blue]🔌 Testing IBM API Connection[/bold blue]\n")
    
    try:
        from ibm_watson_machine_learning import APIClient
        from ibm_watson_machine_learning.foundation_models import Model
        
        # Set up credentials
        credentials = {
            "url": os.getenv("IBM_URL", "https://us-south.ml.cloud.ibm.com"),
            "apikey": os.getenv("IBM_API_KEY")
        }
        
        # Test API client connection
        console.print("🔗 Creating API client...")
        client = APIClient(credentials)
        
        # Set project
        project_id = os.getenv("IBM_PROJECT_ID")
        console.print(f"📁 Setting project: {project_id}")
        client.set.default_project(project_id)
        
        console.print("✅ API connection successful!")
        return client
        
    except Exception as e:
        console.print(f"❌ API connection failed: {str(e)}")
        
        # Provide specific error guidance
        error_str = str(e).lower()
        if "unauthorized" in error_str or "401" in error_str:
            console.print(Panel(
                "🔑 Authentication Error!\n\n"
                "Your API key might be:\n"
                "• Invalid or expired\n"
                "• Not properly copied\n"
                "• Missing required permissions\n\n"
                "Please verify your API key in IBM Cloud.",
                title="❌ Authentication Issue",
                style="red"
            ))
        elif "project" in error_str or "404" in error_str:
            console.print(Panel(
                "📁 Project Error!\n\n"
                "Your Project ID might be:\n"
                "• Invalid or doesn't exist\n"
                "• Not accessible with your API key\n"
                "• From wrong service (use watsonx.ai project)\n\n"
                "Please verify your Project ID in watsonx.ai.",
                title="❌ Project Issue", 
                style="red"
            ))
        
        return None

def test_granite_models(client):
    """Test availability of Granite models."""
    console.print("\n[bold blue]🤖 Testing Granite Model Access[/bold blue]\n")
    
    if not client:
        console.print("❌ Cannot test models - no API connection")
        return False
    
    try:
        # Get available foundation models
        console.print("📋 Fetching available models...")
        models_info = client.foundation_models.get_details()
        available_models = models_info.get('resources', [])
        
        # Filter for Granite models
        granite_models = []
        for model in available_models:
            model_id = model.get('model_id', '')
            if 'granite' in model_id.lower():
                granite_models.append({
                    'id': model_id,
                    'name': model.get('name', 'Unknown'),
                    'provider': model.get('provider', 'Unknown')
                })
        
        if granite_models:
            console.print(f"✅ Found {len(granite_models)} Granite model(s)!")
            
            # Create table of available Granite models
            table = Table(title="Available IBM Granite Models")
            table.add_column("Model ID", style="cyan")
            table.add_column("Name", style="green")
            table.add_column("Provider", style="yellow")
            
            for model in granite_models:
                table.add_row(model['id'], model['name'], model['provider'])
            
            console.print(table)
            
            # Test the specific model we want to use
            target_model = "ibm/granite-8b-code-instruct"
            model_found = any(model['id'] == target_model for model in granite_models)
            
            if model_found:
                console.print(f"✅ Target model '{target_model}' is available!")
                return True
            else:
                console.print(f"⚠️ Target model '{target_model}' not found")
                console.print("Available alternatives:")
                for model in granite_models:
                    console.print(f"  • {model['id']}")
                return False
        else:
            console.print("❌ No Granite models found!")
            console.print("\nThis could mean:")
            console.print("• Your account doesn't have access to Granite models")
            console.print("• You need to enable watsonx.ai foundation models")
            console.print("• Your project doesn't have the right permissions")
            return False
            
    except Exception as e:
        console.print(f"❌ Error fetching models: {str(e)}")
        return False

def test_model_generation(client):
    """Test actual model generation."""
    console.print("\n[bold blue]🧪 Testing Model Generation[/bold blue]\n")
    
    if not client:
        console.print("❌ Cannot test generation - no API connection")
        return False
    
    try:
        from ibm_watson_machine_learning.foundation_models import Model
        from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams
        
        # Try to create a model instance
        model_id = "ibm/granite-3-3-8b-instruct"  # Use the model from your watsonx.ai
        console.print(f"🤖 Testing model: {model_id}")
        
        generation_params = {
            GenParams.MAX_NEW_TOKENS: 50,
            GenParams.TEMPERATURE: 0.7,
            GenParams.TOP_P: 0.85,
            GenParams.TOP_K: 40
        }
        
        model = Model(
            model_id=model_id,
            params=generation_params,
            credentials={
                "url": os.getenv("IBM_URL"),
                "apikey": os.getenv("IBM_API_KEY")
            },
            project_id=os.getenv("IBM_PROJECT_ID") or ""
        )
        
        # Test generation
        console.print("⚡ Testing text generation...")
        test_prompt = "What is artificial intelligence?"
        response = model.generate_text(prompt=test_prompt)
        
        # Convert response to string if needed
        response_text = str(response)
        
        console.print("✅ Text generation successful!")
        console.print(Panel(
            f"Test Prompt: {test_prompt}\n\n"
            f"Generated Response: {response_text[:200]}{'...' if len(response_text) > 200 else ''}",
            title="🤖 Generation Test Result",
            style="green"
        ))
        
        return True
        
    except Exception as e:
        console.print(f"❌ Generation test failed: {str(e)}")
        
        error_str = str(e).lower()
        if "model" in error_str and "not found" in error_str:
            console.print(Panel(
                "🤖 Model Access Error!\n\n"
                "The Granite model might not be available in your region or account.\n"
                "Try checking available models or contact IBM support.",
                title="❌ Model Access Issue",
                style="red"
            ))
        
        return False

def main():
    """Main test function."""
    console.print(Panel(
        "🧪 IBM Granite Model Access Test\n\n"
        "This script will verify:\n"
        "• IBM API credentials configuration\n"
        "• Connection to IBM watsonx.ai\n"
        "• Granite model availability\n"
        "• Text generation capability",
        title="🚀 IBM Granite Access Verification",
        style="blue"
    ))
    
    # Test 1: Credentials
    if not test_credentials():
        console.print("\n❌ Please fix configuration issues before proceeding.")
        return
    
    # Test 2: Connection
    client = test_ibm_connection()
    if not client:
        console.print("\n❌ Cannot proceed without API connection.")
        return
    
    # Test 3: Model availability
    models_available = test_granite_models(client)
    if not models_available:
        console.print("\n⚠️ Model access issues detected.")
    
    # Test 4: Generation test
    generation_works = test_model_generation(client)
    
    # Final summary
    console.print("\n" + "="*60)
    if models_available and generation_works:
        console.print(Panel(
            "🎉 SUCCESS! Your IBM API key has full access to Granite models!\n\n"
            "✅ Credentials configured correctly\n"
            "✅ API connection working\n"
            "✅ Granite models available\n"
            "✅ Text generation working\n\n"
            "Your RAG chatbot should work perfectly!",
            title="🏆 All Tests Passed",
            style="green"
        ))
    else:
        console.print(Panel(
            "⚠️ Some issues detected with your IBM setup.\n\n"
            "Please review the errors above and:\n"
            "• Verify your API key permissions\n"
            "• Check your watsonx.ai project access\n"
            "• Ensure Granite models are enabled\n"
            "• Contact IBM support if needed",
            title="❌ Issues Detected",
            style="yellow"
        ))

if __name__ == "__main__":
    main()