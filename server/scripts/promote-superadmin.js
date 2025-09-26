const { createConnection, runQuery, getQuery } = require('../database/init');

async function promoteSuperAdmin() {
  console.log('🔄 Promovendo usuário para SuperAdmin...');
  
  const db = createConnection();
  
  try {
    // Buscar o primeiro usuário (ou perguntar qual email)
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Por favor, forneça o email do usuário:');
      console.log('node server/scripts/promote-superadmin.js seu@email.com');
      return;
    }

    // Buscar usuário
    const user = await getQuery(db, 'SELECT id, name, email FROM admins WHERE email = ?', [email]);
    
    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado`);
      return;
    }

    // Promover para superadmin
    await runQuery(db, `
      UPDATE admins 
      SET role = 'superadmin', status = 'approved', approved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [user.id]);

    console.log(`✅ ${user.name} (${user.email}) promovido para SuperAdmin!`);

  } catch (error) {
    console.error('❌ Erro ao promover usuário:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  promoteSuperAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { promoteSuperAdmin };
