const { initDatabase } = require('../database/init');
const { migrateUsers } = require('./migrate-users');
const bcrypt = require('bcrypt');
const { createConnection, runQuery } = require('../database/init');
const { getConfig } = require('../config/defaults');

async function initProduction() {
  console.log('🚀 Inicializando aplicação para produção...');
  
  try {
    // 1. Inicializar banco de dados
    console.log('🔄 Inicializando banco de dados...');
    await initDatabase();
    console.log('✅ Banco de dados inicializado');
    
    // 2. Executar migração de usuários
    console.log('🔄 Executando migração de usuários...');
    await migrateUsers();
    console.log('✅ Migração de usuários concluída');
    
    // 3. Criar admin padrão se não existir
    console.log('🔄 Verificando admin padrão...');
    const config = getConfig();
    const db = createConnection();
    
    try {
      const adminCount = await runQuery(db, 'SELECT COUNT(*) as count FROM admins');
      
      if (adminCount.count === 0) {
        console.log('🔄 Criando admin padrão...');
        const passwordHash = await bcrypt.hash(config.admin.password, 12);
        
        await runQuery(db, `
          INSERT INTO admins (name, email, password_hash, role, status, approved_at) 
          VALUES (?, ?, ?, 'superadmin', 'approved', CURRENT_TIMESTAMP)
        `, [
          config.admin.name,
          config.admin.email,
          passwordHash
        ]);
        
        console.log('✅ Admin padrão criado:', {
          email: config.admin.email,
          password: '****** (configurado com segurança)'
        });
      } else {
        console.log('ℹ️ Admin já existe, pulando criação');
      }
    } finally {
      db.close();
    }
    
    console.log('🎉 Inicialização da produção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização da produção:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initProduction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initProduction };
