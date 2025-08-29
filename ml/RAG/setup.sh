#!/bin/bash

# RAG Chatbot Setup Script
# This script helps you set up the RAG chatbot environment

echo "🤖 RAG Chatbot Setup Script"
echo "=============================="
echo ""

# Check Python version
echo "📋 Checking Python version..."
python_version=$(python3 --version 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✅ Python found: $python_version"
else
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is available
echo "📦 Checking pip..."
if command -v pip3 &> /dev/null; then
    echo "✅ pip3 found"
    PIP_CMD="pip3"
elif command -v pip &> /dev/null; then
    echo "✅ pip found"
    PIP_CMD="pip"
else
    echo "❌ pip not found. Please install pip."
    exit 1
fi

# Create virtual environment (optional but recommended)
read -p "🔧 Do you want to create a virtual environment? (recommended) [y/N]: " create_venv
if [[ $create_venv =~ ^[Yy]$ ]]; then
    echo "📁 Creating virtual environment..."
    python3 -m venv rag_env
    echo "✅ Virtual environment created"
    echo "💡 To activate it later, run: source rag_env/bin/activate"
    echo ""
    source rag_env/bin/activate
    echo "✅ Virtual environment activated"
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
$PIP_CMD install -r requirements.txt

if [[ $? -eq 0 ]]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if .env file exists and has required variables
echo ""
echo "🔧 Checking configuration..."
if [[ ! -f .env ]]; then
    echo "❌ .env file not found"
    exit 1
fi

# Check for required environment variables
required_vars=("IBM_API_KEY" "IBM_PROJECT_ID" "MONGODB_URI")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=your_.*_here" .env; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -eq 0 ]]; then
    echo "✅ Configuration looks good"
else
    echo "⚠️  Please update the following variables in your .env file:"
    for var in "${missing_vars[@]}"; do
        echo "   • $var"
    done
    echo ""
    echo "📝 Edit the .env file with your actual credentials:"
    echo "   nano .env"
    echo ""
fi

# Final instructions
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📝 Next steps:"
echo "1. Make sure your .env file has all required credentials"
echo "2. Ensure your MongoDB Atlas has vector embeddings uploaded"
echo "3. Run the chatbot: python main.py"
echo ""
echo "📚 For detailed instructions, see README.md"
echo ""
echo "🤖 Happy chatting!"