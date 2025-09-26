const { createConnection, runQuery } = require('../database/init');

async function migrateUsers() {
  console.log('🔄 Executando migração do sistema de usuários...');
  
  const db = createConnection();
  
  try {
    // Adicionar novos campos à tabela admins
    await runQuery(db, `
      ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'superadmin'))
    `).catch(() => console.log('Campo role já existe'));

    await runQuery(db, `
      ALTER TABLE admins ADD COLUMN status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'restricted'))
    `).catch(() => console.log('Campo status já existe'));

    await runQuery(db, `
      ALTER TABLE admins ADD COLUMN phone TEXT
    `).catch(() => console.log('Campo phone já existe'));

    await runQuery(db, `
      ALTER TABLE admins ADD COLUMN avatar TEXT
    `).catch(() => console.log('Campo avatar já existe'));

    await runQuery(db, `
      ALTER TABLE admins ADD COLUMN approved_by INTEGER
    `).catch(() => console.log('Campo approved_by já existe'));

    await runQuery(db, `
      ALTER TABLE admins ADD COLUMN approved_at DATETIME
    `).catch(() => console.log('Campo approved_at já existe'));

    // Criar tabela de tokens de recuperação de senha
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins (id)
      )
    `);

    // Criar tabela de logs de ações do superadmin
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        superadmin_id INTEGER NOT NULL,
        target_admin_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- 'approve', 'reject', 'restrict', 'unrestrict', 'delete'
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (superadmin_id) REFERENCES admins (id),
        FOREIGN KEY (target_admin_id) REFERENCES admins (id)
      )
    `);

    // Atualizar admin existente para superadmin se for o primeiro
    const adminCount = await runQuery(db, 'SELECT COUNT(*) as count FROM admins');
    if (adminCount && adminCount.count === 1) {
      await runQuery(db, `
        UPDATE admins 
        SET role = 'superadmin', status = 'approved', approved_at = CURRENT_TIMESTAMP 
        WHERE id = 1
      `);
      console.log('✅ Primeiro admin promovido a superadmin');
    }

    console.log('✅ Migração do sistema de usuários concluída!');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateUsers };