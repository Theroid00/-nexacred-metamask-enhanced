"""
Robust RAG Chatbot Configuration
================================

Secure, production-ready configuration with proper environment variable handling.
"""

import os
import logging
import sys
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from pathlib import Path

# Configure logging with proper UTF-8 encoding for Windows
class UTF8StreamHandler(logging.StreamHandler):
    """Custom stream handler that forces UTF-8 encoding"""
    def __init__(self, stream=None):
        super().__init__(stream)
        if hasattr(self.stream, 'reconfigure'):
            try:
                self.stream.reconfigure(encoding='utf-8', errors='replace')
            except:
                pass

# Configure logging with Windows-compatible settings
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('robust_rag_chatbot.log', encoding='utf-8'),
        UTF8StreamHandler(sys.stdout)
    ],
    force=True
)

class RobustRAGConfig(BaseSettings):
    """
    Production-ready configuration with security and validation.
    All sensitive data should be in environment variables.
    """

    # Model Configuration - IBM Granite 2B Instruct (as required)
    model_name: str = Field(
        default="ibm-granite/granite-3.0-2b-instruct",
        description="IBM Granite model identifier"
    )

    # Hardware Configuration
    device: str = Field(default="auto", description="Device for model (auto/cpu/cuda)")
    use_4bit_quantization: bool = Field(default=True, description="Enable 4-bit quantization for memory efficiency")
    max_memory_gb: float = Field(default=6.0, description="Maximum memory usage in GB")

    # Generation Parameters
    max_new_tokens: int = Field(default=512, ge=1, le=2048, description="Maximum tokens to generate")
    temperature: float = Field(default=0.3, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.0, le=1.0, description="Top-p sampling")
    do_sample: bool = Field(default=True, description="Enable sampling")

    # Embedding Configuration
    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="Sentence transformer model for embeddings"
    )
    embedding_dimension: int = Field(default=384, description="Embedding vector dimension")

    # MongoDB Configuration - SECURE
    mongodb_uri: str = Field(
        default="mongodb+srv://hetshah05:Hetshahmit05@nexacred.9ndp6ei.mongodb.net/financial_advice_db?retryWrites=true&w=majority&appName=nexacred",
        description="MongoDB connection string"
    )
    mongodb_database: str = Field(default="financial_advice_db", description="Database name")
    mongodb_collection: str = Field(default="documents", description="Collection name")
    mongodb_vector_index: str = Field(default="vector_index", description="Vector search index name")

    # Retrieval Configuration
    top_k_documents: int = Field(default=5, ge=1, le=20, description="Number of documents to retrieve")
    similarity_threshold: float = Field(default=0.3, ge=0.0, le=1.0, description="Minimum similarity threshold")

    # Conversation Configuration
    max_conversation_history: int = Field(default=10, description="Maximum messages to keep in memory")
    conversation_storage_dir: str = Field(default="./conversations", description="Directory for conversation storage")

    # API Configuration
    api_host: str = Field(default="127.0.0.1", description="API host")
    api_port: int = Field(default=8001, ge=1024, le=65535, description="API port")

    # Security Configuration
    enable_cors: bool = Field(default=True, description="Enable CORS")
    allowed_origins: list = Field(default=["http://localhost:3000", "http://127.0.0.1:3000"], description="Allowed CORS origins")
    request_timeout: int = Field(default=60, description="Request timeout in seconds")
    max_requests_per_minute: int = Field(default=30, description="Rate limiting")

    @field_validator('mongodb_uri')
    @classmethod
    def validate_mongodb_uri(cls, v):
        """Validate MongoDB URI format"""
        if not v.startswith(('mongodb://', 'mongodb+srv://')):
            raise ValueError('MongoDB URI must start with mongodb:// or mongodb+srv://')
        return v

    @field_validator('conversation_storage_dir')
    @classmethod
    def create_storage_dir(cls, v):
        """Create conversation storage directory if it doesn't exist"""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global configuration instance
config = RobustRAGConfig()
