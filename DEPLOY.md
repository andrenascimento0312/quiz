# 🚀 Guia de Deploy - Quiz Realtime

## ✅ Sistema em Produção

**🌐 URLs Ativas:**
- **Aplicação**: https://quiz-ten-beta-25.vercel.app/
- **Backend**: https://quiz-production-8b29.up.railway.app  
- **Admin**: https://quiz-ten-beta-25.vercel.app/admin/login

**📊 Status:** ✅ Online e Funcional  
**📅 Último Deploy:** Setembro 2025

## 📋 Visão Geral

- **Frontend (React)** → **Vercel** (grátis, CDN global)
- **Backend (Node.js + Socket.IO)** → **Railway** (auto-scaling)

---

## 🎯 **Passo a Passo Completo**

### **1. Deploy do Backend (Railway)**

#### **1.1 Criar conta no Railway**
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Conecte seu repositório

#### **1.2 Configurar variáveis de ambiente**
No painel do Railway, adicione:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=seu-jwt-secret-muito-secreto-e-longo
FRONTEND_URL=https://seu-quiz.vercel.app
DEFAULT_ADMIN_EMAIL=admin@seudominio.com
DEFAULT_ADMIN_PASSWORD=sua-senha-super-secreta
DEFAULT_ADMIN_NAME=Administrador
```

#### **1.3 Deploy automático**
- Railway detecta automaticamente Node.js
- Executa `npm install` e `npm start`
- Migração do banco roda automaticamente (`postinstall`)

#### **1.4 Obter URL do backend**
- Anote a URL gerada (ex: `https://quiz-backend-production.up.railway.app`)

---

### **2. Deploy do Frontend (Vercel)**

#### **2.1 Preparar o projeto**
1. Na **Vercel**, clique em "New Project"
2. Conecte seu repositório GitHub
3. Selecione o repositório `quiz`

#### **2.2 Configurar build**
- **Framework Preset**: Other
- **Root Directory**: `./` (raiz)
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `cd client && npm install`

#### **2.3 Configurar variáveis de ambiente**
No painel da Vercel, adicione:

```env
VITE_API_URL=https://sua-url-do-railway.up.railway.app
VITE_SOCKET_URL=https://sua-url-do-railway.up.railway.app
```

#### **2.4 Atualizar configuração do cliente**
Edite `client/src/config/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export { API_BASE_URL, SOCKET_URL };
```

#### **2.5 Deploy automático**
- Vercel faz deploy automaticamente
- Anote a URL gerada (ex: `https://quiz-frontend.vercel.app`)

---

### **3. Atualizar URLs finais**

#### **3.1 No Railway (Backend)**
Atualize a variável:
```env
FRONTEND_URL=https://quiz-frontend.vercel.app
```

#### **3.2 Na Vercel (Frontend)**
Atualize as variáveis:
```env
VITE_API_URL=https://quiz-backend-production.up.railway.app
VITE_SOCKET_URL=https://quiz-backend-production.up.railway.app
```

---

## ✅ **Checklist Final**

### Backend (Railway)
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] URL do backend anotada
- [ ] Banco de dados migrado automaticamente
- [ ] Admin padrão criado

### Frontend (Vercel)
- [ ] Repositório conectado
- [ ] Build configurado corretamente
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] URL do frontend anotada

### Integração
- [ ] Frontend conecta com backend
- [ ] WebSocket funciona
- [ ] Login de admin funciona
- [ ] Criação de quiz funciona
- [ ] Participantes conseguem entrar
- [ ] Quiz em tempo real funciona

---

## 🔧 **Comandos Úteis**

### Testar localmente com URLs de produção:
```bash
# Terminal 1 - Backend local
npm run server:dev

# Terminal 2 - Frontend com backend remoto
cd client
VITE_API_URL=https://sua-url-railway.up.railway.app npm run dev
```

### Logs do Railway:
```bash
# Ver logs em tempo real
railway logs --follow
```

### Redeploy manual:
```bash
# Railway
git push origin main

# Vercel
# Qualquer push na main faz redeploy automático
```

---

## 🚨 **Solução de Problemas**

### CORS Error
- Verifique `FRONTEND_URL` no Railway
- Verifique `VITE_API_URL` na Vercel

### WebSocket não conecta
- Verifique `VITE_SOCKET_URL` na Vercel
- Confirme que Railway permite WebSocket

### Build falha na Vercel
- Verifique `Build Command`: `cd client && npm run build`
- Verifique `Output Directory`: `client/dist`

### Admin não consegue logar
- Verifique variáveis `DEFAULT_ADMIN_*` no Railway
- Verifique logs do Railway para criação do admin

---

## 💡 **Dicas de Otimização**

### Performance
- Railway: Usar PostgreSQL em produção (grátis)
- Vercel: Configurar cache headers
- Comprimir assets estáticos

### Monitoramento
- Railway: Logs automáticos
- Vercel: Analytics integrado
- Configurar alertas de erro

### Segurança
- JWT_SECRET forte (32+ caracteres)
- HTTPS obrigatório
- Rate limiting configurado

---

## ✅ Deploy Testado e Validado

### 🧪 Testes Realizados
- ✅ **Login de Admin**: Funcionando
- ✅ **Criação de Quiz**: Operacional  
- ✅ **Lobby em Tempo Real**: WebSocket ativo
- ✅ **Entrada de Participantes**: Via código
- ✅ **Quiz Completo**: Perguntas, respostas, timer
- ✅ **Resultados Finais**: Ranking correto
- ✅ **Reconexão**: Automática em caso de queda

### 🔧 Configurações Validadas
- ✅ **CORS**: Configurado entre Vercel ↔ Railway
- ✅ **WebSocket**: Funcional em produção (wss://)
- ✅ **Environment Variables**: Todas configuradas
- ✅ **JWT**: Autenticação funcionando
- ✅ **Database**: SQLite persistente no Railway
- ✅ **Auto-deploy**: Push automático funcionando

### 📊 Performance
- ⚡ **Frontend**: CDN global (Vercel)
- 🚀 **Backend**: Auto-scaling (Railway)
- 🔄 **WebSocket**: Baixa latência
- 💾 **Database**: Resposta rápida
- 🌍 **Global**: Acessível mundialmente

---

**🎉 Sistema Online e Funcional!**

**URLs de Produção:**
- **Frontend**: https://quiz-ten-beta-25.vercel.app/
- **Backend**: https://quiz-production-8b29.up.railway.app
- **Admin**: https://quiz-ten-beta-25.vercel.app/admin/login

**📅 Última Atualização**: Setembro 2025  
**🏆 Status**: ✅ Deploy Completo e Testado
