// Escolher banco automaticamente baseado no ambiente
const USE_POSTGRES = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

if (USE_POSTGRES) {
  console.log('🐘 Usando PostgreSQL para produção');
  module.exports = require('./postgres');
} else {
  console.log('📁 Usando SQLite para desenvolvimento');
  
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const fs = require('fs');

  // Usar volume persistente no Railway se não tiver PostgreSQL
  const DB_PATH = process.env.NODE_ENV === 'production' 
    ? '/app/data/quiz.db'  // Railway volume persistente
    : path.join(__dirname, '../data/quiz.db'); // Local
  
  console.log(`🗄️ Caminho do banco: ${DB_PATH}`);
  console.log(`🗄️ Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🗄️ Volume persistente: ${process.env.NODE_ENV === 'production' ? 'SIM' : 'NÃO'}`);

// Garantir que o diretório data existe
function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  console.log(`📁 Verificando diretório: ${dataDir}`);
  
  if (!fs.existsSync(dataDir)) {
    console.log(`📁 Criando diretório: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Diretório criado com sucesso`);
  } else {
    console.log(`✅ Diretório já existe`);
  }
  
  // Verificar se o arquivo do banco existe
  if (fs.existsSync(DB_PATH)) {
    console.log(`✅ Banco de dados já existe: ${DB_PATH}`);
    const stats = fs.statSync(DB_PATH);
    console.log(`📊 Tamanho do banco: ${stats.size} bytes`);
    console.log(`📅 Última modificação: ${stats.mtime}`);
  } else {
    console.log(`🆕 Banco de dados será criado: ${DB_PATH}`);
  }
}

// Criar conexão com o banco
function createConnection() {
  ensureDataDir();
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Erro ao conectar com SQLite:', err.message);
    } else {
      console.log('Conectado ao banco SQLite');
    }
  });
}

// Executar query com Promise
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Buscar dados com Promise
function getQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Buscar todos com Promise
function allQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Inicializar tabelas
async function initDatabase() {
  const db = createConnection();
  
  try {
    // Tabela de admins
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de quizzes
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        published BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins (id)
      )
    `);

    // Tabela de perguntas
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        options TEXT NOT NULL, -- JSON array
        correct_option_id TEXT NOT NULL,
        time_limit_seconds INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
      )
    `);

    // Tabela de lobbies/sessões
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS lobbies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        lobby_id TEXT UNIQUE NOT NULL,
        admin_id INTEGER NOT NULL,
        status TEXT DEFAULT 'waiting', -- waiting, running, finished
        started_at DATETIME,
        finished_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id),
        FOREIGN KEY (admin_id) REFERENCES admins (id)
      )
    `);

    // Tabela de participantes
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lobby_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        socket_id TEXT,
        score INTEGER DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lobby_id, nickname)
      )
    `);

    // Tabela de respostas
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lobby_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        participant_id INTEGER NOT NULL,
        option_id TEXT NOT NULL,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        correct BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (question_id) REFERENCES questions (id),
        FOREIGN KEY (participant_id) REFERENCES participants (id)
      )
    `);

    console.log('✅ Tabelas criadas com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    db.close();
  }
}

  module.exports = {
    createConnection,
    runQuery,
    getQuery,
    allQuery,
    initDatabase
  };
} // Fechar bloco SQLite
