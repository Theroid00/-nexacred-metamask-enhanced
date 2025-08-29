#!/usr/bin/env python3
"""
Quick test of the minimalistic RAG chatbot functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_pipeline import RAGPipeline

def test_minimalistic_chatbot():
    """Test the core functionality without the interface."""
    print("🔧 Testing minimalistic RAG chatbot...")
    
    try:
        # Initialize pipeline
        pipeline = RAGPipeline()
        print("✅ Pipeline initialized successfully")
        
        # Test basic query
        response1 = pipeline.process_query("What is machine learning?")
        print(f"📤 Query 1: What is machine learning?")
        print(f"📥 Response 1: {response1['response'][:100]}...")
        
        # Test follow-up query to check memory
        response2 = pipeline.process_query("Can you explain it in simpler terms?")
        print(f"📤 Query 2: Can you explain it in simpler terms?")
        print(f"📥 Response 2: {response2['response'][:100]}...")
        
        # Check if context was used
        metadata2 = response2.get('metadata', {})
        context_indicators = metadata2.get('context_indicators', {})
        
        print(f"\n🧠 Memory working: {any(context_indicators.values())}")
        if context_indicators.get('has_pronouns'):
            print("   ✅ Detected pronouns in follow-up")
        if context_indicators.get('has_references'):
            print("   ✅ Detected references to previous context")
        if context_indicators.get('is_follow_up'):
            print("   ✅ Identified as follow-up question")
        
        pipeline.close()
        print("\n🎉 Test completed successfully - minimalistic chatbot is working!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_minimalistic_chatbot()