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
    
    // Verificar se o admin específico existe E está aprovado
    const admin = await runQuery(db, 'SELECT id, status FROM admins WHERE email = ?', [config.admin.email]);
    
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
      
      console.log('✅ EMERGÊNCIA: Admin recriado com status approved');
    } else if (admin.status !== 'approved') {
      console.log('🚨 EMERGÊNCIA: Admin existe mas status inválido:', admin.status, '- Corrigindo...');
      
      await runQuery(db, `
        UPDATE admins 
        SET status = 'approved', role = 'superadmin', approved_at = CURRENT_TIMESTAMP 
        WHERE email = ?
      `, [config.admin.email]);
      
      console.log('✅ EMERGÊNCIA: Status do admin corrigido para approved');
    } else {
      console.log('✅ Admin existe e está aprovado');
    }
    
    db.close();
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de proteção:', error);
    next(); // Continuar mesmo com erro para não quebrar o sistema
  }
}

module.exports = { ensureAdminExists };
