const { Pool } = require('pg');

let pool = null;

// Criar pool de conexões PostgreSQL
function createPool() {
  if (pool) return pool;
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  return pool;
}

// Executar query com Promise
function runQuery(query, params = []) {
  return new Promise(async (resolve, reject) => {
    const client = createPool();
    try {
      const result = await client.query(query, params);
      // Para INSERT, retornar o ID do registro inserido
      if (query.trim().toUpperCase().startsWith('INSERT') && result.rows.length > 0) {
        resolve({ id: result.rows[0].id, ...result.rows[0] });
      } else {
        resolve(result.rows[0] || result);
      }
    } catch (err) {
      reject(err);
    }
  });
}

// Buscar uma linha
function getQuery(query, params = []) {
  return new Promise(async (resolve, reject) => {
    const client = createPool();
    try {
      const result = await client.query(query, params);
      resolve(result.rows[0] || null);
    } catch (err) {
      reject(err);
    }
  });
}

// Buscar múltiplas linhas
function allQuery(query, params = []) {
  return new Promise(async (resolve, reject) => {
    const client = createPool();
    try {
      const result = await client.query(query, params);
      resolve(result.rows);
    } catch (err) {
      reject(err);
    }
  });
}

// Inicializar tabelas PostgreSQL
async function initPostgresDatabase() {
  console.log('🐘 Inicializando PostgreSQL...');
  
  try {
    // Tabela de admins
    await runQuery(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' CHECK(role IN ('admin', 'superadmin')),
        status VARCHAR(50) DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected', 'restricted')),
        phone VARCHAR(50),
        avatar TEXT,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de quizzes
    await runQuery(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins (id)
      )
    `);

    // Tabela de perguntas
    await runQuery(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_option_id VARCHAR(1) NOT NULL,
        time_limit_seconds INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
      )
    `);

    // Tabela de lobbies
    await runQuery(`
      CREATE TABLE IF NOT EXISTS lobbies (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        lobby_id VARCHAR(50) UNIQUE NOT NULL,
        admin_id INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting',
        started_at TIMESTAMP,
        finished_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id),
        FOREIGN KEY (admin_id) REFERENCES admins (id)
      )
    `);

    // Tabela de participantes
    await runQuery(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        lobby_id VARCHAR(50) NOT NULL,
        nickname VARCHAR(255) NOT NULL,
        socket_id VARCHAR(255),
        score INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lobby_id, nickname)
      )
    `);

    // Tabela de respostas
    await runQuery(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        lobby_id VARCHAR(50) NOT NULL,
        question_id INTEGER NOT NULL,
        participant_id INTEGER NOT NULL,
        option_id VARCHAR(1) NOT NULL,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        correct BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (question_id) REFERENCES questions (id),
        FOREIGN KEY (participant_id) REFERENCES participants (id)
      )
    `);

    // Tabela de tokens de reset
    await runQuery(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins (id)
      )
    `);

    // Tabela de logs
    await runQuery(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        superadmin_id INTEGER NOT NULL,
        target_admin_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (superadmin_id) REFERENCES admins (id),
        FOREIGN KEY (target_admin_id) REFERENCES admins (id)
      )
    `);

    console.log('✅ PostgreSQL tabelas criadas com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas PostgreSQL:', error);
    throw error;
  }
}

module.exports = {
  createPool,
  runQuery,
  getQuery,
  allQuery,
  initDatabase: initPostgresDatabase
};
