#!/usr/bin/env python3
"""
RAG Chatbot API Service
HTTP wrapper for the RAG pipeline to be called from Node.js backend.
"""

import sys
import json
import logging
import os
from typing import Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from rag_pipeline import RAGPipeline
    from config import Config
except ImportError as e:
    print(json.dumps({
        "error": f"Failed to import required modules: {e}",
        "response": "I'm currently experiencing technical difficulties. Please try again later.",
        "retrieved_documents": 0,
        "context_used": False,
        "sources": []
    }))
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class RAGAPIService:
    """API service wrapper for RAG pipeline."""
    
    def __init__(self):
        """Initialize the API service."""
        self.rag_pipeline = None
        self.is_initialized = False
        
    def initialize(self) -> bool:
        """
        Initialize the RAG pipeline.
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            # Validate configuration
            is_valid, missing_keys = Config.validate_config()
            if not is_valid:
                logger.error(f"Configuration validation failed. Missing keys: {missing_keys}")
                return False
            
            # Initialize RAG pipeline
            self.rag_pipeline = RAGPipeline()
            self.is_initialized = True
            logger.info("RAG API service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG API service: {e}")
            return False
    
    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process a query through the RAG pipeline.
        
        Args:
            query: User query string
            
        Returns:
            Dictionary with response and metadata
        """
        if not self.is_initialized:
            if not self.initialize():
                return {
                    "error": "Service initialization failed",
                    "response": "I'm currently experiencing technical difficulties. Please try again later.",
                    "retrieved_documents": 0,
                    "context_used": False,
                    "sources": []
                }
        
        try:
            # Process the query through RAG pipeline
            result = self.rag_pipeline.process_query(query)
            
            # Ensure we have required fields
            result.setdefault("response", "I apologize, but I couldn't generate a response.")
            result.setdefault("retrieved_documents", 0)
            result.setdefault("context_used", False)
            result.setdefault("sources", [])
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "error": str(e),
                "response": "I apologize, but I encountered an error while processing your question. Please try again.",
                "retrieved_documents": 0,
                "context_used": False,
                "sources": []
            }

def main():
    """Main function to handle command line API calls."""
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python api_service.py <query>",
            "response": "I didn't receive a proper query. Please try again.",
            "retrieved_documents": 0,
            "context_used": False,
            "sources": []
        }))
        sys.exit(1)
    
    query = sys.argv[1]
    
    # Initialize service
    service = RAGAPIService()
    
    # Process query
    result = service.process_query(query)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()