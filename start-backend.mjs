import 'dotenv/config';
import app from './api/index.js';

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ NexaCred Backend API running on http://localhost:${PORT}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? 'connected' : 'MISSING ❌'}`);
  console.log(`   JWT:      ${process.env.JWT_SECRET ? 'configured' : 'MISSING ❌'}`);
  console.log(`   Chatbot:  ${process.env.CHATBOT_API_KEY ? 'configured' : 'MISSING ❌'}`);
});
