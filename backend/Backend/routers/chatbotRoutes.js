import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Python RAG chatbot service
const ragServicePath = path.join(__dirname, '..', '..', '..', 'ml', 'RAG', 'api_service_enhanced.py');

/**
 * POST /api/chatbot/query
 * Process user query through RAG pipeline
 */
router.post('/query', async (req, res) => {
    try {
        const { query, userId } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string'
            });
        }

        // Sanitize query (basic)
        const sanitizedQuery = query.trim().substring(0, 1000); // Limit query length

        console.log(`Processing chatbot query for user ${userId}: ${sanitizedQuery.substring(0, 100)}...`);

        // Create a promise to handle the Python process
        const processQuery = new Promise((resolve, reject) => {
            const python = spawn('python', [ragServicePath, sanitizedQuery]);
            
            let outputData = '';
            let errorData = '';

            python.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    console.error(`Error output: ${errorData}`);
                    reject(new Error(`RAG service failed with code ${code}: ${errorData}`));
                    return;
                }

                try {
                    // Parse the JSON response from Python
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (parseError) {
                    console.error('Failed to parse Python response:', outputData);
                    reject(new Error(`Failed to parse RAG response: ${parseError.message}`));
                }
            });

            python.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                reject(new Error(`Failed to start RAG service: ${error.message}`));
            });

            // Set timeout to prevent hanging
            setTimeout(() => {
                python.kill();
                reject(new Error('RAG service timeout'));
            }, 30000); // 30 second timeout
        });

        // Wait for the Python process to complete
        const ragResult = await processQuery;

        // Return successful response
        res.json({
            success: true,
            data: {
                query: sanitizedQuery,
                response: ragResult.response || 'I apologize, but I could not generate a response.',
                retrievedDocuments: ragResult.retrieved_documents || 0,
                contextUsed: ragResult.context_used || false,
                sources: ragResult.sources || [],
                timestamp: new Date().toISOString(),
                userId: userId
            }
        });

    } catch (error) {
        console.error('Chatbot query error:', error);
        
        // Return fallback response for any errors
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing your query. Please try again.',
            data: {
                query: req.body.query || '',
                response: 'I apologize, but I\'m currently experiencing technical difficulties. Please try asking your question again in a moment.',
                retrievedDocuments: 0,
                contextUsed: false,
                sources: [],
                timestamp: new Date().toISOString(),
                userId: req.body.userId
            }
        });
    }
});

/**
 * GET /api/chatbot/status
 * Check chatbot service status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'online',
            service: 'NexaCred RAG Chatbot',
            version: '1.0.0',
            features: [
                'Retrieval-Augmented Generation',
                'IBM Granite AI Integration',
                'MongoDB Atlas Document Store',
                'Semantic Search',
                'Context-Aware Responses',
                'Conversation Memory'
            ],
            timestamp: new Date().toISOString()
        }
    });
});

/**
 * GET /api/chatbot/welcome
 * Get welcome message and suggested queries
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
                "How does blockchain technology work in finance?",
                "What documents do I need for a loan application?"
            ],
            timestamp: new Date().toISOString()
        }
    });
});

export default router;
