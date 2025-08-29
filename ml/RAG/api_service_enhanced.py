#!/usr/bin/env python3
"""
Enhanced RAG Chatbot API Service
Tries full RAG first, falls back to simplified version if needed.
"""

import sys
import json
import logging
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class EnhancedRAGService:
    """Enhanced RAG service with fallback capabilities."""
    
    def __init__(self):
        """Initialize the enhanced service."""
        self.rag_pipeline = None
        self.use_full_rag = False
        self.simplified_service = None
        self._initialize()
    
    def _initialize(self):
        """Initialize RAG components with fallback."""
        try:
            # Try to initialize full RAG pipeline
            from rag_pipeline import RAGPipeline
            from config import Config
            
            # Validate configuration
            is_valid, missing_keys = Config.validate_config()
            if is_valid:
                self.rag_pipeline = RAGPipeline()
                self.use_full_rag = True
                logger.info("Full RAG pipeline initialized successfully")
            else:
                logger.warning(f"Full RAG not available - missing config: {missing_keys}")
                self._initialize_simplified()
        except Exception as e:
            logger.warning(f"Full RAG initialization failed: {e}")
            self._initialize_simplified()
    
    def _initialize_simplified(self):
        """Initialize simplified service as fallback."""
        try:
            # Import the simplified service
            from api_service_simple import SimplifiedChatbotService
            self.simplified_service = SimplifiedChatbotService()
            logger.info("Simplified RAG service initialized as fallback")
        except Exception as e:
            logger.error(f"Failed to initialize simplified service: {e}")
            # Create basic fallback
            self.simplified_service = self._create_basic_fallback()
    
    def _create_basic_fallback(self):
        """Create a basic fallback service."""
        class BasicFallback:
            def process_query(self, query):
                return {
                    "query": query,
                    "response": "I'm an AI assistant for NexaCred. I can help with questions about credit scores, lending, and financial services. However, I'm currently running in limited mode. For detailed assistance, please contact our support team.",
                    "retrieved_documents": 0,
                    "context_used": False,
                    "sources": ["Basic Fallback"],
                    "service_type": "basic_fallback"
                }
        return BasicFallback()
    
    def process_query(self, query: str) -> dict:
        """Process query using available service."""
        try:
            if self.use_full_rag and self.rag_pipeline:
                # Try full RAG first
                try:
                    result = self.rag_pipeline.process_query(query)
                    # Check if there was an authentication error or other critical error
                    if "error" in result and ("authentication" in result["error"].lower() or "unauthenticated" in result["error"].lower()):
                        logger.warning("Full RAG authentication failed, switching to simplified mode")
                        self.use_full_rag = False
                        return self.simplified_service.process_query(query)
                    result["service_type"] = "full_rag"
                    return result
                except Exception as e:
                    logger.warning(f"Full RAG query failed: {e}, falling back to simplified")
                    self.use_full_rag = False
            
            # Use simplified service
            if self.simplified_service:
                result = self.simplified_service.process_query(query)
                if "service_type" not in result:
                    result["service_type"] = "simplified"
                return result
            
            # Last resort fallback
            return {
                "error": "All services unavailable",
                "response": "I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact support.",
                "retrieved_documents": 0,
                "context_used": False,
                "sources": [],
                "service_type": "error"
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "error": str(e),
                "response": "I apologize, but I encountered an error while processing your question. Please try again.",
                "retrieved_documents": 0,
                "context_used": False,
                "sources": [],
                "service_type": "error"
            }

def main():
    """Main function to handle command line API calls."""
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python api_service_enhanced.py <query>",
            "response": "I didn't receive a proper query. Please try again.",
            "retrieved_documents": 0,
            "context_used": False,
            "sources": []
        }))
        sys.exit(1)
    
    query = sys.argv[1]
    
    # Initialize service
    service = EnhancedRAGService()
    
    # Process query
    result = service.process_query(query)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
