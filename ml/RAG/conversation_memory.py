"""
Conversation Memory System for RAG Chatbot.
Manages conversation history and context for contextual responses.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class ConversationMemory:
    """Manages conversation history and provides context for responses."""
    
    def __init__(self, max_history: int = 10, max_context_length: int = 2000):
        """
        Initialize conversation memory.
        
        Args:
            max_history: Maximum number of conversation turns to remember
            max_context_length: Maximum character length for context inclusion
        """
        self.max_history = max_history
        self.max_context_length = max_context_length
        self.conversation_history: List[Dict[str, Any]] = []
        self.session_start = datetime.now()
        
    def add_exchange(self, user_query: str, assistant_response: str, metadata: Optional[Dict] = None) -> None:
        """
        Add a conversation exchange to memory.
        
        Args:
            user_query: User's question/input
            assistant_response: Assistant's response
            metadata: Optional metadata about the exchange
        """
        exchange = {
            "timestamp": datetime.now().isoformat(),
            "user": user_query,
            "assistant": assistant_response,
            "metadata": metadata or {}
        }
        
        self.conversation_history.append(exchange)
        
        # Keep only the most recent exchanges
        if len(self.conversation_history) > self.max_history:
            self.conversation_history = self.conversation_history[-self.max_history:]
        
        logger.debug(f"Added conversation exchange. History length: {len(self.conversation_history)}")
    
    def get_conversation_context(self, include_last_n: Optional[int] = None) -> str:
        """
        Get formatted conversation context for inclusion in prompts.
        
        Args:
            include_last_n: Number of recent exchanges to include (None for all within limit)
            
        Returns:
            Formatted conversation context string
        """
        if not self.conversation_history:
            return ""
        
        # Determine how many exchanges to include
        n_exchanges = include_last_n or len(self.conversation_history)
        recent_history = self.conversation_history[-n_exchanges:]
        
        # Build context string
        context_parts = []
        total_length = 0
        
        for exchange in reversed(recent_history):  # Start with most recent
            # Format the exchange
            exchange_text = f"User: {exchange['user']}\nAssistant: {exchange['assistant']}\n"
            
            # Check if adding this exchange would exceed length limit
            if total_length + len(exchange_text) > self.max_context_length:
                break
            
            context_parts.insert(0, exchange_text)  # Insert at beginning to maintain order
            total_length += len(exchange_text)
        
        if context_parts:
            return "Previous conversation:\n" + "\n".join(context_parts) + "\n"
        return ""
    
    def get_recent_queries(self, n: int = 3) -> List[str]:
        """
        Get the most recent user queries.
        
        Args:
            n: Number of recent queries to return
            
        Returns:
            List of recent user queries
        """
        if not self.conversation_history:
            return []
        
        recent_history = self.conversation_history[-n:]
        return [exchange["user"] for exchange in recent_history]
    
    def find_related_context(self, current_query: str) -> str:
        """
        Find contextually related previous exchanges.
        
        Args:
            current_query: Current user query
            
        Returns:
            Relevant context from conversation history
        """
        if not self.conversation_history:
            return ""
        
        # Simple keyword-based relevance (can be enhanced with embeddings)
        query_words = set(current_query.lower().split())
        relevant_exchanges = []
        
        for exchange in self.conversation_history:
            # Check for keyword overlap
            user_words = set(exchange["user"].lower().split())
            assistant_words = set(exchange["assistant"].lower().split())
            
            overlap_score = len(query_words.intersection(user_words.union(assistant_words)))
            
            if overlap_score >= 2:  # At least 2 words in common
                relevant_exchanges.append((exchange, overlap_score))
        
        # Sort by relevance score and take top exchanges
        relevant_exchanges.sort(key=lambda x: x[1], reverse=True)
        top_relevant = relevant_exchanges[:3]  # Top 3 most relevant
        
        if top_relevant:
            context_parts = []
            for exchange, score in top_relevant:
                context_parts.append(f"User: {exchange['user']}\nAssistant: {exchange['assistant']}")
            
            return "Related previous discussion:\n" + "\n\n".join(context_parts) + "\n"
        
        return ""
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the current conversation.
        
        Returns:
            Dictionary containing conversation statistics and summary
        """
        if not self.conversation_history:
            return {
                "total_exchanges": 0,
                "session_duration": "0 minutes",
                "topics_discussed": []
            }
        
        # Calculate session duration
        duration = datetime.now() - self.session_start
        duration_minutes = int(duration.total_seconds() / 60)
        
        # Extract potential topics (simple keyword extraction)
        all_text = " ".join([ex["user"] + " " + ex["assistant"] for ex in self.conversation_history])
        words = all_text.lower().split()
        
        # Simple topic extraction (words longer than 4 characters, appearing multiple times)
        word_counts = {}
        for word in words:
            if len(word) > 4 and word.isalpha():
                word_counts[word] = word_counts.get(word, 0) + 1
        
        topics = [word for word, count in word_counts.items() if count >= 2][:5]
        
        return {
            "total_exchanges": len(self.conversation_history),
            "session_duration": f"{duration_minutes} minutes",
            "topics_discussed": topics,
            "last_query": self.conversation_history[-1]["user"] if self.conversation_history else None
        }
    
    def clear_history(self) -> None:
        """Clear conversation history."""
        self.conversation_history.clear()
        self.session_start = datetime.now()
        logger.info("Conversation history cleared")
    
    def export_conversation(self, filepath: Optional[str] = None) -> str:
        """
        Export conversation history to JSON file.
        
        Args:
            filepath: Optional file path for export
            
        Returns:
            JSON string of conversation history
        """
        export_data = {
            "session_start": self.session_start.isoformat(),
            "export_time": datetime.now().isoformat(),
            "conversation_history": self.conversation_history,
            "summary": self.get_conversation_summary()
        }
        
        json_data = json.dumps(export_data, indent=2)
        
        if filepath:
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(json_data)
                logger.info(f"Conversation exported to {filepath}")
            except Exception as e:
                logger.error(f"Failed to export conversation: {e}")
        
        return json_data
    
    def has_context(self) -> bool:
        """Check if there's any conversation history."""
        return len(self.conversation_history) > 0
    
    def get_context_indicators(self, query: str) -> Dict[str, Any]:
        """
        Analyze query for context indicators (pronouns, references, etc.).
        
        Args:
            query: User query to analyze
            
        Returns:
            Dictionary with context analysis
        """
        query_lower = query.lower()
        
        # Context indicators
        pronouns = ["it", "that", "this", "they", "them", "those", "these"]
        references = ["above", "before", "earlier", "previous", "last", "again"]
        follow_ups = ["also", "additionally", "furthermore", "moreover"]
        
        indicators = {
            "has_pronouns": any(pronoun in query_lower.split() for pronoun in pronouns),
            "has_references": any(ref in query_lower.split() for ref in references),
            "has_follow_ups": any(follow in query_lower.split() for follow in follow_ups),
            "needs_context": False
        }
        
        # Determine if context is likely needed
        indicators["needs_context"] = (
            indicators["has_pronouns"] or 
            indicators["has_references"] or 
            indicators["has_follow_ups"] or
            len(query.split()) < 4  # Very short queries often need context
        )
        
        return indicators