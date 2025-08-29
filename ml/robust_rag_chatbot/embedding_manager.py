"""
Embedding Manager
================

Thread-safe embedding generation with proper model management.
"""

import logging
import threading
import numpy as np
from typing import List, Optional
from sentence_transformers import SentenceTransformer
import torch

logger = logging.getLogger(__name__)

class EmbeddingManager:
    """
    Thread-safe embedding manager for sentence transformers.
    """

    def __init__(self, config):
        self.config = config
        self.model = None
        self._lock = threading.Lock()
        self._is_loaded = False

        logger.info(f"EmbeddingManager initialized with model: {config.embedding_model}")

    def load_model(self) -> bool:
        """Load the embedding model with thread safety"""
        with self._lock:
            if self._is_loaded:
                return True

            try:
                logger.info(f"Loading embedding model: {self.config.embedding_model}")

                device = "cuda" if torch.cuda.is_available() else "cpu"
                self.model = SentenceTransformer(
                    self.config.embedding_model,
                    device=device
                )

                self._is_loaded = True
                logger.info(f"Embedding model loaded successfully on {device}")
                return True

            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                return False

    def embed_text(self, text: str) -> Optional[np.ndarray]:
        """Generate embedding for a single text"""
        texts = [text]
        embeddings = self.embed_texts(texts)
        return embeddings[0] if embeddings else None

    def embed_texts(self, texts: List[str]) -> Optional[List[np.ndarray]]:
        """Generate embeddings for multiple texts"""
        if not self._is_loaded:
            if not self.load_model():
                return None

        try:
            with self._lock:
                # Clean and validate texts
                clean_texts = []
                for text in texts:
                    if isinstance(text, str) and text.strip():
                        clean_texts.append(text.strip())
                    else:
                        clean_texts.append("empty text")  # Fallback

                if not clean_texts:
                    return None

                # Generate embeddings
                embeddings = self.model.encode(
                    clean_texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )

                # Convert to list of arrays
                if len(embeddings.shape) == 1:
                    return [embeddings]
                else:
                    return [embedding for embedding in embeddings]

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            return None

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings"""
        if not self._is_loaded:
            if not self.load_model():
                return self.config.embedding_dimension  # Fallback

        try:
            return self.model.get_sentence_embedding_dimension()
        except Exception:
            return self.config.embedding_dimension

    def unload_model(self):
        """Unload the embedding model"""
        with self._lock:
            try:
                if self.model is not None:
                    del self.model
                    self.model = None
                    self._is_loaded = False

                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()

                    logger.info("Embedding model unloaded")
            except Exception as e:
                logger.error(f"Error unloading embedding model: {e}")

    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self._is_loaded
