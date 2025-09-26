const { initDatabase } = require('../database/init');

async function migrate() {
  console.log('🔄 Executando migrações do banco de dados...');
  
  try {
    await initDatabase();
    console.log('✅ Migrações executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

migrate();
