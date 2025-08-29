"""
RAG Chatbot - Minimalistic Terminal Interface
Interactive chatbot using IBM Granite AI and MongoDB Atlas for RAG functionality.
"""

import sys
import os
import logging
from typing import Dict, Any, Optional
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_pipeline import RAGPipeline

# Configure rich console
console = Console()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chatbot.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class RAGChatbot:
    """Minimalistic RAG Chatbot with conversation memory."""
    
    def __init__(self):
        """Initialize the chatbot."""
        self.rag_pipeline = None
        self.is_running = False
    
    def initialize(self) -> bool:
        """Initialize the RAG pipeline and components."""
        try:
            console.print(Panel(
                "[bold blue]🚀 Initializing RAG Chatbot...[/bold blue]\n\n"
                "Setting up:\n"
                "• IBM Granite AI on Replicate\n"
                "• MongoDB Atlas Vector Database\n"
                "• Conversation Memory System",
                title="Starting Up",
                style="blue"
            ))
            
            # Initialize RAG pipeline
            self.rag_pipeline = RAGPipeline()
            
            console.print("[green]✅ Initialization complete![/green]")
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
        welcome_text.append("- Powered by IBM Granite on Replicate & MongoDB Atlas\n\n", style="bold")
        welcome_text.append("Type your question and press Enter to get started!\n", style="italic")
        welcome_text.append("Press Ctrl+C or type 'quit' to exit.", style="dim")
        
        console.print(Panel(welcome_text, title="Welcome!", style="blue"))
    
    def display_response(self, response_data):
        """Display the chatbot response."""
        response = response_data.get('response', '')
        
        # Create response panel
        response_panel = Panel(
            response,
            title="🤖 Assistant",
            style="green",
            padding=(1, 2)
        )
        
        console.print()
        console.print(response_panel)
        console.print()
    
    def process_query(self, user_input: str) -> None:
        """Process a user query through the RAG pipeline."""
        try:
            with console.status("[bold blue]Thinking...", spinner="dots"):
                response_data = self.rag_pipeline.process_query(user_input)
            
            self.display_response(response_data)
            
        except Exception as e:
            console.print(f"[red]❌ Error processing query: {str(e)}[/red]")
            logger.error(f"Query processing error: {e}")
    
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
                    
                    # Check for quit commands
                    if user_input.lower() in ['quit', 'exit', 'bye']:
                        console.print("\n[yellow]👋 Goodbye! Thanks for using RAG Chatbot![/yellow]")
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
        console.print(f"[red]❌ Fatal error: {str(e)}[/red]")
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()