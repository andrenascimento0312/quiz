const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const lobbyRoutes = require('./routes/lobby');
const superadminRoutes = require('./routes/superadmin');
const socketHandler = require('./socket/socketHandler');
const { initDatabase } = require('./database/init');

// Configuração CORS mais robusta
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
const corsOrigins = [
  "http://localhost:5173", 
  "http://192.168.1.100:5173"
];

// Adicionar URLs de produção (com e sem barra final)
if (frontendUrl) {
  corsOrigins.push(frontendUrl);
  corsOrigins.push(frontendUrl.replace(/\/$/, '')); // Remove barra final
  corsOrigins.push(frontendUrl + '/'); // Adiciona barra final
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/admin', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/superadmin', superadminRoutes);

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Inicializar WebSocket
socketHandler(io);

// Inicializar banco de dados e servidor
async function startServer() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    await initDatabase();
    console.log('✅ Banco de dados inicializado');
    
    // Executar migração de usuários automaticamente
    try {
      console.log('🔄 Verificando migração de usuários...');
      const { createConnection, runQuery } = require('./database/init');
      const db = createConnection();
      
      // Tentar adicionar campos se não existirem
      try {
        await runQuery(db, `ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin'`);
        console.log('✅ Campo role adicionado');
      } catch (e) {
        console.log('ℹ️ Campo role já existe');
      }
      
      try {
        await runQuery(db, `ALTER TABLE admins ADD COLUMN status TEXT DEFAULT 'approved'`);
        console.log('✅ Campo status adicionado');
      } catch (e) {
        console.log('ℹ️ Campo status já existe');
      }
      
      // Criar admin padrão se não existir nenhum
      try {
        const { getQuery } = require('./database/init');
        const adminCount = await runQuery(db, 'SELECT COUNT(*) as count FROM admins');
        
        if (adminCount.count === 0) {
          console.log('🔄 Criando admin padrão...');
          const bcrypt = require('bcrypt');
          const passwordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 12);
          
          await runQuery(db, `
            INSERT INTO admins (name, email, password_hash, role, status) 
            VALUES (?, ?, ?, 'superadmin', 'approved')
          `, [
            process.env.DEFAULT_ADMIN_NAME || 'Administrador',
            process.env.DEFAULT_ADMIN_EMAIL || 'admin@quiz.com',
            passwordHash
          ]);
          
          console.log('✅ Admin padrão criado:', {
            email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@quiz.com',
            password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
          });
        }
      } catch (adminError) {
        console.error('⚠️ Erro ao criar admin padrão:', adminError.message);
      }
      
      db.close();
      console.log('✅ Migração verificada');
    } catch (migrationError) {
      console.error('⚠️ Aviso na migração:', migrationError.message);
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Frontend: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recebido SIGTERM, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

startServer();
