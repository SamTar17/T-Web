require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT;


const server = app.listen(PORT, () => {
  console.log('🚀 MongoDB Server avviato con successo!');
  console.log(`📡 Server in ascolto su http://localhost:${PORT}`);
  console.log('📊 Endpoints disponibili:');
  console.log('   - GET /api/health (Health check)');
  console.log('   - [TODO] POST/GET /api/messages (Gestione messaggi)');
  console.log('=====================================\n');
});
