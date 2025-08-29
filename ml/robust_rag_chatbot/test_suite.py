"""
Comprehensive Test Suite for Robust RAG Chatbot
===============================================

Tests all components with proper error handling and edge cases.
"""

import pytest
import asyncio
import time
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch
import numpy as np

from config import RobustRAGConfig
from robust_rag_chatbot import RobustRAGChatbot
from model_manager import ModelManager
from embedding_manager import EmbeddingManager
from mongodb_retriever import MongoDBRetriever, Document
from conversation_manager import ConversationManager

class TestConfig:
    """Test configuration"""
    @pytest.fixture
    def test_config(self):
        """Create test configuration"""
        return RobustRAGConfig(
            model_name="microsoft/DialoGPT-medium",  # Smaller model for testing
            embedding_model="sentence-transformers/all-MiniLM-L6-v2",
            max_new_tokens=50,
            conversation_storage_dir=tempfile.mkdtemp(),
            mongodb_uri="mongodb://localhost:27017/test_db",
            use_4bit_quantization=False,  # Disable for testing
            max_memory_gb=2.0
        )

class TestEmbeddingManager:
    """Test embedding manager functionality"""

    def test_embedding_manager_initialization(self, test_config):
        """Test embedding manager initialization"""
        embedding_manager = EmbeddingManager(test_config)
        assert embedding_manager.config == test_config
        assert not embedding_manager._is_loaded

    def test_embedding_generation(self, test_config):
        """Test embedding generation"""
        embedding_manager = EmbeddingManager(test_config)

        # Mock the model loading to avoid downloading
        with patch.object(embedding_manager, 'load_model', return_value=True):
            with patch.object(embedding_manager, 'model') as mock_model:
                mock_model.encode.return_value = np.array([[0.1, 0.2, 0.3]])
                embedding_manager._is_loaded = True

                result = embedding_manager.embed_text("test text")
                assert result is not None
                assert len(result) == 3

    def test_embedding_error_handling(self, test_config):
        """Test embedding error handling"""
        embedding_manager = EmbeddingManager(test_config)

        # Test with unloaded model
        result = embedding_manager.embed_text("test")
        assert result is None

class TestConversationManager:
    """Test conversation manager functionality"""

    def test_conversation_creation(self, test_config):
        """Test conversation creation"""
        conv_manager = ConversationManager(test_config)
        session_id = conv_manager.create_conversation("test_user")

        assert session_id is not None
        assert len(session_id) == 36  # UUID length

        # Clean up
        shutil.rmtree(test_config.conversation_storage_dir)

    def test_message_addition(self, test_config):
        """Test adding messages to conversation"""
        conv_manager = ConversationManager(test_config)
        session_id = conv_manager.create_conversation("test_user")

        # Add user message
        success = conv_manager.add_message(session_id, "user", "Hello")
        assert success

        # Add assistant message
        success = conv_manager.add_message(session_id, "assistant", "Hi there!")
        assert success

        # Get conversation
        conversation = conv_manager.get_conversation(session_id)
        assert conversation is not None
        assert len(conversation.messages) == 2

        # Clean up
        shutil.rmtree(test_config.conversation_storage_dir)

    def test_conversation_context(self, test_config):
        """Test conversation context generation"""
        conv_manager = ConversationManager(test_config)
        session_id = conv_manager.create_conversation("test_user")

        # Add some messages
        conv_manager.add_message(session_id, "user", "What is credit scoring?")
        conv_manager.add_message(session_id, "assistant", "Credit scoring is...")
        conv_manager.add_message(session_id, "user", "How is it calculated?")

        context = conv_manager.get_conversation_context(session_id, max_messages=4)
        assert "What is credit scoring?" in context
        assert "Credit scoring is..." in context

        # Clean up
        shutil.rmtree(test_config.conversation_storage_dir)

class TestMongoDBRetriever:
    """Test MongoDB retriever functionality"""

    def test_retriever_initialization(self, test_config):
        """Test retriever initialization"""
        with patch('pymongo.MongoClient') as mock_client:
            mock_client.return_value.admin.command.return_value = True

            retriever = MongoDBRetriever(test_config)
            assert retriever.config == test_config

    def test_fallback_documents(self, test_config):
        """Test fallback document retrieval"""
        with patch('pymongo.MongoClient') as mock_client:
            mock_client.side_effect = Exception("Connection failed")

            retriever = MongoDBRetriever(test_config)
            query_embedding = np.array([0.1, 0.2, 0.3])

            documents = retriever.retrieve_documents(query_embedding, top_k=3)
            assert len(documents) > 0
            assert all(isinstance(doc, Document) for doc in documents)

class TestModelManager:
    """Test model manager functionality"""

    def test_model_manager_initialization(self, test_config):
        """Test model manager initialization"""
        model_manager = ModelManager(test_config)
        assert model_manager.config == test_config
        assert not model_manager._is_loaded

    def test_memory_requirements_check(self, test_config):
        """Test memory requirements validation"""
        model_manager = ModelManager(test_config)

        # Should pass with reasonable requirements
        result = model_manager._check_memory_requirements()
        assert isinstance(result, bool)

    def test_device_determination(self, test_config):
        """Test device determination logic"""
        model_manager = ModelManager(test_config)
        device = model_manager._determine_device()

        assert device in ["cpu", "cuda:0"]

class TestRobustRAGChatbot:
    """Test main chatbot functionality"""

    def test_chatbot_initialization(self, test_config):
        """Test chatbot initialization"""
        chatbot = RobustRAGChatbot({"conversation_storage_dir": test_config.conversation_storage_dir})
        assert chatbot.config is not None
        assert not chatbot._initialized

    def test_conversation_flow(self, test_config):
        """Test basic conversation flow"""
        with patch.multiple(
            'robust_rag_chatbot.RobustRAGChatbot',
            _initialize_components=Mock(return_value=True),
            _generate_rag_response=Mock(return_value="Test response")
        ):
            chatbot = RobustRAGChatbot({"conversation_storage_dir": test_config.conversation_storage_dir})
            chatbot._initialized = True

            session_id = chatbot.start_conversation("test_user")
            assert session_id is not None

            response = chatbot.chat("Test question", session_id)
            assert response == "Test response"

        # Clean up
        shutil.rmtree(test_config.conversation_storage_dir)

    def test_error_handling(self, test_config):
        """Test error handling in chat"""
        chatbot = RobustRAGChatbot({"conversation_storage_dir": test_config.conversation_storage_dir})

        # Test with uninitialized chatbot
        response = chatbot.chat("Test question")
        assert "initialization issues" in response.lower()

        # Clean up
        shutil.rmtree(test_config.conversation_storage_dir)

class TestAPIIntegration:
    """Test API integration (requires running API server)"""

    @pytest.mark.asyncio
    async def test_api_health_check(self):
        """Test API health check endpoint"""
        import httpx

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("http://127.0.0.1:8001/health", timeout=5.0)
                assert response.status_code == 200
                data = response.json()
                assert "healthy" in data
        except httpx.ConnectError:
            pytest.skip("API server not running")

    @pytest.mark.asyncio
    async def test_api_chat_endpoint(self):
        """Test API chat endpoint"""
        import httpx

        try:
            async with httpx.AsyncClient() as client:
                # Create conversation
                conv_response = await client.post(
                    "http://127.0.0.1:8001/conversations/new",
                    params={"user_id": "test_user"},
                    timeout=10.0
                )
                assert conv_response.status_code == 200
                session_id = conv_response.json()["session_id"]

                # Send chat message
                chat_response = await client.post(
                    "http://127.0.0.1:8001/chat",
                    json={
                        "message": "What are RBI guidelines?",
                        "session_id": session_id,
                        "user_id": "test_user"
                    },
                    timeout=30.0
                )
                assert chat_response.status_code == 200
                data = chat_response.json()
                assert "response" in data
                assert len(data["response"]) > 0
        except httpx.ConnectError:
            pytest.skip("API server not running")

# Performance tests
class TestPerformance:
    """Performance and stress tests"""

    def test_embedding_performance(self, test_config):
        """Test embedding generation performance"""
        embedding_manager = EmbeddingManager(test_config)

        with patch.object(embedding_manager, 'load_model', return_value=True):
            with patch.object(embedding_manager, 'model') as mock_model:
                mock_model.encode.return_value = np.random.rand(10, 384)
                embedding_manager._is_loaded = True

                # Test batch processing
                texts = ["Test text " + str(i) for i in range(10)]
                start_time = time.time()

                results = embedding_manager.embed_texts(texts)

                end_time = time.time()
                processing_time = end_time - start_time

                assert results is not None
                assert len(results) == 10
                assert processing_time < 5.0  # Should be fast with mocked model

    def test_conversation_storage_performance(self, test_config):
        """Test conversation storage performance"""
        conv_manager = ConversationManager(test_config)

        # Create multiple conversations
        session_ids = []
        start_time = time.time()

        for i in range(100):
            session_id = conv_manager.create_conversation(f"user_{i}")
            session_ids.append(session_id)

            # Add some messages
            conv_manager.add_message(session_id, "user", f"Message {i}")
            conv_manager.add_message(session_id, "assistant", f"Response {i}")

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(session_ids) == 100
        assert processing_time < 10.0  # Should complete within 10 seconds

        # Clean up
        shutil.rmtree(test_config.conversation_storage_dir)

# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
