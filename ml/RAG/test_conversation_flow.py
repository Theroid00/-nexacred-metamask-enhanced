#!/usr/bin/env python3
"""
Simple conversation test without MongoDB dependency.
Tests the conversation flow with mock data.
"""

import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from conversation_memory import ConversationMemory
from replicate_client import ReplicateGraniteClient

# Load environment variables
load_dotenv()

def simulate_conversation():
    """Simulate a conversation to test context awareness."""
    print("🎭 Simulating Conversation with Context Awareness")
    print("=" * 60)
    
    # Initialize components
    memory = ConversationMemory()
    client = ReplicateGraniteClient()
    
    # Conversation simulation
    conversations = [
        ("What is machine learning?", None),
        ("How does it work?", "recent"),  # Should use recent context
        ("What are some examples?", "recent"),  # Should use recent context
        ("Can you explain that concept again?", "related"),  # Should use related context
    ]
    
    for i, (user_query, context_type) in enumerate(conversations, 1):
        print(f"\n💬 Exchange {i}")
        print(f"User: {user_query}")
        
        # Determine context to use
        conversation_context = ""
        if context_type == "recent" and memory.has_context():
            conversation_context = memory.get_conversation_context(include_last_n=2)
            print("🧠 Using recent conversation context")
        elif context_type == "related" and memory.has_context():
            conversation_context = memory.find_related_context(user_query)
            print("🔗 Using related conversation context")
        
        # Check context indicators
        indicators = memory.get_context_indicators(user_query)
        if indicators["needs_context"]:
            print(f"🔍 Context clues detected: {[k for k, v in indicators.items() if v and k != 'needs_context']}")
        
        try:
            # Generate response
            response = client.generate_response(
                prompt=user_query,
                context_documents=None,  # No RAG documents for this test
                conversation_context=conversation_context if conversation_context else None
            )
            
            # Truncate long responses for display
            display_response = response[:200] + "..." if len(response) > 200 else response
            print(f"Assistant: {display_response}")
            
            # Store in memory
            memory.add_exchange(user_query, response)
            
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            # Add a mock response for testing
            mock_response = f"This is a mock response to '{user_query}'"
            memory.add_exchange(user_query, mock_response)
            print(f"Assistant: {mock_response}")
    
    # Show final conversation summary
    print("\n" + "=" * 60)
    print("📊 Final Conversation Summary:")
    summary = memory.get_conversation_summary()
    print(f"   Total exchanges: {summary['total_exchanges']}")
    print(f"   Topics discussed: {summary['topics_discussed']}")
    print(f"   Session duration: {summary['session_duration']}")
    
    return True

def main():
    """Run conversation simulation."""
    try:
        simulate_conversation()
        print("\n🎉 Conversation context test completed successfully!")
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)