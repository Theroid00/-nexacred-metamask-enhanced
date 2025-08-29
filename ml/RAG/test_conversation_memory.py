#!/usr/bin/env python3
"""
Test script for conversation memory functionality.
Tests the conversation context and memory features.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from conversation_memory import ConversationMemory
from replicate_client import ReplicateGraniteClient

# Load environment variables
load_dotenv()

def test_conversation_memory():
    """Test conversation memory functionality."""
    print("🧠 Testing Conversation Memory...")
    
    # Initialize conversation memory
    memory = ConversationMemory(max_history=5)
    
    # Test adding exchanges
    test_exchanges = [
        ("What is machine learning?", "Machine learning is a subset of AI that enables computers to learn from data."),
        ("How does it work?", "It works by training algorithms on data to make predictions or decisions."),
        ("What are the types?", "Main types include supervised, unsupervised, and reinforcement learning."),
        ("Can you explain supervised learning?", "Supervised learning uses labeled data to train models for prediction tasks.")
    ]
    
    print("📝 Adding test conversation exchanges...")
    for user_query, assistant_response in test_exchanges:
        memory.add_exchange(user_query, assistant_response)
        print(f"   Added: '{user_query[:30]}...'")
    
    # Test context retrieval
    print("\n🔍 Testing context retrieval...")
    
    # Test recent context
    recent_context = memory.get_conversation_context(include_last_n=2)
    print(f"Recent context (last 2): {len(recent_context)} characters")
    if recent_context:
        print(f"Preview: {recent_context[:100]}...")
    
    # Test related context
    related_context = memory.find_related_context("Tell me more about machine learning algorithms")
    print(f"Related context: {len(related_context)} characters")
    if related_context:
        print(f"Preview: {related_context[:100]}...")
    
    # Test context indicators
    print("\n🔗 Testing context indicators...")
    test_queries = [
        "What is that?",  # Pronoun
        "Tell me more about it",  # Pronoun + reference
        "Can you explain this again?",  # Pronoun + reference
        "What is artificial intelligence?"  # No context needed
    ]
    
    for query in test_queries:
        indicators = memory.get_context_indicators(query)
        print(f"   '{query}' -> Needs context: {indicators['needs_context']}")
        print(f"      Pronouns: {indicators['has_pronouns']}, References: {indicators['has_references']}")
    
    # Test summary
    print("\n📊 Testing conversation summary...")
    summary = memory.get_conversation_summary()
    print(f"   Total exchanges: {summary['total_exchanges']}")
    print(f"   Topics: {summary['topics_discussed']}")
    
    return True

def test_contextual_generation():
    """Test contextual generation with real model."""
    print("\n🤖 Testing Contextual Generation...")
    
    try:
        # Initialize client
        client = ReplicateGraniteClient()
        
        # Test without context
        print("Testing without conversation context...")
        response1 = client.generate_response("What is Python?")
        print(f"Response 1: {response1[:100]}...")
        
        # Test with conversation context
        print("\nTesting with conversation context...")
        conversation_context = """Previous conversation:
User: What is Python?
Assistant: Python is a programming language.

User: What are its features?
Assistant: Python features include simplicity, readability, and extensive libraries.
"""
        
        response2 = client.generate_response(
            "Can you give me an example of using it?",
            conversation_context=conversation_context
        )
        print(f"Response 2: {response2[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Contextual generation test failed: {e}")
        return False

def main():
    """Run all conversation memory tests."""
    print("🚀 Conversation Memory Tests")
    print("=" * 50)
    
    # Set up logging
    logging.basicConfig(level=logging.WARNING)  # Reduce noise
    
    # Run tests
    tests = [
        test_conversation_memory,
        test_contextual_generation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ Test passed!\n")
            else:
                print("❌ Test failed!\n")
        except Exception as e:
            print(f"❌ Test failed with exception: {e}\n")
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All conversation memory tests passed!")
    else:
        print("⚠️  Some tests failed.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)