# Robust RAG Chatbot

A production-ready RAG (Retrieval-Augmented Generation) chatbot system using IBM Granite 2B Instruct model with MongoDB document retrieval for Indian financial regulations.

## 🚀 Features

- **IBM Granite 2B Instruct Model**: Local deployment with optimized memory management
- **MongoDB Integration**: Real-time document retrieval from financial regulations database
- **Thread-Safe Operations**: Concurrent request handling with proper resource management
- **Conversation Persistence**: File-based conversation storage with JSON format
- **Memory Optimization**: 4-bit quantization and GPU memory management
- **Error Recovery**: Comprehensive error handling with graceful fallbacks
- **FastAPI Service**: RESTful API with rate limiting and CORS support
- **Interactive CLI**: Command-line interface for testing and development

## 🏗️ Architecture

```
robust_rag_chatbot/
├── config.py                 # Configuration management
├── robust_rag_chatbot.py     # Main chatbot class
├── model_manager.py          # IBM Granite model handling
├── embedding_manager.py      # Sentence transformer embeddings
├── mongodb_retriever.py      # Document retrieval from MongoDB
├── conversation_manager.py   # Thread-safe conversation storage
├── api_service.py           # FastAPI web service
├── cli.py                   # Interactive command-line interface
├── example_usage.py         # Usage examples
├── test_suite.py           # Comprehensive test suite
└── requirements.txt         # Dependencies
```

## 🔧 Installation

1. **Install Dependencies**:
```bash
cd robust_rag_chatbot
pip install -r requirements.txt
```

2. **Set up Environment** (optional):
```bash
# Create .env file for custom configuration
echo "MONGODB_URI=your_mongodb_connection_string" > .env
echo "MODEL_NAME=ibm-granite/granite-3.0-2b-instruct" >> .env
```

## 🚀 Quick Start

### Interactive CLI Mode
```bash
python cli.py
```

### Single Query
```bash
python cli.py --query "What are RBI's digital lending guidelines?"
```

### API Service
```bash
python api_service.py
```

### Python Integration
```python
from robust_rag_chatbot import RobustRAGChatbot

# Initialize chatbot
chatbot = RobustRAGChatbot()

# Start conversation
session_id = chatbot.start_conversation("user_123")

# Chat
response = chatbot.chat("Explain SEBI mutual fund regulations", session_id)
print(response)

# Cleanup
chatbot.cleanup()
```

## 📡 API Endpoints

- `GET /` - Service information
- `GET /health` - Health check
- `GET /status` - Detailed system status
- `POST /chat` - Send chat message
- `POST /conversations/new` - Create new conversation
- `GET /conversations/{session_id}` - Get conversation history

### Example API Usage
```bash
# Health check
curl http://localhost:8001/health

# Create conversation
curl -X POST http://localhost:8001/conversations/new?user_id=test_user

# Send message
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are RBI guidelines for digital payments?",
    "session_id": "your_session_id",
    "user_id": "test_user"
  }'
```

## 🔧 Configuration

Key configuration options in `config.py`:

```python
# Model Configuration
model_name = "ibm-granite/granite-3.0-2b-instruct"
use_4bit_quantization = True
max_memory_gb = 6.0

# MongoDB Configuration
mongodb_uri = "mongodb+srv://..."
mongodb_database = "financial_advice_db"
mongodb_collection = "documents"

# Generation Parameters
max_new_tokens = 512
temperature = 0.3
top_p = 0.9
```

## 🧪 Testing

### Run Test Suite
```bash
python test_suite.py
```

### Run Examples
```bash
python example_usage.py
```

### Performance Test
```bash
python cli.py --test
```

## 🔒 Security Features

- **Environment Variables**: Sensitive data via environment variables
- **Rate Limiting**: Configurable request rate limiting
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Pydantic models for request validation
- **Error Handling**: No sensitive information in error responses

## 📊 Performance Optimizations

- **4-bit Quantization**: Reduced memory usage for models
- **Lazy Loading**: Models loaded only when needed
- **Connection Pooling**: MongoDB connection reuse
- **Memory Management**: Automatic GPU cache clearing
- **Thread Safety**: Locks for concurrent operations

## 🔍 Document Retrieval

The system retrieves relevant documents from MongoDB using:

1. **Vector Search**: Semantic similarity using embeddings
2. **Fallback Mechanisms**: Hardcoded documents if MongoDB unavailable
3. **Relevance Scoring**: Similarity threshold filtering
4. **Multiple Sources**: Support for various document types

## 💬 Conversation Management

- **Persistent Storage**: JSON file-based conversation storage
- **Session Management**: UUID-based session identification
- **Context Preservation**: Conversation history for context
- **Memory Limits**: Configurable message history limits
- **Atomic Operations**: File operations with atomic writes

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Model Loading Failures**: Graceful degradation with fallbacks
- **MongoDB Connection Issues**: Local document fallbacks
- **Memory Constraints**: Automatic memory management
- **Network Timeouts**: Retry mechanisms with exponential backoff
- **Conversation Corruption**: Recovery from malformed data

## 📈 Monitoring

System provides detailed monitoring:

- **Health Checks**: Component-level health status
- **Performance Metrics**: Response times and memory usage
- **Conversation Analytics**: Message counts and session tracking
- **Error Tracking**: Comprehensive logging with structured data

## 🔄 Deployment Options

### Local Development
```bash
python api_service.py
```

### Production with Gunicorn
```bash
pip install gunicorn
gunicorn api_service:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "api_service.py"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Model Loading Fails**:
   - Check available memory (need 4-8GB)
   - Verify internet connection for model download
   - Try disabling quantization

2. **MongoDB Connection Issues**:
   - Verify connection string
   - Check network connectivity
   - System falls back to local documents

3. **Out of Memory**:
   - Enable 4-bit quantization
   - Reduce max_new_tokens
   - Use CPU instead of GPU

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📋 System Requirements

- **Python**: 3.8+
- **Memory**: 8GB RAM (4GB with quantization)
- **Storage**: 5GB for model files
- **GPU**: Optional (CUDA-capable GPU recommended)
- **Network**: Internet connection for initial model download

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- IBM Granite team for the language model
- Sentence Transformers for embedding models
- MongoDB team for vector search capabilities
- FastAPI team for the web framework
