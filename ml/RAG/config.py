"""
Configuration module for RAG chatbot.
Loads environment variables and provides configuration settings.
"""

import os
import logging
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for RAG chatbot settings."""
    
    # Replicate AI Configuration  
    REPLICATE_API_TOKEN: str = os.getenv("REPLICATE_API_TOKEN", "r8_5tiCkDeDCv1j1zykH46zcsugv1cOu202WB3kQ")
    REPLICATE_MODEL: str = os.getenv("REPLICATE_MODEL", "ibm-granite/granite-3.3-8b-instruct")
    
    # MongoDB Atlas Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "rag_database")
    MONGODB_COLLECTION: str = os.getenv("MONGODB_COLLECTION", "documents")
    
    # RAG Configuration
    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "5"))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "512"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def validate_config(cls) -> tuple[bool, list[str]]:
        """
        Validate that all required configuration values are present.
        
        Returns:
            tuple: (is_valid, list_of_missing_keys)
        """
        missing_keys = []
        
        if not cls.REPLICATE_API_TOKEN:
            missing_keys.append("REPLICATE_API_TOKEN")
        if not cls.MONGODB_URI:
            missing_keys.append("MONGODB_URI")
            
        return len(missing_keys) == 0, missing_keys
    
    @classmethod
    def setup_logging(cls):
        """Setup logging configuration."""
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL.upper()),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

# Initialize logging
Config.setup_logging()