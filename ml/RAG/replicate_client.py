"""
Replicate AI client for IBM Granite models.
Handles connection to Replicate hosting IBM Granite foundation models.
"""

import logging
from typing import List, Optional, Dict, Any
import replicate
from config import Config

logger = logging.getLogger(__name__)

class ReplicateGraniteClient:
    """Replicate client specifically optimized for IBM Granite models."""
    
    def __init__(self):
        """Initialize Replicate Granite client."""
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize Replicate client for IBM Granite models."""
        try:
            # Set API token
            replicate.api_token = Config.REPLICATE_API_TOKEN
            
            # Test the connection
            self.client = replicate
            
            logger.info(f"Successfully initialized Replicate client with IBM Granite model: {Config.REPLICATE_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Replicate Granite client: {e}")
            raise ConnectionError(f"Replicate Granite initialization failed: {e}")
    
    def generate_response(self, prompt: str, context_documents: Optional[List[str]] = None, 
                         conversation_context: Optional[str] = None) -> str:
        """
        Generate response using IBM Granite model on Replicate.
        
        Args:
            prompt: User query/prompt
            context_documents: Retrieved documents for context
            conversation_context: Previous conversation context
            
        Returns:
            Generated response text
        """
        if not self.client:
            raise ConnectionError("Replicate Granite client not initialized")
        
        try:
            # Construct the full prompt with context optimized for Granite
            full_prompt = self._construct_granite_prompt(prompt, context_documents, conversation_context)
            
            # Generate response using IBM Granite on Replicate
            # Granite 8B-optimized parameters matching the original IBM settings
            response = replicate.run(
                Config.REPLICATE_MODEL,
                input={
                    "prompt": full_prompt,
                    "max_new_tokens": Config.MAX_TOKENS,
                    "temperature": Config.TEMPERATURE,
                    "top_p": 0.85,  # Slightly lower for 8B model
                    "top_k": 40,    # Reduced for better coherence
                    "repetition_penalty": 1.03,  # Lower for 8B model
                    "stop": ["Human:", "User:", "\n\nUser:", "\n\nHuman:", "Question:"]
                }
            )
            
            # Handle response format - Replicate returns a generator/iterator
            if hasattr(response, '__iter__'):
                generated_text = ''.join(response)
            else:
                generated_text = str(response)
            
            # Clean up the response
            generated_text = generated_text.strip()
            
            # Remove any potential prompt echoing (Granite-specific cleanup)
            if "Assistant:" in generated_text:
                assistant_idx = generated_text.rfind("Assistant:")
                if assistant_idx != -1:
                    generated_text = generated_text[assistant_idx + 10:].strip()
            
            logger.info(f"Generated Granite response of length: {len(generated_text)}")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Granite text generation failed: {e}")
            raise RuntimeError(f"Granite text generation error: {e}")
    
    def _construct_granite_prompt(self, user_query: str, context_documents: Optional[List[str]] = None, 
                                 conversation_context: Optional[str] = None) -> str:
        """
        Construct a Granite-optimized prompt with context and conversation history.
        IBM Granite works best with clear, structured prompts.
        
        Args:
            user_query: User's question
            context_documents: Retrieved context documents
            conversation_context: Previous conversation context
            
        Returns:
            Formatted prompt string optimized for IBM Granite
        """
        prompt_parts = []
        
        # Add conversation context if available
        if conversation_context and conversation_context.strip():
            prompt_parts.append(conversation_context.strip())
        
        # Add document context if available
        if context_documents:
            # Format context documents (limit for efficiency)
            context = ""
            for i, doc in enumerate(context_documents[:3], 1):  # Limit to top 3 docs
                # Truncate each document to avoid overwhelming the model
                truncated_doc = doc[:800] + "..." if len(doc) > 800 else doc
                context += f"Source {i}: {truncated_doc}\n\n"
            
            prompt_parts.append(f"Sources:\n{context}")
        
        # Add the main instruction and query
        if context_documents or conversation_context:
            instruction = "Answer the question using the provided information. Be accurate and consider the conversation context if relevant."
        else:
            instruction = "Answer the question clearly and accurately."
        
        prompt_parts.extend([
            instruction,
            f"Question: {user_query}",
            "Answer:"
        ])
        
        return "\n\n".join(prompt_parts)
    
    def health_check(self) -> bool:
        """
        Check if Replicate Granite client is healthy.
        
        Returns:
            True if client is healthy, False otherwise
        """
        try:
            if self.client:
                # Simple test generation with Granite
                test_response = replicate.run(
                    Config.REPLICATE_MODEL,
                    input={
                        "prompt": "Test prompt for health check. Respond with 'OK'.",
                        "max_new_tokens": 10,
                        "temperature": 0.1
                    }
                )
                
                # Handle response format
                if hasattr(test_response, '__iter__'):
                    result = ''.join(test_response)
                else:
                    result = str(test_response)
                
                return len(result.strip()) > 0
            return False
        except Exception as e:
            logger.error(f"Granite health check failed: {e}")
            return False
    
    def get_available_granite_models(self) -> List[Dict[str, Any]]:
        """
        Get list of available IBM Granite models on Replicate.
        
        Returns:
            List of available Granite models
        """
        granite_models = [
            {
                "model_id": "ibm-granite/granite-3.3-8b-instruct",
                "description": "IBM Granite 3.3 8B Instruct - Latest efficient model optimized for instructions",
                "recommended_for": "RAG, Q&A, Instructions (best performance)",
                "context_length": "8K tokens"
            },
            {
                "model_id": "ibm-granite/granite-3.0-8b-instruct",
                "description": "IBM Granite 3.0 8B Instruct - Previous version, stable performance",
                "recommended_for": "RAG, Q&A, Instructions",
                "context_length": "8K tokens"
            },
            {
                "model_id": "ibm-granite/granite-3.0-3b-a800m-instruct", 
                "description": "IBM Granite 3.0 3B Instruct - Smaller model for simple tasks",
                "recommended_for": "Simple tasks, resource-constrained environments",
                "context_length": "4K tokens"
            }
        ]
        
        return granite_models