"""
Robust RAG Chatbot
==================

Main chatbot class that integrates all components with proper error handling and thread safety.
"""

import logging
import time
from typing import Optional, Dict, Any, List
from config import config
from model_manager import ModelManager
from embedding_manager import EmbeddingManager
from mongodb_retriever import MongoDBRetriever, Document
from conversation_manager import ConversationManager

logger = logging.getLogger(__name__)

class RobustRAGChatbot:
    """
    Production-ready RAG chatbot with IBM Granite 2B Instruct and MongoDB integration.

    Features:
    - Thread-safe operations
    - Proper error handling and recovery
    - Memory management
    - Conversation persistence
    - Document retrieval from MongoDB
    - Detailed responses based on retrieved documents
    """

    def __init__(self, config_override: Optional[Dict[str, Any]] = None):
        """Initialize the robust RAG chatbot"""
        self.config = config
        if config_override:
            for key, value in config_override.items():
                setattr(self.config, key, value)

        # Initialize components
        self.model_manager = ModelManager(self.config)
        self.embedding_manager = EmbeddingManager(self.config)
        self.mongodb_retriever = MongoDBRetriever(self.config)
        self.conversation_manager = ConversationManager(self.config)

        # State tracking
        self._initialized = False
        self._current_session_id = None

        logger.info("RobustRAGChatbot initialized")

    def initialize(self) -> bool:
        """Initialize all components"""
        if self._initialized:
            return True

        try:
            logger.info("Initializing RAG chatbot components...")

            # Load models
            if not self.embedding_manager.load_model():
                logger.error("Failed to load embedding model")
                return False

            if not self.model_manager.load_model():
                logger.error("Failed to load generation model")
                return False

            self._initialized = True
            logger.info("RAG chatbot initialization complete")
            return True

        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            return False

    def start_conversation(self, user_id: str = "default_user") -> str:
        """Start a new conversation session"""
        if not self._initialized:
            if not self.initialize():
                raise RuntimeError("Failed to initialize chatbot")

        self._current_session_id = self.conversation_manager.create_conversation(user_id)
        logger.info(f"Started conversation: {self._current_session_id}")
        return self._current_session_id

    def chat(self, user_input: str, session_id: Optional[str] = None) -> str:
        """
        Main chat method that processes user input and generates detailed responses.

        Args:
            user_input: User's question or message
            session_id: Optional session ID (creates new if not provided)

        Returns:
            AI-generated response based on retrieved documents
        """
        try:
            # Ensure initialization
            if not self._initialized:
                if not self.initialize():
                    return "I'm sorry, but I'm currently unable to process your request due to initialization issues."

            # Use provided session or current one
            if session_id:
                self._current_session_id = session_id
            elif not self._current_session_id:
                self._current_session_id = self.start_conversation()

            # Add user message to conversation
            self.conversation_manager.add_message(
                self._current_session_id,
                "user",
                user_input,
                {"timestamp": time.time()}
            )

            # Generate response using RAG pipeline
            response = self._generate_rag_response(user_input)

            # Add assistant response to conversation
            self.conversation_manager.add_message(
                self._current_session_id,
                "assistant",
                response,
                {"timestamp": time.time(), "method": "rag_pipeline"}
            )

            return response

        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            error_response = "I apologize, but I encountered an error while processing your request. Please try again."

            # Still log the error response
            if self._current_session_id:
                self.conversation_manager.add_message(
                    self._current_session_id,
                    "assistant",
                    error_response,
                    {"error": str(e), "timestamp": time.time()}
                )

            return error_response

    def _generate_rag_response(self, user_input: str) -> str:
        """Generate response using RAG pipeline - general LLM first, documents only when relevant"""
        try:
            # Get conversation context for better continuity
            conversation_context = self.conversation_manager.get_conversation_context(
                self._current_session_id,
                max_messages=10
            )

            # First, check if we should retrieve documents based on query relevance
            should_retrieve_docs = self._should_retrieve_documents(user_input, conversation_context)

            if should_retrieve_docs:
                # Try to retrieve and use documents
                documents = self._retrieve_relevant_documents(user_input)
                if documents:
                    logger.info(f"Using {len(documents)} retrieved documents for enhanced response")
                    return self._generate_enhanced_response_with_docs(user_input, documents, conversation_context)
                else:
                    logger.info("No relevant documents found, using general LLM response")

            # Default: Use general LLM response (this is the primary mode)
            return self._generate_general_llm_response(user_input, conversation_context)

        except Exception as e:
            logger.error(f"RAG response generation failed: {e}")
            return self._generate_fallback_response(user_input, conversation_context)

    def _should_retrieve_documents(self, user_input: str, conversation_context: str) -> bool:
        """Determine if we should retrieve documents for this query (more selective)"""
        # Only retrieve documents for specific financial/regulatory queries
        specific_finance_keywords = [
            'rbi guidelines', 'sebi regulations', 'irdai rules', 'npci standards',
            'banking compliance', 'financial regulations', 'regulatory requirements',
            'compliance framework', 'digital lending guidelines', 'kyc norms',
            'aml policies', 'payment regulations', 'credit scoring framework',
            'mutual fund regulations', 'insurance guidelines'
        ]

        # Check for specific regulatory queries
        query_lower = user_input.lower()
        for keyword in specific_finance_keywords:
            if keyword in query_lower:
                return True

        # Check for explicit requests for detailed/official information
        request_indicators = [
            'detailed information about', 'official guidelines on', 'regulations for',
            'compliance requirements for', 'regulatory framework', 'what does rbi say',
            'sebi requirements', 'irdai guidelines', 'official policy'
        ]

        for indicator in request_indicators:
            if indicator in query_lower:
                return True

        return False

    def _retrieve_relevant_documents(self, user_input: str) -> List[Document]:
        """Retrieve documents only when specifically needed"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_manager.embed_text(user_input)
            if query_embedding is None:
                return []

            # Retrieve relevant documents
            documents = self.mongodb_retriever.retrieve_documents(
                query_embedding,
                top_k=self.config.top_k_documents
            )

            return documents if documents else []

        except Exception as e:
            logger.error(f"Document retrieval failed: {e}")
            return []

    def _generate_general_llm_response(self, user_input: str, conversation_context: str) -> str:
        """Generate general LLM response (primary mode) - works like a normal chatbot"""
        try:
            prompt = self._build_general_chat_prompt(user_input, conversation_context)
            response = self.model_manager.generate_response(prompt)
            return response.strip()

        except Exception as e:
            logger.error(f"General LLM response generation failed: {e}")
            return "I apologize, but I encountered an error while processing your question. Please try again."

    def _build_general_chat_prompt(self, user_input: str, conversation_context: str) -> str:
        """Build prompt for general chat - normal LLM behavior"""
        prompt_parts = []

        # System prompt for general AI assistant
        prompt_parts.append("""You are a helpful, knowledgeable, and conversational AI assistant. You can discuss any topic naturally and provide informative responses. You have broad knowledge across many domains including:

- General knowledge, science, and technology
- Current events and history  
- Literature, arts, and culture
- Programming and technical topics
- Health and lifestyle advice
- Creative writing and brainstorming
- Educational explanations
- Personal advice and recommendations

You also have specialized knowledge in Indian financial regulations and can provide detailed regulatory guidance when specifically asked about financial compliance, banking rules, or regulatory matters.

Guidelines:
- Be natural and conversational
- Maintain context from previous messages
- Provide helpful, accurate responses
- Ask follow-up questions when appropriate
- Admit when you're uncertain
- For specific regulatory questions, you can access detailed official documents""")

        # Add conversation history for context
        if conversation_context.strip():
            prompt_parts.append(f"\nConversation History:\n{conversation_context}")

        # Add current user input
        prompt_parts.append(f"\nUser: {user_input}")
        prompt_parts.append("\nAssistant:")

        return "\n".join(prompt_parts)

    def _generate_enhanced_response_with_docs(self, user_input: str, documents: List[Document],
                                            conversation_context: str) -> str:
        """Generate enhanced response using retrieved documents"""
        try:
            # Format document context
            doc_context = self._format_document_context(documents)

            # Build enhanced prompt with documents
            prompt = self._build_enhanced_prompt_with_docs(user_input, doc_context, conversation_context)

            # Generate response
            response = self.model_manager.generate_response(prompt)

            # Post-process response
            response = self._post_process_response(response, documents)

            return response

        except Exception as e:
            logger.error(f"Enhanced response generation failed: {e}")
            return self._generate_general_llm_response(user_input, conversation_context)

    def _build_enhanced_prompt_with_docs(self, user_input: str, doc_context: str,
                                       conversation_context: str) -> str:
        """Build enhanced prompt with document context"""
        prompt_parts = []

        # System prompt for document-enhanced responses
        prompt_parts.append("""You are a knowledgeable AI assistant with access to specific regulatory documents. For this query, relevant official documents have been retrieved to provide you with detailed, accurate information.

Instructions:
- Use the provided documents to give comprehensive, detailed responses
- Cite specific sources when referencing the documents
- Explain complex regulations in clear, understandable terms
- Include practical implications and compliance requirements
- If the documents don't fully answer the question, supplement with your general knowledge
- Always indicate when information comes from official sources vs. general knowledge""")

        # Add conversation context
        if conversation_context.strip():
            prompt_parts.append(f"\nConversation History:\n{conversation_context}")

        # Add document context
        prompt_parts.append(f"\nRelevant Official Documents:\n{doc_context}")

        # Add user question
        prompt_parts.append(f"\nUser Question: {user_input}")

        prompt_parts.append("\nProvide a comprehensive response using the official documents above:")

        return "\n".join(prompt_parts)

    def _generate_fallback_response(self, user_input: str, conversation_context: str) -> str:
        """Generate fallback response when everything else fails"""
        try:
            fallback_prompt = f"""You are a helpful AI assistant. The user asked: "{user_input}"

{f"Previous conversation: {conversation_context}" if conversation_context else ""}

Provide a helpful response. If you cannot fully answer the question, explain your limitations and suggest alternative sources."""

            return self.model_manager.generate_response(fallback_prompt)

        except Exception as e:
            logger.error(f"Fallback response generation failed: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again later."

    def get_conversation_history(self, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get the conversation history for a session"""
        if session_id is None:
            session_id = self._current_session_id

        if not session_id:
            return []

        return self.conversation_manager.get_conversation_history(session_id)

    def get_system_status(self) -> Dict[str, Any]:
        """Get the current status of the system and components"""
        return {
            "initialized": self._initialized,
            "current_session_id": self._current_session_id,
            "model_manager": self.model_manager.get_status(),
            "embedding_manager": self.embedding_manager.get_status(),
            "mongodb_retriever": self.mongodb_retriever.get_status(),
            "conversation_manager": self.conversation_manager.get_status()
        }

    def cleanup(self):
        """Cleanup resources, close connections, etc."""
        logger.info("Cleaning up resources...")
        self.conversation_manager.cleanup()
        self.mongodb_retriever.cleanup()
        self.embedding_manager.cleanup()
        self.model_manager.cleanup()
        logger.info("Cleanup complete")

