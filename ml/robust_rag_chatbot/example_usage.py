"""
Example Usage of Robust RAG Chatbot
===================================

Demonstrates how to use the chatbot in different scenarios.
"""

import asyncio
import logging
from robust_rag_chatbot import RobustRAGChatbot
from config import config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def example_basic_usage():
    """Basic chatbot usage example"""
    print("=" * 60)
    print("BASIC USAGE EXAMPLE")
    print("=" * 60)

    try:
        # Initialize chatbot
        chatbot = RobustRAGChatbot()

        # Start conversation
        session_id = chatbot.start_conversation("example_user")
        print(f"Started conversation: {session_id}")

        # Example financial questions
        questions = [
            "What are the latest RBI guidelines for digital lending platforms?",
            "Explain SEBI's new mutual fund regulations for 2024.",
            "What are the capital adequacy requirements for banks in India?",
            "Tell me about IRDAI's insurance product development guidelines.",
            "How does the new credit scoring framework work?"
        ]

        for i, question in enumerate(questions, 1):
            print(f"\n--- Question {i} ---")
            print(f"User: {question}")

            response = chatbot.chat(question, session_id)
            print(f"Assistant: {response[:200]}...")
            print(f"[Response length: {len(response)} characters]")

        # Get conversation history
        history = chatbot.get_conversation_history(session_id)
        print(f"\nConversation has {len(history)} messages")

        # Get system status
        status = chatbot.get_system_status()
        print(f"\nSystem Status: {status['initialized']}")
        print(f"Model: {status['model_info']['model_name']}")

        # Cleanup
        chatbot.cleanup()
        print("\n✅ Basic usage example completed successfully")

    except Exception as e:
        logger.error(f"Basic usage example failed: {e}")

def example_context_manager():
    """Example using context manager"""
    print("\n" + "=" * 60)
    print("CONTEXT MANAGER EXAMPLE")
    print("=" * 60)

    try:
        with RobustRAGChatbot() as chatbot:
            session_id = chatbot.start_conversation("context_user")

            # Multi-turn conversation
            conversation = [
                "What is a credit score?",
                "How is it calculated in India?",
                "What factors can improve my credit score?",
                "Are there any recent changes in credit scoring methods?"
            ]

            for question in conversation:
                print(f"\nUser: {question}")
                response = chatbot.chat(question, session_id)
                print(f"Assistant: {response[:150]}...")

        print("\n✅ Context manager example completed")

    except Exception as e:
        logger.error(f"Context manager example failed: {e}")

def example_error_handling():
    """Example of error handling and recovery"""
    print("\n" + "=" * 60)
    print("ERROR HANDLING EXAMPLE")
    print("=" * 60)

    try:
        chatbot = RobustRAGChatbot()

        # Test with invalid session
        response = chatbot.chat("Test message", "invalid_session_id")
        print(f"Response with invalid session: {response[:100]}...")

        # Test with empty message (should handle gracefully)
        try:
            response = chatbot.chat("", None)
            print(f"Response to empty message: {response[:100]}...")
        except Exception as e:
            print(f"Empty message handled: {e}")

        # Test system status during operation
        status = chatbot.get_system_status()
        print(f"Current session: {status['current_session']}")

        chatbot.cleanup()
        print("\n✅ Error handling example completed")

    except Exception as e:
        logger.error(f"Error handling example failed: {e}")

async def example_api_client():
    """Example API client usage"""
    print("\n" + "=" * 60)
    print("API CLIENT EXAMPLE")
    print("=" * 60)

    import httpx

    try:
        base_url = f"http://{config.api_host}:{config.api_port}"

        async with httpx.AsyncClient() as client:
            # Health check
            health_response = await client.get(f"{base_url}/health")
            print(f"Health check: {health_response.json()}")

            # Create conversation
            conv_response = await client.post(
                f"{base_url}/conversations/new",
                params={"user_id": "api_test_user"}
            )
            session_data = conv_response.json()
            session_id = session_data["session_id"]
            print(f"Created session: {session_id}")

            # Send chat message
            chat_response = await client.post(
                f"{base_url}/chat",
                json={
                    "message": "What are the key features of RBI's digital payment guidelines?",
                    "session_id": session_id,
                    "user_id": "api_test_user"
                }
            )

            chat_data = chat_response.json()
            print(f"Response: {chat_data['response'][:150]}...")
            print(f"Processing time: {chat_data['processing_time']:.2f}s")
            print(f"Sources used: {chat_data['sources_count']}")

            # Get conversation history
            history_response = await client.get(f"{base_url}/conversations/{session_id}")
            history_data = history_response.json()
            print(f"Conversation has {len(history_data['messages'])} messages")

        print("\n✅ API client example completed")

    except Exception as e:
        logger.error(f"API client example failed: {e}")

def run_all_examples():
    """Run all examples"""
    print("ROBUST RAG CHATBOT - EXAMPLE USAGE")
    print("=" * 60)

    # Basic usage
    example_basic_usage()

    # Context manager
    example_context_manager()

    # Error handling
    example_error_handling()

    # API client (async)
    print("\nTo test API client, first start the API server with:")
    print("python api_service.py")
    print("Then run: asyncio.run(example_api_client())")

if __name__ == "__main__":
    run_all_examples()
