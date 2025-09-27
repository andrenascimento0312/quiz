# 🗄️ Configuração de Banco de Dados Persistente

## 🚨 **Problema**: Banco SQLite apaga a cada deploy no Railway

## ✅ **Soluções Implementadas**

### **Opção 1: PostgreSQL (RECOMENDADA)**

#### **No Railway:**
1. **Adicionar PostgreSQL Service:**
   - Railway Dashboard → **Add Service** → **PostgreSQL**
   - Aguarde provisionar

2. **Conectar ao Backend:**
   - **Variables** → **Connect** → Selecionar PostgreSQL
   - Automaticamente adiciona `DATABASE_URL`

3. **Sistema Automático:**
   - ✅ **Com `DATABASE_URL`** → Usa PostgreSQL
   - ✅ **Sem `DATABASE_URL`** → Usa SQLite (desenvolvimento)

#### **Vantagens:**
- 🛡️ **Persistente**: Nunca perde dados
- ⚡ **Performance**: Melhor que SQLite
- 🔄 **Backups**: Automáticos
- 📈 **Escalável**: Suporta mais conexões

---

### **Opção 2: Volume Persistente SQLite**

#### **Configuração:**
```json
// railway.json
{
  "volumes": [
    {
      "name": "quiz-database",
      "mountPath": "/app/data"
    }
  ]
}
```

#### **Limitações:**
- ⚠️ **Pode não funcionar** em todos os planos
- 📁 **Acesso limitado** ao volume
- 🔧 **Mais complexo** para backup

---

## 🚀 **Configuração Automática**

O sistema detecta automaticamente:

```javascript
// server/database/init.js
const USE_POSTGRES = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

if (USE_POSTGRES) {
  // Usa PostgreSQL em produção
} else {
  // Usa SQLite em desenvolvimento
}
```

---

## 📋 **Passos para Resolver**

### **1. Adicionar PostgreSQL no Railway:**
1. **Railway Dashboard**
2. **Add Service** → **PostgreSQL**
3. **Connect** ao seu backend
4. **Redeploy** automático

### **2. Verificar Logs:**
```
🐘 Usando PostgreSQL para produção
✅ PostgreSQL tabelas criadas com sucesso
```

### **3. Testar:**
- ✅ **Criar admin**
- ✅ **Fazer deploy**
- ✅ **Admin ainda existe**

---

## 🎯 **Resultado:**

- **✅ Desenvolvimento**: SQLite (rápido, simples)
- **✅ Produção**: PostgreSQL (robusto, persistente)
- **✅ Dados NUNCA mais apagados**
- **✅ Zero configuração manual**

---

## 🆘 **Troubleshooting**

### **Se PostgreSQL não funcionar:**
1. **Verificar `DATABASE_URL`** nas env vars
2. **Logs do Railway** para erros de conexão
3. **Fallback para SQLite** com volume persistente

### **Se SQLite continuar apagando:**
1. **Verificar se volume está montado**
2. **Logs mostram caminho correto**: `/app/data/quiz.db`
3. **Considerar upgrade do plano Railway**

---

**🎉 Com PostgreSQL, seus dados estarão SEGUROS para sempre!**
