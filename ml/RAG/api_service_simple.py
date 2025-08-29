#!/usr/bin/env python3
"""
Simplified RAG Chatbot API Service
Fallback service that provides intelligent responses without full RAG setup.
"""

import sys
import json
import logging
import os
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class SimplifiedChatbotService:
    """Simplified chatbot service with predefined responses."""
    
    def __init__(self):
        """Initialize the simplified service."""
        self.knowledge_base = {
            # Credit Score related
            "credit score": "A credit score is a numerical representation of your creditworthiness, typically ranging from 300 to 850. It's calculated based on your credit history, payment patterns, credit utilization, length of credit history, and types of credit accounts. Higher scores indicate lower credit risk to lenders.",
            
            "improve credit": "To improve your credit score: 1) Pay bills on time consistently, 2) Keep credit utilization below 30%, 3) Don't close old credit accounts, 4) Limit new credit applications, 5) Monitor your credit report regularly for errors, 6) Consider becoming an authorized user on someone else's account with good credit.",
            
            "credit rating": "Credit ratings are assessments of creditworthiness, typically expressed as letter grades (AAA, AA, A, BBB, etc.) or numerical scores. They help lenders evaluate the risk of lending money to individuals or organizations.",
            
            # Lending related
            "lending": "Lending is the process of providing money, property, or other material goods to another party with the expectation of repayment, usually with interest. NexaCred facilitates peer-to-peer lending with transparent terms and blockchain-based security.",
            
            "loan application": "For a loan application, you typically need: 1) Valid ID (passport/driver's license), 2) Proof of income (pay stubs/tax returns), 3) Bank statements, 4) Credit history, 5) Employment verification, 6) Purpose of loan documentation.",
            
            "lending decision": "Lending decisions are based on factors including: credit score, income stability, debt-to-income ratio, employment history, loan purpose, collateral (if applicable), and overall financial health. NexaCred uses advanced algorithms to assess these factors fairly.",
            
            # Blockchain & Finance
            "blockchain": "Blockchain technology in finance provides transparency, security, and immutability. It creates a decentralized ledger that records transactions across multiple computers, making it nearly impossible to alter records fraudulently. This enhances trust in financial transactions.",
            
            "nexacred": "NexaCred is an innovative financial platform that combines traditional credit scoring with blockchain technology and AI-powered risk assessment. We provide peer-to-peer lending services, transparent credit evaluations, and MetaMask integration for secure transactions.",
            
            # General Financial
            "financial health": "Financial health refers to the overall state of your personal finances, including income, expenses, savings, debt levels, and investment portfolio. Key indicators include positive cash flow, emergency fund, manageable debt, and growing net worth.",
            
            "interest rate": "Interest rates represent the cost of borrowing money, expressed as a percentage of the principal amount. They're influenced by factors like credit score, loan term, market conditions, and lender policies. Higher credit scores typically qualify for lower interest rates."
        }
        
        self.greetings = [
            "Hello! I'm your NexaCred AI assistant. How can I help you today?",
            "Hi there! I'm here to help with your financial and credit questions. What would you like to know?",
            "Welcome! I can assist you with information about credit scores, lending, and financial services. What's your question?"
        ]
        
        self.default_responses = [
            "I understand you're looking for information about that topic. While I don't have specific details right now, I recommend checking our comprehensive resources or contacting our support team for personalized assistance.",
            "That's an interesting question! For detailed information about that specific topic, I'd suggest exploring our help documentation or speaking with one of our financial advisors.",
            "I'd be happy to help you with that. For the most accurate and up-to-date information, please consult our official resources or reach out to our customer support team."
        ]
    
    def find_best_response(self, query: str) -> str:
        """Find the best response for a given query."""
        query_lower = query.lower()
        
        # Check for greetings
        greeting_words = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
        if any(word in query_lower for word in greeting_words):
            return random.choice(self.greetings)
        
        # Find matching knowledge base entries
        best_match = None
        max_matches = 0
        
        for key, response in self.knowledge_base.items():
            # Count how many words from the key appear in the query
            key_words = key.split()
            matches = sum(1 for word in key_words if word in query_lower)
            
            if matches > max_matches:
                max_matches = matches
                best_match = response
        
        # If we found a good match, return it
        if max_matches >= 1:
            return best_match
        
        # Otherwise return a default response
        return random.choice(self.default_responses)
    
    def process_query(self, query: str) -> dict:
        """Process a query and return a response."""
        try:
            response = self.find_best_response(query)
            
            return {
                "query": query,
                "response": response,
                "retrieved_documents": 1 if response not in self.default_responses else 0,
                "context_used": True,
                "sources": ["NexaCred Knowledge Base"],
                "service_type": "simplified"
            }
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "error": str(e),
                "response": "I apologize, but I encountered an error while processing your question. Please try again.",
                "retrieved_documents": 0,
                "context_used": False,
                "sources": []
            }

def main():
    """Main function to handle command line API calls."""
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python api_service_simple.py <query>",
            "response": "I didn't receive a proper query. Please try again.",
            "retrieved_documents": 0,
            "context_used": False,
            "sources": []
        }))
        sys.exit(1)
    
    query = sys.argv[1]
    
    # Initialize service
    service = SimplifiedChatbotService()
    
    # Process query
    result = service.process_query(query)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
