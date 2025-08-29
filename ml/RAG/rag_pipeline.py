"""
RAG (Retrieval-Augmented Generation) pipeline.
Combines document retrieval from MongoDB Atlas with text generation from IBM Granite.
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from database import MongoDBAtlasConnector
from replicate_client import ReplicateGraniteClient
from conversation_memory import ConversationMemory
from config import Config

logger = logging.getLogger(__name__)

class RAGPipeline:
    """RAG pipeline combining retrieval and generation."""
    
    def __init__(self):
        """Initialize RAG pipeline components."""
        self.db_connector: Optional[MongoDBAtlasConnector] = None
        self.replicate_client: Optional[ReplicateGraniteClient] = None
        self.embedder: Optional[SentenceTransformer] = None
        self.conversation_memory: ConversationMemory = ConversationMemory()
        self._initialize_components()
    
    def _initialize_components(self) -> None:
        """Initialize all pipeline components."""
        try:
            # Initialize sentence transformer for query embedding
            # Using a model that's good for semantic similarity
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer initialized")
            
            # Initialize database connector
            self.db_connector = MongoDBAtlasConnector()
            logger.info("MongoDB Atlas connector initialized")
            
            # Initialize Replicate client
            self.replicate_client = ReplicateGraniteClient()
            logger.info("Replicate Granite client initialized")
            
            # Initialize conversation memory
            logger.info("Conversation memory initialized")
            
            logger.info("RAG pipeline successfully initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG pipeline: {e}")
            raise RuntimeError(f"RAG pipeline initialization failed: {e}")
    
    def process_query(self, user_query: str) -> Dict[str, Any]:
        """
        Process user query through the complete RAG pipeline with conversation context.
        
        Args:
            user_query: User's question or query
            
        Returns:
            Dictionary containing response and metadata
        """
        try:
            logger.info(f"Processing query: {user_query[:100]}...")
            
            # Analyze query for context indicators
            context_indicators = self.conversation_memory.get_context_indicators(user_query)
            
            # Step 1: Generate query embedding
            query_embedding = self._generate_query_embedding(user_query)
            
            # Step 2: Retrieve relevant documents
            retrieved_docs = self._retrieve_documents(query_embedding)
            
            # Step 3: Extract text content from retrieved documents
            context_texts = self._extract_context_texts(retrieved_docs)
            
            # Step 4: Get conversation context if needed
            conversation_context = ""
            if self.conversation_memory.has_context():
                if context_indicators["needs_context"]:
                    # Use related context for contextual queries
                    conversation_context = self.conversation_memory.find_related_context(user_query)
                else:
                    # Use recent context for continuity
                    conversation_context = self.conversation_memory.get_conversation_context(include_last_n=2)
            
            # Step 5: Generate response using IBM Granite with all context
            response = self._generate_response(user_query, context_texts, conversation_context)
            
            # Step 6: Store this exchange in conversation memory
            self.conversation_memory.add_exchange(
                user_query=user_query,
                assistant_response=response,
                metadata={
                    "retrieved_documents": len(retrieved_docs),
                    "used_conversation_context": bool(conversation_context),
                    "context_indicators": context_indicators
                }
            )
            
            # Prepare result
            result = {
                "query": user_query,
                "response": response,
                "retrieved_documents": len(retrieved_docs),
                "context_used": len(context_texts) > 0,
                "conversation_context_used": bool(conversation_context),
                "sources": self._extract_source_info(retrieved_docs),
                "context_indicators": context_indicators
            }
            
            logger.info(f"Query processed successfully. Retrieved {len(retrieved_docs)} documents, "
                       f"conversation context: {bool(conversation_context)}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "query": user_query,
                "response": f"I apologize, but I encountered an error while processing your question: {str(e)}",
                "retrieved_documents": 0,
                "context_used": False,
                "conversation_context_used": False,
                "sources": [],
                "error": str(e)
            }
    
    def _generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for the user query.
        
        Args:
            query: User query text
            
        Returns:
            Query embedding vector
        """
        if not self.embedder:
            raise RuntimeError("Sentence transformer not initialized")
        
        try:
            embedding = self.embedder.encode(query, convert_to_tensor=False)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            raise RuntimeError(f"Query embedding failed: {e}")
    
    def _retrieve_documents(self, query_embedding: List[float]) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents from MongoDB Atlas.
        
        Args:
            query_embedding: Query embedding vector
            
        Returns:
            List of retrieved documents
        """
        if not self.db_connector:
            raise RuntimeError("Database connector not initialized")
        
        try:
            return self.db_connector.vector_search(
                query_vector=query_embedding,
                top_k=Config.TOP_K_RESULTS
            )
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            return []
    
    def _extract_context_texts(self, documents: List[Dict[str, Any]]) -> List[str]:
        """
        Extract text content from retrieved documents.
        
        Args:
            documents: Retrieved documents
            
        Returns:
            List of text contents
        """
        if not self.db_connector:
            return []
        
        try:
            return self.db_connector.get_document_content(documents)
        except Exception as e:
            logger.error(f"Error extracting context texts: {e}")
            return []
    
    def _generate_response(self, query: str, context_texts: Optional[List[str]], 
                          conversation_context: Optional[str] = None) -> str:
        """
        Generate response using IBM Granite via Replicate with context and conversation history.
        
        Args:
            query: User query
            context_texts: Retrieved context texts
            conversation_context: Previous conversation context
            
        Returns:
            Generated response
        """
        if not self.replicate_client:
            raise RuntimeError("Replicate Granite client not initialized")
        
        try:
            return self.replicate_client.generate_response(
                prompt=query,
                context_documents=context_texts if context_texts else None,
                conversation_context=conversation_context
            )
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            # Fallback response
            return f"I apologize, but I'm having trouble generating a response right now. Error: {str(e)}"
    
    def _extract_source_info(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract source information from retrieved documents.
        
        Args:
            documents: Retrieved documents
            
        Returns:
            List of source information
        """
        sources = []
        
        for i, doc in enumerate(documents):
            source_info = {
                "index": i + 1,
                "score": doc.get("score", 0.0),
                "title": doc.get("title", f"Document {i + 1}"),
                "source": doc.get("source", "Unknown"),
                "id": str(doc.get("_id", f"doc_{i}"))
            }
            sources.append(source_info)
        
        return sources
    
    def health_check(self) -> Dict[str, bool]:
        """
        Check health of all pipeline components.
        
        Returns:
            Health status of each component
        """
        health = {
            "embedder": self.embedder is not None,
            "database": False,
            "granite_client": False
        }
        
        try:
            if self.db_connector:
                health["database"] = self.db_connector.health_check()
        except:
            health["database"] = False
        
        try:
            if self.replicate_client:
                health["granite_client"] = self.replicate_client.health_check()
        except:
            health["granite_client"] = False
        
        return health
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get conversation summary."""
        return self.conversation_memory.get_conversation_summary()
    
    def clear_conversation(self) -> None:
        """Clear conversation history."""
        self.conversation_memory.clear_history()
        logger.info("Conversation history cleared")
    
    def export_conversation(self, filepath: Optional[str] = None) -> str:
        """Export conversation history."""
        return self.conversation_memory.export_conversation(filepath)
    
    def close(self) -> None:
        """Close all connections and cleanup resources."""
        try:
            if self.db_connector:
                self.db_connector.close_connection()
            logger.info("RAG pipeline closed successfully")
        except Exception as e:
            logger.error(f"Error closing RAG pipeline: {e}")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()