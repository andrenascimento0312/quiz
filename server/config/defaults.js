// Configurações padrão para desenvolvimento e produção
module.exports = {
  development: {
    admin: {
      name: 'Admin Desenvolvimento',
      email: 'admin@dev.local',
      password: 'dev123456', // OK para dev
    }
  },
  
  production: {
    admin: {
      name: process.env.DEFAULT_ADMIN_NAME || 'Administrador',
      email: process.env.DEFAULT_ADMIN_EMAIL, // OBRIGATÓRIO em produção
      password: process.env.DEFAULT_ADMIN_PASSWORD, // OBRIGATÓRIO em produção
    },
    
    // Validações de segurança
    validate() {
      if (!this.admin.email || !this.admin.password) {
        throw new Error(`
🚨 ERRO DE SEGURANÇA: Variáveis de ambiente obrigatórias não definidas!

Defina no Railway:
- DEFAULT_ADMIN_EMAIL=seu@email.com
- DEFAULT_ADMIN_PASSWORD=sua-senha-super-secreta-aqui
- DEFAULT_ADMIN_NAME=Seu Nome (opcional)

❌ O sistema não pode iniciar sem essas variáveis em produção!
        `);
      }
      
      if (this.admin.password.length < 8) {
        throw new Error('🚨 SENHA MUITO FRACA: Use pelo menos 8 caracteres!');
      }
      
      return true;
    }
  }
};

// Helper para obter configuração atual
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = module.exports[env];
  
  if (env === 'production') {
    config.validate();
  }
  
  return config;
}

module.exports.getConfig = getConfig;
