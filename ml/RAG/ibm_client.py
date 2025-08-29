"""
IBM Granite AI client for text generation.
Handles connection to IBM watsonx.ai and IBM Granite foundation models.
"""

import logging
from typing import List, Optional, Dict, Any
from ibm_watson_machine_learning import APIClient
from ibm_watson_machine_learning.foundation_models import Model
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams
from config import Config

logger = logging.getLogger(__name__)

class IBMGraniteClient:
    """IBM Granite AI client for text generation."""
    
    def __init__(self):
        """Initialize IBM Granite client."""
        self.client: Optional[APIClient] = None
        self.model: Optional[Model] = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize IBM watsonx.ai client and Granite model."""
        try:
            # Set up credentials for watsonx.ai
            credentials = {
                "url": Config.IBM_URL,
                "apikey": Config.IBM_API_KEY
            }
            
            # Initialize API client
            self.client = APIClient(credentials)
            self.client.set.default_project(Config.IBM_PROJECT_ID)
            
            # Initialize IBM Granite foundation model
            # Using the exact model from your watsonx.ai interface (3.3 8b-instruct)
            # This model should be available in your project
            model_id = "ibm/granite-3-3-8b-instruct"
            
            # Granite 8B-optimized generation parameters
            generation_params = {
                GenParams.MAX_NEW_TOKENS: Config.MAX_TOKENS,
                GenParams.TEMPERATURE: Config.TEMPERATURE,
                GenParams.TOP_P: 0.85,  # Slightly lower for 8B model
                GenParams.TOP_K: 40,    # Reduced for better coherence
                GenParams.REPETITION_PENALTY: 1.03,  # Lower for 8B model
                GenParams.STOP_SEQUENCES: ["Human:", "User:", "\n\nUser:", "\n\nHuman:", "Question:"]
            }
            
            self.model = Model(
                model_id=model_id,
                params=generation_params,
                credentials=credentials,
                project_id=Config.IBM_PROJECT_ID
            )
            
            logger.info(f"Successfully initialized IBM Granite client with model: {model_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize IBM Granite client: {e}")
            raise ConnectionError(f"IBM Granite initialization failed: {e}")
    
    def generate_response(self, prompt: str, context_documents: Optional[List[str]] = None) -> str:
        """
        Generate response using IBM Granite model.
        
        Args:
            prompt: User query/prompt
            context_documents: Retrieved documents for context
            
        Returns:
            Generated response text
        """
        if not self.model:
            raise ConnectionError("IBM Granite model not initialized")
        
        try:
            # Construct the full prompt with context optimized for Granite
            full_prompt = self._construct_granite_prompt(prompt, context_documents)
            
            # Generate response
            response = self.model.generate_text(prompt=full_prompt)
            
            # Handle response format - IBM Watson ML returns different formats
            if isinstance(response, str):
                generated_text = response.strip()
            elif isinstance(response, dict):
                # Handle dict response format
                generated_text = response.get('results', [{}])[0].get('generated_text', '') if response.get('results') else str(response)
            elif isinstance(response, list):
                # Handle list response format
                generated_text = response[0].get('generated_text', '') if response and isinstance(response[0], dict) else str(response)
            else:
                # Fallback - convert to string
                generated_text = str(response)
            
            # Remove any potential prompt echoing
            if generated_text.startswith("Assistant:"):
                generated_text = generated_text[10:].strip()
            
            logger.info(f"Generated response of length: {len(generated_text)}")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            raise RuntimeError(f"Text generation error: {e}")
    
    def _construct_granite_prompt(self, user_query: str, context_documents: Optional[List[str]] = None) -> str:
        """
        Construct a Granite 8B-optimized prompt with context.
        IBM Granite 8B works best with concise, direct prompts.
        
        Args:
            user_query: User's question
            context_documents: Retrieved context documents
            
        Returns:
            Formatted prompt string optimized for Granite 8B
        """
        if context_documents:
            # Format context documents (limit for 8B model)
            context = ""
            for i, doc in enumerate(context_documents[:3], 1):  # Limit to top 3 docs for 8B
                # Truncate each document to avoid overwhelming the 8B model
                truncated_doc = doc[:800] + "..." if len(doc) > 800 else doc
                context += f"Source {i}: {truncated_doc}\n\n"
            
            # Granite 8B-optimized RAG prompt (more concise)
            prompt = f"""Answer the question using the provided sources. Be accurate and concise.

Sources:
{context}

Question: {user_query}

Answer:"""
        else:
            # Simple prompt for general questions
            prompt = f"""Question: {user_query}

Answer:"""
        
        return prompt
    
    def health_check(self) -> bool:
        """
        Check if IBM Granite client is healthy.
        
        Returns:
            True if client is healthy, False otherwise
        """
        try:
            if self.model:
                # Simple test generation with Granite
                test_response = self.model.generate_text(
                    prompt="Test prompt for health check. Respond with 'OK'."
                )
                # Handle different response formats
                if isinstance(test_response, str):
                    return len(test_response.strip()) > 0
                elif isinstance(test_response, dict):
                    result = test_response.get('results', [{}])[0].get('generated_text', '') if test_response.get('results') else ''
                    return len(str(result).strip()) > 0
                else:
                    return len(str(test_response).strip()) > 0
            return False
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def get_available_granite_models(self) -> List[Dict[str, Any]]:
        """
        Get list of available IBM Granite models.
        
        Returns:
            List of available Granite models
        """
        granite_models = [
            {
                "model_id": "ibm/granite-8b-code-instruct",
                "description": "IBM Granite 8B Code Instruct - Efficient model optimized for instructions",
                "recommended_for": "RAG, Q&A, Instructions (faster performance)"
            },
            {
                "model_id": "ibm/granite-13b-instruct-v2",
                "description": "IBM Granite 13B Instruct - Larger model for complex instructions",
                "recommended_for": "Complex RAG, Advanced Q&A"
            },
            {
                "model_id": "ibm/granite-13b-chat-v2", 
                "description": "IBM Granite 13B Chat - Optimized for conversations",
                "recommended_for": "Chatbots, Dialogue"
            },
            {
                "model_id": "ibm/granite-20b-multilingual",
                "description": "IBM Granite 20B Multilingual - Supports multiple languages",
                "recommended_for": "Multilingual applications"
            },
            {
                "model_id": "ibm/granite-3b-code-instruct",
                "description": "IBM Granite 3B Code - Smallest model for simple tasks",
                "recommended_for": "Simple tasks, resource-constrained environments"
            }
        ]
        
        try:
            # For now, return the predefined Granite models
            # The API structure for foundation models may vary
            return granite_models
            
        except Exception as e:
            logger.error(f"Failed to get available models: {e}")
            return granite_models