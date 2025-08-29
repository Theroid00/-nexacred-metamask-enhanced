# Minimalistic RAG Chatbot

A clean, simple RAG chatbot powered by IBM Granite AI (via Replicate) with intelligent conversation memory.

## Features

- **Minimalistic Design**: No complex commands or UI - just conversation
- **Intelligent Memory**: Remembers previous exchanges and provides contextual responses
- **Powered by IBM Granite**: Uses IBM Granite 3.3-8B-Instruct model via Replicate
- **Vector Search**: MongoDB Atlas for document retrieval (when configured)

## Quick Start

```bash
# Start the chatbot
python3 main.py
```

That's it! Just type your questions and the chatbot will respond. The memory system works silently in the background to improve response quality.

## Commands

- Type your question and press Enter
- Type `quit`, `exit`, or `bye` to exit
- Press Ctrl+C to exit

## How Memory Works

The chatbot automatically:
- Remembers your previous questions and answers
- Detects when you're asking follow-up questions
- Uses context from earlier in the conversation
- Provides more relevant and personalized responses

**The proof of memory is in the quality of responses** - you'll notice the chatbot gets better at understanding what you're asking about as the conversation continues.

## Example Conversation

```
You: What is machine learning?
🤖 Assistant: Machine learning is a subset of artificial intelligence...

You: Can you give me an example?
🤖 Assistant: Sure! A great example of machine learning is... [contextual response based on previous ML discussion]

You: What are the benefits of using it?
🤖 Assistant: The benefits of machine learning include... [continues the ML topic]
```

Notice how the chatbot understands "it" refers to machine learning from earlier context.

## Testing

```bash
# Test basic functionality
python3 test_minimalistic.py

# See memory in action
python3 demo_memory.py
```

## Configuration

Ensure you have:
- `REPLICATE_API_TOKEN` in your environment or `.env` file
- MongoDB Atlas connection string in `config.py`

The chatbot will work with or without the vector database - it adapts automatically.