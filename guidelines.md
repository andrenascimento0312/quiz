# Guidelines de Desenvolvimento - Quiz Realtime

## 📋 Visão Geral

Este documento estabelece as diretrizes e padrões de desenvolvimento para o sistema de Quiz em Tempo Real, uma aplicação que utiliza React no frontend e Node.js com Socket.IO no backend.

## 🏗️ Arquitetura

### Frontend (React + Vite)
- **Framework**: React 18+ com Vite
- **Estilização**: Tailwind CSS
- **Estado Global**: Context API
- **Comunicação**: Socket.IO Client + Fetch API

### Backend (Node.js + Express)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Banco de Dados**: SQLite3
- **Tempo Real**: Socket.IO
- **Autenticação**: JWT + bcrypt

## 📁 Estrutura de Pastas

```
quiz/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas/rotas principais
│   │   └── contexts/      # Context API para estado global
├── server/                # Backend Node.js
│   ├── routes/           # Rotas da API REST
│   ├── socket/           # Handlers do Socket.IO
│   ├── database/         # Configuração do banco
│   ├── middleware/       # Middlewares customizados
│   └── scripts/          # Scripts de migração e seed
└── docs/                 # Documentação
```

## 🔧 Padrões de Código

### Nomenclatura

#### JavaScript/React
- **Variáveis e funções**: camelCase (`userName`, `handleSubmit`)
- **Componentes**: PascalCase (`AdminDashboard`, `QuizBuilder`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Arquivos**: kebab-case para utilitários, PascalCase para componentes

#### Banco de Dados
- **Tabelas**: snake_case (`quiz_sessions`, `user_answers`)
- **Colunas**: snake_case (`created_at`, `user_id`)

### Estrutura de Componentes React

```jsx
// Imports externos
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Imports internos
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

// Componente principal
const ComponentName = () => {
  // Estados
  const [localState, setLocalState] = useState(null);
  
  // Hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    // Lógica de efeito
  }, []);
  
  // Handlers
  const handleAction = () => {
    // Lógica do handler
  };
  
  // Render
  return (
    <Layout>
      {/* JSX */}
    </Layout>
  );
};

export default ComponentName;
```

### API Routes Pattern

```javascript
// Imports
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schemas de validação (se necessário)
const schema = Joi.object({
  // definições
});

// Route handler
router.get('/endpoint', authenticateToken, async (req, res) => {
  try {
    // Lógica principal
    res.json({ data });
  } catch (error) {
    console.error('Erro descritivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
```

## 🔒 Segurança

### Autenticação
- JWT tokens para autenticação
- Refresh tokens não implementados (considerar para produção)
- Senhas hasheadas com bcrypt (salt rounds: 12)

### Validação
- Joi para validação de schemas no backend
- Validação no frontend para UX
- Rate limiting implementado

### Headers de Segurança
- Helmet.js configurado
- CORS configurado adequadamente

## 🌐 Comunicação em Tempo Real

### Socket.IO Events

#### Cliente → Servidor
- `admin_auth`: Autenticação do administrador
- `join-lobby`: Entrar em um lobby
- `leave-lobby`: Sair de um lobby
- `submit-answer`: Enviar resposta
- `start-quiz`: Iniciar quiz (admin)
- `kick_participant`: Remover participante (admin)

#### Servidor → Cliente
- `admin_authenticated`: Confirmação de autenticação do admin
- `lobby_update`: Atualização do estado do lobby (participantes, contagem)
- `start_allowed`: Indica se quiz pode ser iniciado (mín. 2 participantes)
- `question_start`: Nova pergunta iniciada
- `question_end`: Pergunta finalizada
- `quiz_end`: Quiz finalizado
- `join_success`: Confirmação de entrada no lobby
- `join_error`: Erro ao entrar no lobby
- `kicked`: Participante foi removido pelo admin

#### Logs de Debug
- `🔌 Cliente conectado/desconectado`: Conexões WebSocket
- `🔐 Admin tentando autenticar`: Tentativas de autenticação
- `✅ Admin autenticado`: Autenticação bem-sucedida
- `👤 Participante entrou`: Entrada de participantes
- `📡 Enviando atualização`: Eventos enviados para lobby
- `📝 Participantes`: Lista de participantes no lobby

### Configurações
- **Mínimo de participantes**: 2 (configurável)
- **Reconexão automática**: Participantes reconectam automaticamente
- **Estado em memória**: Sincronizado com banco de dados
- **Logs detalhados**: Habilitados para debugging

## 💾 Banco de Dados

### Convenções
- Primary keys: `id` (INTEGER AUTOINCREMENT)
- Foreign keys: `{table}_id` (ex: `user_id`, `quiz_id`)
- Timestamps: `created_at`, `updated_at` (TEXT ISO format)
- Soft deletes: `deleted_at` quando necessário

### Transações
- Usar transações para operações críticas
- Sempre fechar conexões de banco
- Tratamento adequado de erros

## 🧪 Testes

### Frontend
- Testes unitários com React Testing Library
- Testes de integração para fluxos críticos

### Backend
- Testes de API com Jest/Supertest
- Testes de Socket.IO events
- Testes de banco de dados com dados mockados

## 🚀 Deploy e Ambiente

### Variáveis de Ambiente
```env
# Backend
PORT=3001
JWT_SECRET=your-secret-key
DB_PATH=./data/quiz.db

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Scripts NPM
- `npm run dev`: Desenvolvimento (frontend + backend)
- `npm run build`: Build para produção
- `npm run migrate`: Executar migrações básicas
- `npm run seed`: Popular banco com dados de teste

### Scripts de Migração
- `node server/scripts/migrate.js`: Migração básica do banco
- `node server/scripts/migrate-users.js`: Migração do sistema de usuários (role/status)
- `node server/scripts/promote-superadmin.js`: Promover admin para superadmin
- `node server/scripts/seed.js`: Popular dados de teste

## 📝 Documentação

### Comentários de Código
- JSDoc para funções complexas
- Comentários explicativos para lógica não óbvia
- README atualizado para cada módulo importante

### API Documentation
- Documentar endpoints REST
- Documentar eventos Socket.IO
- Exemplos de uso em `docs/`

## 🐛 Tratamento de Erros

### Frontend
- Error boundaries para componentes React
- Toasts/notificações para feedback ao usuário
- Fallbacks para estados de erro
- Logs detalhados no console para debugging
- Reconexão automática em caso de desconexão WebSocket

### Backend
- Try-catch em todas as operações assíncronas
- Logs estruturados para debugging com emojis para fácil identificação
- Status codes HTTP apropriados
- Mensagens de erro padronizadas
- Sistema de logs para WebSocket (conexão, autenticação, eventos)
- Logs de entrada/saída de participantes
- Monitoramento de estado do lobby em memória vs banco de dados

## 📊 Performance

### Frontend
- Lazy loading de componentes
- Memoização quando apropriado
- Otimização de re-renders

### Backend
- Connection pooling para banco de dados
- Rate limiting
- Compressão de responses
- Caching quando apropriado

## 🔄 Git Workflow

### Commits
- Conventional Commits format
- Commits pequenos e focados
- Mensagens descritivas em português

### Branches
- `main`: Código de produção
- `develop`: Desenvolvimento ativo
- `feature/`: Novas funcionalidades
- `fix/`: Correções de bugs

### Pull Requests
- Revisão de código obrigatória
- Testes passando
- Documentação atualizada

## 📚 Recursos Adicionais

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🔧 Debugging e Troubleshooting

### Problemas Comuns

#### WebSocket não sincroniza
1. **Verificar logs do servidor**: Procurar por logs de autenticação e eventos
2. **Console do navegador**: Verificar se eventos estão sendo recebidos
3. **Estado do lobby**: Confirmar se lobby existe em memória
4. **Reconexão**: Participantes devem reconectar automaticamente

#### Erro 403 na autenticação
1. **Executar migração**: `node server/scripts/migrate-users.js`
2. **Verificar status do admin**: Deve ser 'approved'
3. **Token válido**: Verificar se token não expirou

#### Porta em uso (EADDRINUSE)
1. **Matar processo**: `taskkill /f /im node.exe` (Windows) ou `pkill node` (Linux/Mac)
2. **Verificar porta**: `netstat -ano | findstr :3001`
3. **Reiniciar servidor**: `npm run dev`

#### Participantes não aparecem
1. **Verificar logs**: Procurar por "👤 Participante entrou"
2. **Estado em memória**: Verificar se lobby foi inicializado corretamente
3. **Banco vs Memória**: Confirmar sincronização entre banco e estado em memória

### Logs Importantes
- `🔐 Admin tentando autenticar no lobby: {lobbyId}`
- `✅ Admin {name} autenticado no lobby {lobbyId}`
- `👤 Participante {nickname} entrou no lobby {lobbyId}`
- `📡 Enviando atualização do lobby {lobbyId}: {count} participantes`

---

**Última atualização**: Dezembro 2024
**Versão**: 1.1.0

## 📋 Changelog

### v1.2.0 (Setembro 2025)
- ✅ **Quiz Flow Completo**: Indexação de perguntas corrigida (sempre inicia na pergunta 1)
- ✅ **Finalização Inteligente**: Avança quando todos respondem (não espera tempo limite)
- ✅ **Tela Intermediária**: Mostra quem acertou + timer de 3s para próxima pergunta
- ✅ **Resultados Reais**: Removidos dados fictícios, agora usa participantes reais
- ✅ **Logs Seguros**: Removidas informações sensíveis dos logs do servidor
- ✅ **Validação Aprimorada**: Schema permite `dbId` e `tempId` para edição de quizzes
- ✅ **Timer Visual**: Contagem regressiva animada entre perguntas
- ✅ **Delay de Segurança**: 2s para admin ver pergunta antes de avanço automático

### v1.1.0 (Dezembro 2024)
- ✅ Mínimo de participantes reduzido para 2
- ✅ Sistema de logs detalhados implementado
- ✅ Correção de sincronização WebSocket
- ✅ Migração automática do banco de dados
- ✅ Reconexão automática de participantes
- ✅ Debugging melhorado com emojis nos logs

### v1.0.0 (Setembro 2024)
- 🚀 Versão inicial do sistema
- ⚡ WebSocket em tempo real
- 🔐 Sistema de autenticação
- 📊 Dashboard administrativo

### v1.3.0 (Setembro 2025) - Deploy em Produção
- 🌐 **Deploy completo**: Vercel + Railway
- ⚡ **WebSocket em produção**: Funcional com CORS
- 🔧 **Configuração otimizada**: Environment variables
- 🚀 **Auto-deploy**: Push automático para produção
- 📊 **Monitoramento**: Logs estruturados
- 🔐 **Segurança**: HTTPS + JWT em produção

## 🌐 Informações de Produção

### URLs Ativas
- **Aplicação**: https://quiz-ten-beta-25.vercel.app/
- **API Backend**: https://quiz-production-8b29.up.railway.app
- **Painel Admin**: https://quiz-ten-beta-25.vercel.app/admin/login

### Arquitetura de Deploy
```
Frontend (Vercel) ←→ Backend (Railway)
     ↓                     ↓
   React SPA          Node.js + Socket.IO
   Vite Build           SQLite Database
   CDN Global          Auto-scaling
```

### Status do Sistema
- ✅ **Frontend**: Online (Vercel CDN)
- ✅ **Backend**: Online (Railway)
- ✅ **WebSocket**: Funcional
- ✅ **Database**: Ativo (SQLite)
- ✅ **Authentication**: JWT funcionando
- ✅ **CORS**: Configurado corretamente

---

**Última atualização**: Setembro 2025  
**Versão**: 1.3.0 - Sistema em Produção  
**Status**: ✅ Online e Operacional
