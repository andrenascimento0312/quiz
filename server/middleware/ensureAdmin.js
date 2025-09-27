const bcrypt = require('bcrypt');
const { createConnection, runQuery } = require('../database/init');
const { getConfig } = require('../config/defaults');

// 🛡️ MIDDLEWARE DE PROTEÇÃO: Garante que o admin sempre existe
async function ensureAdminExists(req, res, next) {
  // Só executar em produção para não afetar desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  try {
    const config = getConfig();
    const db = createConnection();
    
    // Verificar se o admin específico existe
    const admin = await runQuery(db, 'SELECT id FROM admins WHERE email = ?', [config.admin.email]);
    
    if (!admin) {
      console.log('🚨 EMERGÊNCIA: Admin não encontrado, recriando...');
      const passwordHash = await bcrypt.hash(config.admin.password, 12);
      
      await runQuery(db, `
        INSERT INTO admins (name, email, password_hash, role, status, approved_at) 
        VALUES (?, ?, ?, 'superadmin', 'approved', CURRENT_TIMESTAMP)
      `, [
        config.admin.name,
        config.admin.email,
        passwordHash
      ]);
      
      console.log('✅ EMERGÊNCIA: Admin recriado com sucesso');
    }
    
    db.close();
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de proteção:', error);
    next(); // Continuar mesmo com erro para não quebrar o sistema
  }
}

module.exports = { ensureAdminExists };
