"""
MongoDB Atlas database connector for vector search operations.
Handles connection to MongoDB Atlas and vector similarity search.
"""

import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from config import Config

logger = logging.getLogger(__name__)

class MongoDBAtlasConnector:
    """MongoDB Atlas connector for vector search operations."""
    
    def __init__(self):
        """Initialize MongoDB Atlas connection."""
        self.client: Optional[MongoClient] = None
        self.database: Optional[Database] = None
        self.collection: Optional[Collection] = None
        self._connect()
    
    def _connect(self) -> None:
        """Establish connection to MongoDB Atlas."""
        try:
            self.client = MongoClient(Config.MONGODB_URI)
            self.database = self.client[Config.MONGODB_DATABASE]
            self.collection = self.database[Config.MONGODB_COLLECTION]
            
            # Test connection
            self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB Atlas")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB Atlas: {e}")
            raise ConnectionError(f"MongoDB Atlas connection failed: {e}")
    
    def vector_search(self, query_vector: List[float], top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search in MongoDB Atlas.
        
        Args:
            query_vector: Query vector for similarity search
            top_k: Number of top results to return
            
        Returns:
            List of documents with similarity scores
        """
        if self.collection is None:
            raise ConnectionError("MongoDB connection not established")
        
        if top_k is None:
            top_k = Config.TOP_K_RESULTS
        
        try:
            # MongoDB Atlas Vector Search aggregation pipeline
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",  # Adjust this to your index name
                        "path": "embedding",      # Adjust this to your embedding field name
                        "queryVector": query_vector,
                        "numCandidates": top_k * 10,  # Search more candidates for better results
                        "limit": top_k
                    }
                },
                {
                    "$addFields": {
                        "score": {"$meta": "vectorSearchScore"}
                    }
                },
                {
                    "$match": {
                        "score": {"$gte": Config.SIMILARITY_THRESHOLD}
                    }
                }
            ]
            
            results = list(self.collection.aggregate(pipeline))
            
            logger.info(f"Found {len(results)} documents with similarity >= {Config.SIMILARITY_THRESHOLD}")
            
            return results
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            raise RuntimeError(f"Vector search error: {e}")
    
    def get_document_content(self, results: List[Dict[str, Any]]) -> List[str]:
        """
        Extract text content from search results.
        
        Args:
            results: List of documents from vector search
            
        Returns:
            List of text contents
        """
        texts = []
        
        for doc in results:
            # Adjust field names based on your document structure
            content = doc.get('content', '') or doc.get('text', '') or doc.get('document', '')
            if content:
                texts.append(content)
                
        return texts
    
    def close_connection(self) -> None:
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close_connection()
    
    def health_check(self) -> bool:
        """
        Check if MongoDB connection is healthy.
        
        Returns:
            True if connection is healthy, False otherwise
        """
        try:
            if self.client:
                self.client.admin.command('ping')
                return True
            return False
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False