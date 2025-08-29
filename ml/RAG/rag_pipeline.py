"""
RAG (Retrieval-Augmented Generation) pipeline.
Combines document retrieval from MongoDB Atlas with text generation from IBM Granite.
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from database import MongoDBAtlasConnector
from ibm_client import IBMGraniteClient
from config import Config

logger = logging.getLogger(__name__)

class RAGPipeline:
    """RAG pipeline combining retrieval and generation."""
    
    def __init__(self):
        """Initialize RAG pipeline components."""
        self.db_connector: Optional[MongoDBAtlasConnector] = None
        self.ibm_client: Optional[IBMGraniteClient] = None
        self.embedder: Optional[SentenceTransformer] = None
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
            
            # Initialize IBM Granite client
            self.ibm_client = IBMGraniteClient()
            logger.info("IBM Granite client initialized")
            
            logger.info("RAG pipeline successfully initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG pipeline: {e}")
            raise RuntimeError(f"RAG pipeline initialization failed: {e}")
    
    def process_query(self, user_query: str) -> Dict[str, Any]:
        """
        Process user query through the complete RAG pipeline.
        
        Args:
            user_query: User's question or query
            
        Returns:
            Dictionary containing response and metadata
        """
        try:
            logger.info(f"Processing query: {user_query[:100]}...")
            
            # Step 1: Generate query embedding
            query_embedding = self._generate_query_embedding(user_query)
            
            # Step 2: Retrieve relevant documents
            retrieved_docs = self._retrieve_documents(query_embedding)
            
            # Step 3: Extract text content from retrieved documents
            context_texts = self._extract_context_texts(retrieved_docs)
            
            # Step 4: Generate response using IBM Granite
            response = self._generate_response(user_query, context_texts)
            
            # Prepare result
            result = {
                "query": user_query,
                "response": response,
                "retrieved_documents": len(retrieved_docs),
                "context_used": len(context_texts) > 0,
                "sources": self._extract_source_info(retrieved_docs)
            }
            
            logger.info(f"Query processed successfully. Retrieved {len(retrieved_docs)} documents")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "query": user_query,
                "response": f"I apologize, but I encountered an error while processing your question: {str(e)}",
                "retrieved_documents": 0,
                "context_used": False,
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
    
    def _generate_response(self, query: str, context_texts: Optional[List[str]]) -> str:
        """
        Generate response using IBM Granite with context.
        
        Args:
            query: User query
            context_texts: Retrieved context texts
            
        Returns:
            Generated response
        """
        if not self.ibm_client:
            raise RuntimeError("IBM Granite client not initialized")
        
        try:
            return self.ibm_client.generate_response(
                prompt=query,
                context_documents=context_texts if context_texts else None
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
            "ibm_client": False
        }
        
        try:
            if self.db_connector:
                health["database"] = self.db_connector.health_check()
        except:
            health["database"] = False
        
        try:
            if self.ibm_client:
                health["ibm_client"] = self.ibm_client.health_check()
        except:
            health["ibm_client"] = False
        
        return health
    
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