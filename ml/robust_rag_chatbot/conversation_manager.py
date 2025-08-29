"""
Conversation Manager
===================

Thread-safe conversation management with persistent storage and proper error handling.
"""

import logging
import json
import uuid
import threading
from datetime import datetime, UTC
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class Message:
    """Individual message in a conversation"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata or {}
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        """Create from dictionary"""
        return cls(
            role=data["role"],
            content=data["content"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            metadata=data.get("metadata", {})
        )

@dataclass
class Conversation:
    """Complete conversation session"""
    session_id: str
    user_id: str
    messages: List[Message]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata or {}
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Conversation':
        """Create from dictionary"""
        return cls(
            session_id=data["session_id"],
            user_id=data["user_id"],
            messages=[Message.from_dict(msg) for msg in data["messages"]],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            metadata=data.get("metadata", {})
        )

class ConversationManager:
    """
    Thread-safe conversation manager with persistent file storage.
    """

    def __init__(self, config):
        self.config = config
        self.storage_dir = Path(config.conversation_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Thread-safe in-memory cache
        self._conversations: Dict[str, Conversation] = {}
        self._lock = threading.RLock()

        logger.info(f"ConversationManager initialized with storage: {self.storage_dir}")

    def create_conversation(self, user_id: str = "default_user") -> str:
        """Create a new conversation session"""
        session_id = str(uuid.uuid4())
        now = datetime.now(UTC)

        conversation = Conversation(
            session_id=session_id,
            user_id=user_id,
            messages=[],
            created_at=now,
            updated_at=now,
            metadata={"created_by": "robust_rag_chatbot"}
        )

        with self._lock:
            self._conversations[session_id] = conversation
            self._save_conversation(conversation)

        logger.info(f"Created new conversation: {session_id}")
        return session_id

    def add_message(self, session_id: str, role: str, content: str,
                   metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Add a message to the conversation"""
        try:
            with self._lock:
                conversation = self._get_or_load_conversation(session_id)
                if not conversation:
                    logger.warning(f"Conversation {session_id} not found")
                    return False

                message = Message(
                    role=role,
                    content=content,
                    timestamp=datetime.now(UTC),
                    metadata=metadata
                )

                conversation.messages.append(message)
                conversation.updated_at = datetime.now(UTC)

                # Trim old messages if needed
                if len(conversation.messages) > self.config.max_conversation_history * 2:
                    conversation.messages = conversation.messages[-self.config.max_conversation_history:]

                # Update cache and save
                self._conversations[session_id] = conversation
                self._save_conversation(conversation)

                return True

        except Exception as e:
            logger.error(f"Failed to add message to {session_id}: {e}")
            return False

    def get_conversation_context(self, session_id: str, max_messages: int = 6) -> str:
        """Get formatted conversation context for AI prompt with enhanced memory"""
        try:
            with self._lock:
                conversation = self._get_or_load_conversation(session_id)
                if not conversation or not conversation.messages:
                    return ""

                # Get recent messages for context, but be smarter about selection
                recent_messages = conversation.messages[-max_messages:] if len(conversation.messages) > max_messages else conversation.messages

                context_lines = []
                for message in recent_messages:
                    role_label = "Human" if message.role == "user" else "Assistant"
                    # Truncate very long messages but preserve important information
                    content = message.content
                    if len(content) > 300:
                        content = content[:297] + "..."
                    context_lines.append(f"{role_label}: {content}")

                return "\n".join(context_lines)

        except Exception as e:
            logger.error(f"Failed to get context for {session_id}: {e}")
            return ""

    def get_conversation(self, session_id: str) -> Optional[Conversation]:
        """Get complete conversation"""
        with self._lock:
            return self._get_or_load_conversation(session_id)

    def _get_or_load_conversation(self, session_id: str) -> Optional[Conversation]:
        """Get conversation from cache or load from file"""
        # Check cache first
        if session_id in self._conversations:
            return self._conversations[session_id]

        # Try to load from file
        return self._load_conversation(session_id)

    def _save_conversation(self, conversation: Conversation) -> bool:
        """Save conversation to file with error handling"""
        try:
            file_path = self.storage_dir / f"{conversation.session_id}.json"

            # Use atomic write to prevent corruption
            temp_path = file_path.with_suffix('.tmp')

            with temp_path.open('w', encoding='utf-8') as f:
                json.dump(conversation.to_dict(), f, indent=2, ensure_ascii=False)

            # Atomic rename
            temp_path.replace(file_path)

            return True

        except Exception as e:
            logger.error(f"Failed to save conversation {conversation.session_id}: {e}")
            return False

    def _load_conversation(self, session_id: str) -> Optional[Conversation]:
        """Load conversation from file"""
        try:
            file_path = self.storage_dir / f"{session_id}.json"

            if not file_path.exists():
                return None

            with file_path.open('r', encoding='utf-8') as f:
                data = json.load(f)

            conversation = Conversation.from_dict(data)

            # Update cache
            self._conversations[session_id] = conversation

            return conversation

        except Exception as e:
            logger.error(f"Failed to load conversation {session_id}: {e}")
            return None

    def list_conversations(self, user_id: Optional[str] = None) -> List[str]:
        """List conversation session IDs for a user"""
        try:
            conversation_ids = []

            # Check files in storage directory
            for file_path in self.storage_dir.glob("*.json"):
                if file_path.stem != "metadata":  # Skip metadata files
                    try:
                        # Quick load to check user_id if specified
                        if user_id:
                            with file_path.open('r', encoding='utf-8') as f:
                                data = json.load(f)
                            if data.get("user_id") == user_id:
                                conversation_ids.append(file_path.stem)
                        else:
                            conversation_ids.append(file_path.stem)
                    except Exception:
                        continue  # Skip corrupted files

            return conversation_ids

        except Exception as e:
            logger.error(f"Failed to list conversations: {e}")
            return []

    def cleanup_old_conversations(self, days_old: int = 30):
        """Clean up conversations older than specified days"""
        try:
            cutoff_date = datetime.now(UTC).timestamp() - (days_old * 24 * 3600)

            cleaned_count = 0
            for file_path in self.storage_dir.glob("*.json"):
                try:
                    if file_path.stat().st_mtime < cutoff_date:
                        file_path.unlink()
                        # Remove from cache if present
                        session_id = file_path.stem
                        with self._lock:
                            self._conversations.pop(session_id, None)
                        cleaned_count += 1
                except Exception:
                    continue

            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} old conversations")

        except Exception as e:
            logger.error(f"Failed to cleanup conversations: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get conversation statistics"""
        try:
            total_files = len(list(self.storage_dir.glob("*.json")))
            cached_conversations = len(self._conversations)

            return {
                "total_conversations": total_files,
                "cached_conversations": cached_conversations,
                "storage_directory": str(self.storage_dir)
            }

        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}
