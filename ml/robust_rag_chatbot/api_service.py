"""
FastAPI Service for Robust RAG Chatbot
======================================

Production-ready API service with proper error handling, rate limiting, and security.
"""

import logging
import asyncio
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from config import config
from robust_rag_chatbot import RobustRAGChatbot

logger = logging.getLogger(__name__)

# Global chatbot instance
chatbot: Optional[RobustRAGChatbot] = None

# Rate limiting storage (in production, use Redis)
request_counts: Dict[str, Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: Optional[str] = Field(None, description="Optional session ID")
    user_id: str = Field(default="anonymous", description="User identifier")

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(..., description="AI generated response")
    session_id: str = Field(..., description="Session identifier")
    processing_time: float = Field(..., description="Processing time in seconds")
    sources_count: int = Field(..., description="Number of sources used")

class StatusResponse(BaseModel):
    """System status response"""
    status: str = Field(..., description="Overall system status")
    uptime: float = Field(..., description="Uptime in seconds")
    system_info: Dict[str, Any] = Field(..., description="Detailed system information")

class HealthResponse(BaseModel):
    """Health check response"""
    healthy: bool = Field(..., description="Health status")
    timestamp: str = Field(..., description="Check timestamp")
    components: Dict[str, str] = Field(..., description="Component status")

# Rate limiting dependency
async def rate_limit_check(request: Request):
    """Simple rate limiting (in production, use proper rate limiting service)"""
    client_ip = request.client.host
    current_time = time.time()

    if client_ip not in request_counts:
        request_counts[client_ip] = {"count": 0, "window_start": current_time}

    client_data = request_counts[client_ip]

    # Reset window if needed (1 minute window)
    if current_time - client_data["window_start"] > 60:
        client_data["count"] = 0
        client_data["window_start"] = current_time

    client_data["count"] += 1

    if client_data["count"] > config.max_requests_per_minute:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global chatbot

    # Startup
    logger.info("Starting Robust RAG Chatbot API...")
    try:
        chatbot = RobustRAGChatbot()
        if not chatbot.initialize():
            raise RuntimeError("Failed to initialize chatbot")
        logger.info("✅ Chatbot initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize chatbot: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Robust RAG Chatbot API...")
    if chatbot:
        chatbot.cleanup()
    logger.info("✅ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Robust RAG Chatbot API",
    description="Production-ready RAG chatbot with IBM Granite 2B Instruct and MongoDB integration",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
if config.enable_cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

# Startup time for uptime calculation
startup_time = time.time()

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "service": "Robust RAG Chatbot API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        components = {
            "api": "healthy",
            "chatbot": "healthy" if chatbot and chatbot._initialized else "unhealthy",
            "model": "healthy" if chatbot and chatbot.model_manager._is_loaded else "unhealthy",
            "embeddings": "healthy" if chatbot and chatbot.embedding_manager.is_loaded() else "unhealthy"
        }

        overall_healthy = all(status == "healthy" for status in components.values())

        return HealthResponse(
            healthy=overall_healthy,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            components=components
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            healthy=False,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            components={"error": str(e)}
        )

@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Get detailed system status"""
    try:
        if not chatbot:
            raise HTTPException(status_code=503, detail="Chatbot not initialized")

        uptime = time.time() - startup_time
        system_info = chatbot.get_system_status()

        return StatusResponse(
            status="operational" if chatbot._initialized else "initializing",
            uptime=uptime,
            system_info=system_info
        )
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    rate_limit: None = Depends(rate_limit_check)
):
    """Main chat endpoint"""
    start_time = time.time()

    try:
        if not chatbot or not chatbot._initialized:
            raise HTTPException(status_code=503, detail="Chatbot not ready")

        # Process chat request
        response = chatbot.chat(
            user_input=request.message,
            session_id=request.session_id
        )

        processing_time = time.time() - start_time

        # Count sources (rough estimate based on "Sources Referenced:" section)
        sources_count = response.count("Sources Referenced:") + response.count("Source:")

        return ChatResponse(
            response=response,
            session_id=chatbot._current_session_id,
            processing_time=processing_time,
            sources_count=sources_count
        )

    except Exception as e:
        logger.error(f"Chat request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/conversations/{session_id}")
async def get_conversation(session_id: str):
    """Get conversation history"""
    try:
        if not chatbot:
            raise HTTPException(status_code=503, detail="Chatbot not initialized")

        history = chatbot.get_conversation_history(session_id)
        return {"session_id": session_id, "messages": history}

    except Exception as e:
        logger.error(f"Failed to get conversation {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversation: {str(e)}")

@app.post("/conversations/new")
async def create_conversation(user_id: str = "anonymous"):
    """Create a new conversation session"""
    try:
        if not chatbot:
            raise HTTPException(status_code=503, detail="Chatbot not initialized")

        session_id = chatbot.start_conversation(user_id)
        return {"session_id": session_id, "user_id": user_id}

    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled error in {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred. Please try again later."
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "api_service:app",
        host=config.api_host,
        port=config.api_port,
        reload=False,
        log_level="info"
    )
