# 🏠 Guia de Desenvolvimento Local vs Produção

## 🎯 **Fluxo Ideal: Local → Commit → Deploy**

### **1. 🏠 Desenvolvimento Local**

```bash
# Primeira vez (setup completo)
npm run setup

# Desenvolvimento diário
npm run dev
```

**Credenciais de desenvolvimento:**
- **Email**: `admin@dev.local`
- **Senha**: `dev123456`

### **2. 🚀 Deploy para Produção**

```bash
# Apenas commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push

# Railway faz deploy automático! 🎉
```

---

## 🔧 **Como Funciona**

### **Desenvolvimento Local**
- ✅ **Migração**: Manual com `npm run setup`
- ✅ **Admin**: Criado automaticamente (credenciais fixas)
- ✅ **Banco**: SQLite local (`server/data/quiz.db`)
- ✅ **Hot Reload**: Nodemon + Vite

### **Produção (Railway)**
- ✅ **Migração**: Automática no `postinstall`
- ✅ **Admin**: Criado com variáveis de ambiente
- ✅ **Banco**: SQLite persistente (Railway)
- ✅ **Deploy**: Automático no push

---

## 🔐 **Segurança das Credenciais**

### **❌ Desenvolvimento (Credenciais Expostas - OK)**
```javascript
// server/config/defaults.js - desenvolvimento
{
  email: 'admin@dev.local',
  password: 'dev123456' // OK para desenvolvimento
}
```

### **✅ Produção (Credenciais Protegidas)**
```bash
# Railway Environment Variables (OBRIGATÓRIAS)
DEFAULT_ADMIN_EMAIL=seu@email.com
DEFAULT_ADMIN_PASSWORD=senha-super-secreta-minimo-8-chars
DEFAULT_ADMIN_NAME=Seu Nome Admin
```

**🚨 Se não definir as variáveis em produção, o sistema NÃO INICIA!**

---

## 📋 **Comandos Disponíveis**

### **Desenvolvimento**
```bash
npm run dev              # Inicia desenvolvimento (client + server)
npm run server:dev       # Apenas servidor
npm run client:dev       # Apenas cliente
npm run setup            # Setup inicial completo
npm run migrate          # Apenas migração do banco
npm run seed             # Dados de exemplo
```

### **Produção**
```bash
npm start                # Inicia servidor de produção
npm run init:production  # Inicialização manual
npm run deploy:railway   # Deploy manual (Railway faz automático)
```

---

## 🔄 **Fluxo de Trabalho Recomendado**

### **1. Primeira vez**
```bash
git clone https://github.com/andrenascimento0312/quiz.git
cd quiz
npm run setup
npm run dev
```
**Acesse**: http://localhost:5173/admin/login
**Login**: admin@dev.local / dev123456

### **2. Desenvolvimento diário**
```bash
npm run dev
# Desenvolve, testa, commita
git add .
git commit -m "feat: nova funcionalidade"
git push
# Railway faz deploy automático
```

### **3. Configurar produção (uma vez)**
No Railway, definir:
- `DEFAULT_ADMIN_EMAIL`=seu@email.com
- `DEFAULT_ADMIN_PASSWORD`=senha-forte-aqui
- `DEFAULT_ADMIN_NAME`=Seu Nome

---

## 🛡️ **Validações de Segurança**

### **Produção**
- ✅ **Email obrigatório**: Deve estar nas env vars
- ✅ **Senha forte**: Mínimo 8 caracteres
- ✅ **Não loga senha**: Apenas asteriscos nos logs
- ✅ **Validação automática**: Sistema não inicia se inválido

### **Desenvolvimento**
- ⚠️ **Credenciais fixas**: OK para desenvolvimento
- ⚠️ **Logs detalhados**: Para debug
- ⚠️ **Sem validação**: Para facilitar desenvolvimento

---

## 🎯 **Resumo**

| Aspecto | Desenvolvimento | Produção |
|---------|-----------------|----------|
| **Comando** | `npm run dev` | `npm start` |
| **Credenciais** | Fixas no código | Variáveis de ambiente |
| **Migração** | Manual | Automática |
| **Deploy** | Local | Railway automático |
| **Banco** | SQLite local | SQLite Railway |
| **Segurança** | Relaxada | Rigorosa |

**🎉 Resultado: Desenvolvimento fácil, produção segura!**
