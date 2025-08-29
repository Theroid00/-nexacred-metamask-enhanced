"""
Command Line Interface for Robust RAG Chatbot
==============================================

Interactive CLI for testing and using the chatbot.
"""

import argparse
import sys
import time
import asyncio
from typing import Optional
import signal
import os

from robust_rag_chatbot import RobustRAGChatbot
from config import config

class ChatbotCLI:
    """Command line interface for the RAG chatbot"""

    def __init__(self):
        self.chatbot: Optional[RobustRAGChatbot] = None
        self.current_session_id: Optional[str] = None
        self.running = True

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print("\n\nShutting down gracefully...")
        self.running = False
        if self.chatbot:
            self.chatbot.cleanup()
        sys.exit(0)

    def initialize_chatbot(self) -> bool:
        """Initialize the chatbot with error handling"""
        try:
            print("Initializing Robust RAG Chatbot...")
            print(f"Model: {config.model_name}")
            print(f"MongoDB: {config.mongodb_database}")
            print("This may take a few minutes on first run...\n")

            self.chatbot = RobustRAGChatbot()

            if not self.chatbot.initialize():
                print("Failed to initialize chatbot")
                return False

            print("Chatbot initialized successfully!")
            return True

        except Exception as e:
            print(f"Initialization error: {e}")
            return False

    def start_interactive_chat(self):
        """Start interactive chat session"""
        if not self.initialize_chatbot():
            return

        try:
            # Start conversation
            self.current_session_id = self.chatbot.start_conversation("cli_user")
            print(f"Started conversation: {self.current_session_id[:8]}...")

            print("\n" + "="*60)
            print("ROBUST RAG CHATBOT - INTERACTIVE MODE")
            print("="*60)
            print("Ask questions about Indian financial regulations!")
            print("Commands:")
            print("  /help    - Show this help")
            print("  /status  - Show system status")
            print("  /history - Show conversation history")
            print("  /new     - Start new conversation")
            print("  /quit    - Exit chatbot")
            print("="*60 + "\n")

            while self.running:
                try:
                    # Get user input
                    user_input = input("You: ").strip()

                    if not user_input:
                        continue

                    # Handle commands
                    if user_input.startswith('/'):
                        if self._handle_command(user_input):
                            continue
                        else:
                            break

                    # Process chat message
                    print("Thinking...", end="", flush=True)
                    start_time = time.time()

                    response = self.chatbot.chat(user_input, self.current_session_id)

                    processing_time = time.time() - start_time
                    print(f"\rResponse time: {processing_time:.2f}s")
                    print(f"\nAssistant: {response}\n")

                except KeyboardInterrupt:
                    print("\n\nChat interrupted. Use /quit to exit properly.")
                    continue
                except EOFError:
                    print("\n\nInput stream ended. Exiting...")
                    break
                except Exception as e:
                    print(f"\nError: {e}\n")
                    continue

        finally:
            if self.chatbot:
                self.chatbot.cleanup()
            print("Goodbye!")

    def _handle_command(self, command: str) -> bool:
        """Handle CLI commands. Returns True to continue, False to exit"""
        command = command.lower().strip()

        if command == '/help':
            self._show_help()

        elif command == '/status':
            self._show_status()

        elif command == '/history':
            self._show_history()

        elif command == '/new':
            self._start_new_conversation()

        elif command == '/quit' or command == '/exit':
            return False

        else:
            print(f"Unknown command: {command}")
            print("Type /help for available commands")

        return True

    def _show_help(self):
        """Show help information"""
        print("\nHELP - Robust RAG Chatbot")
        print("-" * 40)
        print("This chatbot answers questions about Indian financial regulations")
        print("using IBM Granite 2B Instruct model and MongoDB document retrieval.")
        print("\nExample questions:")
        print("• What are RBI's digital lending guidelines?")
        print("• Explain SEBI mutual fund regulations")
        print("• How does credit scoring work in India?")
        print("• What are the latest IRDAI insurance rules?")
        print("\nCommands:")
        print("• /help    - Show this help")
        print("• /status  - System status and performance")
        print("• /history - Conversation history")
        print("• /new     - Start fresh conversation")
        print("• /quit    - Exit application")
        print("-" * 40 + "\n")

    def _show_status(self):
        """Show system status"""
        if not self.chatbot:
            print("Chatbot not initialized")
            return

        try:
            status = self.chatbot.get_system_status()

            print("\nSYSTEM STATUS")
            print("-" * 30)
            print(f"Initialized: {'Yes' if status['initialized'] else 'No'}")
            print(f"Current Session: {status['current_session'][:8] if status['current_session'] else 'None'}...")
            print(f"Model: {status['config']['model_name']}")
            print(f"Embedding Model: {status['config']['embedding_model']}")
            print(f"Database: {status['config']['mongodb_database']}")
            print(f"Document Retrieval: Top {status['config']['top_k_documents']}")

            # Model info
            model_info = status.get('model_info', {})
            print(f"Model Loaded: {'Yes' if model_info.get('is_loaded') else 'No'}")
            print(f"Device: {model_info.get('device', 'Unknown')}")
            print(f"Quantization: {'Yes' if model_info.get('quantization') else 'No'}")
            print(f"Memory Usage: {model_info.get('memory_usage_gb', 0):.2f} GB")

            # Conversation stats
            conv_stats = status.get('conversation_stats', {})
            print(f"Total Conversations: {conv_stats.get('total_conversations', 0)}")
            print(f"Storage: {conv_stats.get('storage_directory', 'Unknown')}")

            print("-" * 30 + "\n")

        except Exception as e:
            print(f"Error getting status: {e}\n")

    def _show_history(self):
        """Show conversation history"""
        if not self.chatbot or not self.current_session_id:
            print("No active conversation")
            return

        try:
            history = self.chatbot.get_conversation_history(self.current_session_id)

            if not history:
                print("No conversation history yet\n")
                return

            print(f"\nCONVERSATION HISTORY ({len(history)} messages)")
            print("-" * 50)

            for i, message in enumerate(history, 1):
                role = "You" if message['role'] == 'user' else "Assistant"
                content = message['content']
                timestamp = message['timestamp'][:19]  # Remove microseconds

                # Truncate long messages
                if len(content) > 100:
                    content = content[:97] + "..."

                print(f"{i:2}. {role} ({timestamp})")
                print(f"    {content}")
                print()

            print("-" * 50 + "\n")

        except Exception as e:
            print(f"Error getting history: {e}\n")

    def _start_new_conversation(self):
        """Start a new conversation"""
        if not self.chatbot:
            print("Chatbot not initialized")
            return

        try:
            self.current_session_id = self.chatbot.start_conversation("cli_user")
            print(f"Started new conversation: {self.current_session_id[:8]}...\n")
        except Exception as e:
            print(f"Error starting new conversation: {e}\n")

def run_single_query(question: str):
    """Run a single query and exit"""
    cli = ChatbotCLI()

    if not cli.initialize_chatbot():
        return

    try:
        session_id = cli.chatbot.start_conversation("single_query_user")
        print(f"Question: {question}")
        print("Processing...\n")

        start_time = time.time()
        response = cli.chatbot.chat(question, session_id)
        processing_time = time.time() - start_time

        print("=" * 60)
        print("RESPONSE:")
        print("=" * 60)
        print(response)
        print("=" * 60)
        print(f"Processing time: {processing_time:.2f} seconds")

    finally:
        cli.chatbot.cleanup()

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Robust RAG Chatbot CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py                                    # Interactive mode
  python cli.py --query "What are RBI guidelines?" # Single query
  python cli.py --test                            # Run system test
        """
    )

    parser.add_argument(
        '--query', '-q',
        type=str,
        help='Run a single query and exit'
    )

    parser.add_argument(
        '--test', '-t',
        action='store_true',
        help='Run system test'
    )

    args = parser.parse_args()

    if args.test:
        print("Running system test...")
        run_single_query("What are the key features of RBI digital payment guidelines?")

    elif args.query:
        run_single_query(args.query)

    else:
        # Interactive mode
        cli = ChatbotCLI()
        cli.start_interactive_chat()

if __name__ == "__main__":
    main()
