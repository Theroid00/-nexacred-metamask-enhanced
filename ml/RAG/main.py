"""
RAG Chatbot - Terminal Interface
Interactive chatbot using IBM Granite AI and MongoDB Atlas for RAG functionality.
"""

import sys
import os
import logging
from typing import Dict, Any, Optional
from colorama import init, Fore, Style
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.spinner import Spinner
from rich.live import Live
import time

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from rag_pipeline import RAGPipeline

# Initialize colorama and rich console
init(autoreset=True)
console = Console()

logger = logging.getLogger(__name__)

class RAGChatbot:
    """Interactive terminal chatbot with RAG capabilities."""
    
    def __init__(self):
        """Initialize the chatbot."""
        self.rag_pipeline: Optional[RAGPipeline] = None
        self.is_running = False
        
    def initialize(self) -> bool:
        """
        Initialize the RAG pipeline and check configuration.
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            # Validate configuration
            is_valid, missing_keys = Config.validate_config()
            if not is_valid:
                console.print(Panel(
                    f"[red]Configuration Error![/red]\n\n"
                    f"Missing required environment variables:\n"
                    f"• {chr(10).join(missing_keys)}\n\n"
                    f"Please check your .env file and ensure all required keys are set.",
                    title="⚠️  Configuration Error",
                    style="red"
                ))
                return False
            
            # Initialize RAG pipeline with spinner
            with console.status("[bold green]Initializing RAG pipeline...") as status:
                status.update("🔗 Connecting to MongoDB Atlas...")
                time.sleep(1)
                
                status.update("🤖 Initializing IBM Granite AI...")
                time.sleep(1)
                
                status.update("🔍 Loading sentence transformer...")
                self.rag_pipeline = RAGPipeline()
                time.sleep(1)
            
            # Health check
            health = self.rag_pipeline.health_check()
            if not all(health.values()):
                console.print(Panel(
                    f"[yellow]Warning: Some components may not be fully functional[/yellow]\n\n"
                    f"Health Status:\n"
                    f"• Embedder: {'✅' if health['embedder'] else '❌'}\n"
                    f"• Database: {'✅' if health['database'] else '❌'}\n"
                    f"• IBM Granite: {'✅' if health['ibm_client'] else '❌'}",
                    title="⚠️  Health Check",
                    style="yellow"
                ))
            
            console.print(Panel(
                "[green]✅ RAG Chatbot initialized successfully![/green]\n\n"
                "Configuration:\n"
                f"• Database: {Config.MONGODB_DATABASE}\n"
                f"• Collection: {Config.MONGODB_COLLECTION}\n"
                f"• Top-K Results: {Config.TOP_K_RESULTS}\n"
                f"• Similarity Threshold: {Config.SIMILARITY_THRESHOLD}",
                title="🚀 Ready to Chat!",
                style="green"
            ))
            
            return True
            
        except Exception as e:
            console.print(Panel(
                f"[red]Initialization failed![/red]\n\n"
                f"Error: {str(e)}\n\n"
                f"Please check your configuration and try again.",
                title="❌ Initialization Error",
                style="red"
            ))
            logger.error(f"Initialization failed: {e}")
            return False
    
    def display_welcome(self):
        """Display welcome message and instructions."""
        welcome_text = Text()
        welcome_text.append("🤖 RAG Chatbot ", style="bold blue")
        welcome_text.append("- Powered by IBM Granite AI & MongoDB Atlas\n\n", style="bold")
        welcome_text.append("Available commands:\n", style="bold")
        welcome_text.append("• ", style="dim")
        welcome_text.append("help", style="bold cyan")
        welcome_text.append(" - Show this help message\n", style="dim")
        welcome_text.append("• ", style="dim")
        welcome_text.append("health", style="bold cyan")
        welcome_text.append(" - Check system health\n", style="dim")
        welcome_text.append("• ", style="dim")
        welcome_text.append("clear", style="bold cyan")
        welcome_text.append(" - Clear the screen\n", style="dim")
        welcome_text.append("• ", style="dim")
        welcome_text.append("quit/exit", style="bold cyan")
        welcome_text.append(" - Exit the chatbot\n\n", style="dim")
        welcome_text.append("Type your question and press Enter to get started!", style="italic")
        
        console.print(Panel(welcome_text, title="Welcome!", style="blue"))
    
    def process_command(self, user_input: str) -> bool:
        """
        Process special commands.
        
        Args:
            user_input: User input string
            
        Returns:
            True if command was processed, False if it's a regular query
        """
        command = user_input.lower().strip()
        
        if command in ['quit', 'exit', 'bye']:
            console.print("\n[yellow]👋 Goodbye! Thanks for using RAG Chatbot![/yellow]")
            return True
        
        elif command == 'help':
            self.display_welcome()
            return False
        
        elif command == 'clear':
            os.system('clear' if os.name == 'posix' else 'cls')
            self.display_welcome()
            return False
        
        elif command == 'health':
            self.show_health_status()
            return False
        
        return False
    
    def show_health_status(self):
        """Display health status of all components."""
        if not self.rag_pipeline:
            console.print("[red]❌ RAG pipeline not initialized[/red]")
            return
        
        health = self.rag_pipeline.health_check()
        
        status_text = Text()
        status_text.append("System Health Status:\n\n", style="bold")
        
        for component, status in health.items():
            icon = "✅" if status else "❌"
            color = "green" if status else "red"
            status_text.append(f"{icon} {component.title()}: ", style=color)
            status_text.append("Healthy\n" if status else "Not responding\n", style=color)
        
        overall_status = all(health.values())
        status_text.append(f"\nOverall Status: ", style="bold")
        status_text.append("🟢 All systems operational" if overall_status else "🟡 Some issues detected", 
                          style="green" if overall_status else "yellow")
        
        console.print(Panel(status_text, title="🏥 Health Check", style="blue"))
    
    def process_query(self, user_query: str) -> None:
        """
        Process user query through RAG pipeline.
        
        Args:
            user_query: User's question
        """
        if not self.rag_pipeline:
            console.print("[red]❌ RAG pipeline not available[/red]")
            return
        
        # Show processing spinner
        with console.status(f"[bold blue]🔍 Processing your question...") as status:
            try:
                status.update("🔍 Searching knowledge base...")
                result = self.rag_pipeline.process_query(user_query)
                
                # Display results
                self.display_response(result)
                
            except Exception as e:
                console.print(Panel(
                    f"[red]Error processing query:[/red]\n{str(e)}",
                    title="❌ Error",
                    style="red"
                ))
                logger.error(f"Query processing error: {e}")
    
    def display_response(self, result: Dict[str, Any]) -> None:
        """
        Display the chatbot response in a formatted way.
        
        Args:
            result: Result dictionary from RAG pipeline
        """
        # Main response
        response_text = Text()
        response_text.append("🤖 ", style="blue")
        response_text.append(result.get("response", "No response generated"), style="white")
        
        console.print(Panel(response_text, title="Response", style="blue"))
        
        # Metadata
        if result.get("retrieved_documents", 0) > 0:
            meta_text = Text()
            meta_text.append(f"📊 Retrieved {result['retrieved_documents']} relevant documents\n", style="dim")
            
            if result.get("sources"):
                meta_text.append("📚 Sources:\n", style="dim bold")
                for source in result["sources"][:3]:  # Show top 3 sources
                    score = source.get("score", 0)
                    title = source.get("title", "Unknown")
                    meta_text.append(f"  • {title} (score: {score:.3f})\n", style="dim")
            
            console.print(Panel(meta_text, title="📈 Query Info", style="dim"))
    
    def run(self) -> None:
        """Run the interactive chatbot."""
        # Initialize
        if not self.initialize():
            return
        
        # Display welcome
        self.display_welcome()
        
        # Main chat loop
        self.is_running = True
        try:
            while self.is_running:
                try:
                    # Get user input
                    user_input = console.input("\n[bold cyan]You:[/bold cyan] ").strip()
                    
                    if not user_input:
                        continue
                    
                    # Process commands
                    if self.process_command(user_input):
                        break
                    
                    # Process query
                    self.process_query(user_input)
                    
                except KeyboardInterrupt:
                    console.print("\n[yellow]👋 Goodbye! Thanks for using RAG Chatbot![/yellow]")
                    break
                except EOFError:
                    console.print("\n[yellow]👋 Goodbye! Thanks for using RAG Chatbot![/yellow]")
                    break
                except Exception as e:
                    console.print(f"\n[red]❌ Unexpected error: {str(e)}[/red]")
                    logger.error(f"Unexpected error: {e}")
        
        finally:
            # Cleanup
            if self.rag_pipeline:
                self.rag_pipeline.close()
            console.print("\n[dim]🔌 Connections closed.[/dim]")

def main():
    """Main entry point."""
    try:
        chatbot = RAGChatbot()
        chatbot.run()
    except Exception as e:
        print(f"Fatal error: {e}")
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()