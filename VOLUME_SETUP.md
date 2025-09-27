# 🗄️ Configuração de Volume Persistente SQLite

## 🚨 **Problema**: Banco SQLite apaga a cada deploy no Railway

## ✅ **Solução**: Volume Persistente SQLite

### **Configuração Automática**

O sistema já está configurado para usar volume persistente:

#### **1. railway.json**
```json
{
  "volumes": [
    {
      "name": "quiz-database",
      "mountPath": "/app/data"
    }
  ]
}
```

#### **2. Caminho do Banco**
```javascript
// server/database/init.js
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/app/data/quiz.db'  // Railway volume persistente
  : path.join(__dirname, '../data/quiz.db'); // Local
```

---

## 🚀 **Como Funciona**

### **Desenvolvimento Local:**
- Usa `./server/data/quiz.db`
- Banco local, não persistente

### **Produção (Railway):**
- Usa `/app/data/quiz.db`
- Volume persistente montado
- Dados mantidos entre deploys

---

## 📋 **Logs de Verificação**

### **Logs Esperados no Deploy:**
```
🗄️ Caminho do banco: /app/data/quiz.db
🗄️ Ambiente: production
🗄️ Volume persistente: SIM
📁 Verificando diretório: /app/data
✅ Diretório já existe
✅ Banco de dados já existe: /app/data/quiz.db
📊 Tamanho do banco: [tamanho] bytes
📅 Última modificação: [data]
```

### **Primeiro Deploy:**
```
🗄️ Caminho do banco: /app/data/quiz.db
🗄️ Ambiente: production
🗄️ Volume persistente: SIM
📁 Verificando diretório: /app/data
📁 Criando diretório: /app/data
✅ Diretório criado com sucesso
🆕 Banco de dados será criado: /app/data/quiz.db
```

---

## 🎯 **Teste de Persistência**

### **1. Primeiro Deploy:**
1. Faça deploy no Railway
2. Crie um admin
3. Crie um quiz
4. Verifique se funciona

### **2. Segundo Deploy:**
1. Faça outro deploy (qualquer mudança)
2. Verifique se o admin ainda existe
3. Verifique se o quiz ainda existe
4. **Dados devem estar preservados**

---

## 🛠️ **Troubleshooting**

### **Se o volume não funcionar:**

#### **Verificar Logs:**
- Procure por `🗄️ Volume persistente: SIM`
- Verifique se o diretório `/app/data` existe
- Confirme se o arquivo `quiz.db` existe

#### **Verificar Configuração:**
- `railway.json` deve ter a seção `volumes`
- `mountPath` deve ser `/app/data`
- `name` deve ser `quiz-database`

#### **Verificar Permissões:**
- Railway deve ter permissão para montar volumes
- Plano gratuito pode ter limitações

---

## 📊 **Vantagens do Volume Persistente**

- ✅ **Dados preservados** entre deploys
- ✅ **Sem configuração adicional** no Railway
- ✅ **Funciona imediatamente** após deploy
- ✅ **Logs detalhados** para debug
- ✅ **Compatível** com todos os planos

---

## 🆘 **Se Não Funcionar**

### **Opção A: PostgreSQL**
- Adicionar serviço PostgreSQL no Railway
- Conectar ao backend
- Sistema detecta automaticamente

### **Opção B: Verificar Plano**
- Planos gratuitos podem ter limitações
- Considerar upgrade se necessário

---

**🎉 Com volume persistente, seus dados estarão SEGUROS para sempre!**
