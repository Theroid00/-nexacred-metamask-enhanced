# RAG Chatbot - IBM Granite on Replicate & MongoDB Atlas

A powerful Retrieval-Augmented Generation (RAG) chatbot that combines IBM Granite AI foundation models hosted on Replicate with MongoDB Atlas vector search capabilities. This terminal-based chatbot provides intelligent responses by retrieving relevant context from your document knowledge base.

## 🚀 Features

- **Intelligent Retrieval**: Uses MongoDB Atlas Vector Search to find relevant documents
- **Powerful Generation**: Leverages IBM Granite foundation models hosted on Replicate for response generation
- **Interactive Terminal**: Beautiful, user-friendly terminal interface with rich formatting
- **Health Monitoring**: Built-in health checks for all system components
- **Configurable**: Easy configuration through environment variables
- **Production Ready**: Comprehensive error handling and logging

## 📋 Prerequisites

- Python 3.8 or higher
- Replicate account with API access
- MongoDB Atlas cluster with vector search enabled
- Documents already uploaded as vector embeddings in MongoDB Atlas

## 🛠️ Setup Instructions

### 1. Clone and Navigate to Project

```bash
cd /path/to/your/RAG/project
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Edit the `.env` file with your actual credentials:

```bash
# Replicate AI Configuration
REPLICATE_API_TOKEN=r8_5tiCkDeDCv1j1zykH46zcsugv1cOu202WB3kQ
REPLICATE_MODEL=ibm-granite/granite-3.3-8b-instruct

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=your_database_name
MONGODB_COLLECTION=your_collection_name

# RAG Configuration (optional - defaults provided)
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7
MAX_TOKENS=512
TEMPERATURE=0.7

# Logging (optional)
LOG_LEVEL=INFO
```

### 4. Replicate Setup

1. **Create Replicate Account**: Sign up at [Replicate](https://replicate.com/)
2. **Get API Token**:
   - Go to your account settings
   - Generate a new API token
   - Copy the token (starts with `r8_`)
3. **API Credit**: Your account comes with $0.50 credit to test IBM Granite models

### 5. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Set up a new cluster (free tier available)
3. **Enable Vector Search**:
   - Go to your cluster
   - Navigate to "Search" tab
   - Create a vector search index on your collection
   - Configure the index for your embedding field
4. **Get Connection String**:
   - Go to "Connect" in your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

### 6. Document Requirements

Your MongoDB collection should contain documents with the following structure:

```json
{
  "_id": "document_id",
  "content": "Your document text content here",
  "embedding": [0.1, 0.2, 0.3, ...],  // Vector embedding array
  "title": "Document Title",
  "source": "source_identifier",
  // ... other metadata fields
}
```

**Important**: 
- The `embedding` field should contain vector embeddings of your documents
- Ensure you have a vector search index configured on the `embedding` field
- The index name should be `vector_index` (or update the code accordingly)

## 🚀 Running the Chatbot

Start the interactive terminal chatbot:

```bash
python main.py
```

## 💬 Using the Chatbot

### Available Commands

- `help` - Show help message and available commands
- `health` - Check system health status
- `clear` - Clear the terminal screen
- `quit` or `exit` - Exit the chatbot

### Example Interaction

```
🤖 RAG Chatbot - Powered by IBM Granite on Replicate & MongoDB Atlas

You: What is machine learning?

🤖 Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed...

📊 Retrieved 3 relevant documents
📚 Sources:
  • Introduction to ML (score: 0.892)
  • AI Fundamentals (score: 0.847)
  • Data Science Guide (score: 0.723)
```

## 🔧 Configuration Options

### IBM Granite AI Models

The chatbot uses `ibm-granite/granite-3.3-8b-instruct` by default for optimal performance. Available models on Replicate:

```python
# Available IBM Granite models on Replicate:
"ibm-granite/granite-3.3-8b-instruct"    # Default - Latest and most efficient
"ibm-granite/granite-3.0-8b-instruct"    # Previous version, stable
"ibm-granite/granite-3.0-3b-a800m-instruct" # Smaller, faster model
```

### Retrieval Parameters

Adjust these in your `.env` file:

- `TOP_K_RESULTS`: Number of documents to retrieve (default: 5)
- `SIMILARITY_THRESHOLD`: Minimum similarity score (default: 0.7)
- `MAX_TOKENS`: Maximum response length (default: 512)
- `TEMPERATURE`: Response creativity (0.0-1.0, default: 0.7)

## 📁 Project Structure

```
RAG/
├── main.py                    # Terminal chatbot interface
├── config.py                  # Configuration management
├── database.py                # MongoDB Atlas connector
├── replicate_client.py        # Replicate AI client for IBM Granite
├── rag_pipeline.py            # RAG pipeline orchestration
├── test_granite_replicate.py  # Integration tests
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── README.md                  # This file
```

## 🔍 Component Overview

### `main.py`
Interactive terminal interface with rich formatting, command processing, and user interaction handling.

### `config.py`
Centralized configuration management with environment variable loading and validation.

### `database.py`
MongoDB Atlas connector handling vector search operations and document retrieval.

### `replicate_client.py`
Replicate AI client for IBM Granite text generation using Replicate's hosting platform.

### `rag_pipeline.py`
Orchestrates the complete RAG workflow: query embedding → document retrieval → response generation.

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**: Install dependencies with `pip install -r requirements.txt`

2. **Configuration Errors**: 
   - Verify all required environment variables are set
   - Check API keys and connection strings are correct
   - Run `health` command in the chatbot to check component status

3. **MongoDB Connection Issues**:
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Verify the connection string format and credentials
   - Check that vector search index exists and is properly configured

4. **Replicate API Errors**:
   - Verify API token is correct and active
   - Check that you have sufficient credits
   - Ensure the model `ibm-granite/granite-3.3-8b-instruct` is accessible

5. **No Search Results**:
   - Check similarity threshold (try lowering it)
   - Verify documents have embeddings in the correct format
   - Ensure vector search index is properly configured

### Health Check

Use the built-in health check to diagnose issues:

```bash
# In the chatbot
You: health
```

This will show the status of:
- ✅ Sentence transformer (embedder)
- ✅ MongoDB Atlas connection
- ✅ IBM Granite client (via Replicate)

## 📊 Performance Tips

1. **Optimize Retrieval**:
   - Adjust `TOP_K_RESULTS` based on your needs (3-10 typically works well)
   - Fine-tune `SIMILARITY_THRESHOLD` for your domain
   - Consider preprocessing queries for better matching

2. **Optimize Generation**:
   - Adjust `MAX_TOKENS` based on desired response length
   - Tune `TEMPERATURE` for creativity vs. consistency
   - Experiment with different IBM Watson models

3. **Replicate Optimization**:
   - Monitor usage and costs in Replicate dashboard
   - Consider model choice based on speed vs. quality needs
   - Use caching for repeated queries

## 🔒 Security Considerations

- Keep your `.env` file secure and never commit it to version control
- Use environment-specific configurations
- Regularly rotate API keys and credentials
- Monitor usage and costs in Replicate and MongoDB Atlas

## 📄 License

This project is provided as-is for educational and development purposes.

## 🤝 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review component health status using the `health` command
3. Check logs for detailed error messages
4. Verify your Replicate and MongoDB Atlas configurations

---

**Happy Chatting! 🤖✨**