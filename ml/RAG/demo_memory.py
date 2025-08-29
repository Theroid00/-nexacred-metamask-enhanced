#!/usr/bin/env python3
"""
Demonstration of memory effectiveness through response quality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_pipeline import RAGPipeline

def demonstrate_memory_effectiveness():
    """Show how memory improves response quality over conversation."""
    print("🎯 Demonstrating Memory Effectiveness Through Response Quality")
    print("=" * 60)
    
    try:
        # Initialize pipeline
        pipeline = RAGPipeline()
        print("✅ Pipeline ready\n")
        
        # Conversation sequence to show memory in action
        conversation = [
            "What is artificial intelligence?",
            "How does it relate to machine learning?", 
            "Can you give me an example of it?",
            "What are the main benefits of using this technology?"
        ]
        
        for i, query in enumerate(conversation, 1):
            print(f"🗣️  Query {i}: {query}")
            
            response_data = pipeline.process_query(query)
            response = response_data['response']
            metadata = response_data.get('metadata', {})
            
            # Show response
            print(f"🤖 Response: {response[:200]}...")
            
            # Check if memory was used (silent indicators)
            context_indicators = metadata.get('context_indicators', {})
            memory_active = any(context_indicators.values())
            
            if memory_active:
                print("   💭 (Memory: Context from previous exchanges detected)")
            else:
                print("   💭 (Memory: Answering based on general knowledge)")
            
            print("-" * 60)
        
        # Show final conversation summary
        print(f"\n📊 Conversation Complete!")
        print(f"   • Processed {len(conversation)} related queries")
        print(f"   • Memory system tracked context across exchanges")
        
        pipeline.close()
        print("\n🎉 Memory demonstration complete!")
        print("\nThe chatbot will now provide contextual responses based on")
        print("your conversation history, improving response quality over time.")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    demonstrate_memory_effectiveness()