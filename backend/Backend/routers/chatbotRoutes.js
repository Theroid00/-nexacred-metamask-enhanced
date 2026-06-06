import express from 'express';
import dotenv from 'dotenv';
import supabase from '../config/supabaseClient.js';

dotenv.config();

const router = express.Router();

// Local knowledge base for fallback mode
const LOCAL_KNOWLEDGE_BASE = {
  "credit score": "A credit score is a numerical representation of your creditworthiness, typically ranging from 300 to 850. It is calculated based on payment history, credit utilization, length of credit history, types of credit accounts, and recent credit inquiries. Higher scores indicate lower credit risk.",
  "improve credit": "To improve your credit score: 1) Pay bills on time consistently, 2) Keep credit utilization below 30%, 3) Avoid closing old credit accounts, 4) Limit new credit applications, and 5) Monitor your credit report regularly for errors.",
  "credit rating": "Credit ratings are assessments of creditworthiness, typically expressed as letter grades (AAA, AA, A, BBB, etc.) or numerical scores, helping lenders evaluate risk.",
  "lending": "Lending is the process of providing money or assets to another party with the expectation of repayment with interest. NexaCred facilitates peer-to-peer lending with transparent terms and smart contract-based security.",
  "loan application": "For a loan application, you typically need: 1) Valid ID verification, 2) Proof of income/ITR filings, 3) Bank statements, 4) Credit score analysis, and 5) Purpose of loan documentation.",
  "lending decision": "Lending decisions are based on credit score, income stability, debt-to-income ratio, and collateral (if applicable). NexaCred uses decentralized metrics to assess these factors fairly.",
  "blockchain": "Blockchain technology in finance provides transparency, security, and immutability. It creates a decentralized ledger that records transactions across nodes, preventing fraud and enhancing trust.",
  "nexacred": "NexaCred is an innovative financial platform combining traditional credit scoring with blockchain technology and automated risk assessment. We offer peer-to-peer lending and transparent credit evaluations with MetaMask integration.",
  "financial health": "Financial health refers to the state of your personal finances, including income, savings, debt levels, and cash flow. Key indicators are positive cash flow, emergency savings, and a good credit score.",
  "interest rate": "Interest rates represent the cost of borrowing money, expressed as an annual percentage of the principal. Higher credit scores typically qualify for lower interest rates."
};

const GREETINGS = [
  "Hello! I'm your NexaCred AI assistant. How can I help you today?",
  "Hi there! I'm here to help with your financial and credit questions. What would you like to know?",
  "Welcome! I can assist you with information about credit scores, lending, and financial services. What is your question?"
];

const FALLBACK_RESPONSES = [
  "I understand you are looking for information. I recommend checking our official guidelines or contacting our support team for personalized assistance.",
  "That is a great question! For detailed information, I'd suggest exploring our help documentation or consulting with our advisors.",
  "I'd be happy to help. For the most accurate details, please refer to our official resources or reach out to customer support."
];

// Perform local keyword query resolution
const getLocalResponse = (query) => {
  const q = query.toLowerCase();
  
  // Check greetings
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"];
  if (greetings.some(g => q.includes(g))) {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }

  // Check matching keywords in local knowledge base
  let bestMatch = null;
  let maxMatches = 0;

  for (const [key, val] of Object.entries(LOCAL_KNOWLEDGE_BASE)) {
    const keyWords = key.split(" ");
    const matches = keyWords.filter(word => q.includes(word)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = val;
    }
  }

  if (maxMatches >= 1) return bestMatch;
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
};

/**
 * POST /api/chatbot/query
 * Process user query through RAG pipeline / LLM endpoint / local fallback
 */
router.post('/query', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const sanitizedQuery = query.trim().substring(0, 1000);
    console.log(`Processing chatbot query: "${sanitizedQuery.substring(0, 50)}..."`);

    // 1. Context retrieval from Supabase using pg full-text search / ILIKE matches
    let retrievedDocs = [];
    try {
      const keywords = sanitizedQuery.split(' ').filter(w => w.length > 3).map(w => `%${w}%`);
      if (keywords.length > 0) {
        // Query guidelines table
        const queryBuilder = supabase.from('guidelines').select('title, content');
        
        // Build OR search query using array of keywords
        const orClauses = keywords.map(kw => `content.ilike.${kw}`).join(',');
        const { data: docs } = await queryBuilder.or(orClauses).limit(3);
        
        if (docs && docs.length > 0) {
          retrievedDocs = docs.map(d => `[${d.title}] ${d.content}`);
        }
      }
    } catch (dbError) {
      console.warn("Could not query guidelines database:", dbError.message);
    }

    // 2. Query external OpenAI-compatible API if configured
    const apiUrl = process.env.CHATBOT_API_URL;
    const apiKey = process.env.CHATBOT_API_KEY;
    const model = process.env.CHATBOT_MODEL || "gpt-3.5-turbo";

    if (apiUrl && apiKey) {
      try {
        const contextStr = retrievedDocs.length > 0 ? `Context information:\n${retrievedDocs.join('\n\n')}\n\n` : "";
        const systemPrompt = `You are NexaCred AI, a professional financial assistant helping users with credit scoring, lending, and blockchain finance. Always answer accurately and politely based on the provided context if present.`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${contextStr}Question: ${sanitizedQuery}` }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (response.ok) {
          const result = await response.json();
          const answer = result.choices?.[0]?.message?.content || "";
          if (answer) {
            return res.json({
              success: true,
              data: {
                query: sanitizedQuery,
                response: answer,
                retrievedDocuments: retrievedDocs.length,
                contextUsed: retrievedDocs.length > 0,
                sources: retrievedDocs.map((_, i) => `Guideline Source ${i + 1}`),
                serviceType: "external_llm",
                timestamp: new Date().toISOString(),
                userId
              }
            });
          }
        } else {
          const errText = await response.text();
          console.warn(`External LLM returned status ${response.status}: ${errText}`);
        }
      } catch (apiError) {
        console.error("Failed to fetch response from external LLM:", apiError.message);
      }
    }

    // 3. Fallback to intelligent local keyword-matching
    const fallbackAnswer = getLocalResponse(sanitizedQuery);
    res.json({
      success: true,
      data: {
        query: sanitizedQuery,
        response: fallbackAnswer,
        retrievedDocuments: retrievedDocs.length,
        contextUsed: retrievedDocs.length > 0,
        sources: retrievedDocs.length > 0 ? ["Supabase Guidelines Database"] : ["Local Fallback System"],
        serviceType: "local_fallback",
        timestamp: new Date().toISOString(),
        userId
      }
    });

  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query'
    });
  }
});

/**
 * GET /api/chatbot/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'online',
      service: 'NexaCred Chatbot Gateway',
      version: '2.0.0',
      features: [
        'Supabase Document Search',
        'Generic OpenAI-compatible Wrapper Support',
        'Local Intelligent Fallback'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/chatbot/welcome
 */
router.get('/welcome', (req, res) => {
  res.json({
    success: true,
    data: {
      message: "Hello! I'm your NexaCred AI assistant. I can help you with questions about credit scoring, lending, financial information, and more.",
      suggestions: [
        "What is a credit score?",
        "How can I improve my credit rating?",
        "What factors affect lending decisions?",
        "Tell me about NexaCred's services",
        "What is blockchain technology?",
        "What do I need for a loan application?"
      ],
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
