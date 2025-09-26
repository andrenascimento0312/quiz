# 🎯 Quiz Tempo Real

Sistema completo de quiz interativo em tempo real com múltiplos participantes, construído com React, Node.js, Express, Socket.IO e SQLite.

## ✨ Funcionalidades

### 👨‍💼 Para Administradores
- ✅ Registro e login com JWT
- ✅ Dashboard com lista de quizzes
- ✅ Criador de quiz (até 20 perguntas, 4 opções cada)
- ✅ Configuração de tempo por pergunta (15, 30, 45, 60s)
- ✅ Geração de link público e QR Code
- ✅ Gerenciamento de lobby em tempo real
- ✅ Remoção de participantes (kick)
- ✅ Controle de início (mínimo 5 participantes)
- ✅ Acompanhamento do quiz em tempo real

### 👥 Para Participantes
- ✅ Entrada via link/QR Code com nickname único
- ✅ Lobby de espera com lista de participantes
- ✅ Interface de quiz responsiva e intuitiva
- ✅ Timer sincronizado com servidor
- ✅ Feedback instantâneo de respostas
- ✅ Ranking em tempo real após cada pergunta
- ✅ Resultados finais com pódio

### 🚀 Recursos Técnicos
- ✅ WebSocket em tempo real (Socket.IO)
- ✅ Servidor autoritativo para timing
- ✅ Reconexão automática de participantes
- ✅ Ranking com ordenação alfabética para empates
- ✅ Interface responsiva (mobile-first)
- ✅ Autenticação JWT segura
- ✅ Banco SQLite para desenvolvimento
- ✅ Rate limiting e segurança

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🛠️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd quiz-realtime
```

### 2. Instalação automática
```bash
npm run setup
```

Este comando irá:
- Instalar dependências do backend e frontend
- Executar migrações do banco de dados
- Criar dados de exemplo (admin + quiz)

### 3. Configuração manual (opcional)

Se preferir fazer passo a passo:

```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd client
npm install
cd ..

# Configurar banco de dados
npm run migrate
npm run seed
```

### 4. Variáveis de ambiente

Copie os arquivos de exemplo e ajuste conforme necessário:

```bash
# Backend
cp env.example .env

# Frontend  
cp client/env.example client/.env
```

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
# Inicia backend e frontend simultaneamente
npm run dev
```

O servidor estará rodando em:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Produção
```bash
# Build do frontend
npm run build

# Iniciar servidor de produção
npm start
```

## 🎮 Como Testar

### Dados de Acesso Padrão
- **Email**: admin@teste.com
- **Senha**: 123456

### Teste Completo (Cenário Recomendado)

1. **Acesse como Admin**
   - Vá para http://localhost:5173
   - Faça login com as credenciais acima
   - Ou crie uma nova conta

2. **Crie ou Use Quiz Exemplo**
   - No dashboard, você verá um quiz de exemplo
   - Ou crie um novo quiz com suas próprias perguntas

3. **Publique o Quiz**
   - Clique em "Gerenciar Lobby" no quiz
   - Copie o link ou mostre o QR Code

4. **Simule Múltiplos Participantes**
   - Abra **5+ abas anônimas** ou navegadores diferentes
   - Em cada aba, acesse o link do quiz
   - Use nicknames diferentes: "João", "Maria", "Pedro", etc.
   - Observe o lobby do admin se atualizando em tempo real

5. **Inicie o Quiz**
   - No painel do admin, clique "Iniciar Quiz"
   - Responda as perguntas em cada aba de participante
   - Observe o timer sincronizado
   - Veja o ranking se atualizando após cada pergunta

6. **Resultados Finais**
   - Ao final, todos serão redirecionados para a tela de resultados
   - Veja o pódio com 1°, 2° e 3° lugares
   - Ranking completo ordenado por pontuação

### Testes Específicos

#### Teste de Reconexão
1. Durante o quiz, feche uma aba de participante
2. Reabra o link com o mesmo nickname
3. Verifique se reconecta automaticamente

#### Teste de Kick
1. No lobby admin, remova um participante
2. Verifique se ele é desconectado e redirecionado

#### Teste de Timer
1. Não responda uma pergunta
2. Observe o timer chegando a zero
3. Verifique se avança automaticamente

## 📁 Estrutura do Projeto

```
quiz-realtime/
├── server/                 # Backend Node.js
│   ├── routes/            # Rotas da API REST
│   │   ├── auth.js        # Autenticação admin
│   │   ├── quiz.js        # CRUD de quizzes
│   │   └── lobby.js       # Dados do lobby
│   ├── socket/            # Lógica WebSocket
│   │   └── socketHandler.js
│   ├── database/          # Banco de dados
│   │   └── init.js        # Schema e conexão
│   ├── middleware/        # Middlewares
│   │   └── auth.js        # JWT authentication
│   ├── scripts/           # Scripts utilitários
│   │   ├── migrate.js     # Migrações
│   │   └── seed.js        # Dados iniciais
│   └── index.js           # Servidor principal
├── client/                # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # Context API (Auth, Socket)
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── package.json           # Dependências do backend
└── README.md
```

## 🌐 API REST

### Autenticação
```
POST /api/admin/register    # Criar conta admin
POST /api/admin/login       # Login admin
GET  /api/admin/profile     # Dados do admin (auth)
```

### Quizzes
```
GET  /api/quiz/admin/quizzes     # Listar quizzes (auth)
POST /api/quiz/admin/quizzes     # Criar quiz (auth)
GET  /api/quiz/:quizId           # Dados do quiz (público)
POST /api/quiz/:quizId/publish   # Publicar quiz (auth)
```

### Lobby
```
GET /api/lobby/:lobbyId                # Info básica do lobby
GET /api/lobby/:lobbyId/participants   # Lista participantes (auth)
GET /api/lobby/:lobbyId/quiz           # Dados do quiz (auth)
```

## 🔌 Eventos WebSocket

### Do Participante → Servidor
```javascript
join_lobby { lobbyId, nickname }
submit_answer { lobbyId, questionId, optionId }
```

### Do Admin → Servidor
```javascript
admin_auth { token, lobbyId }
start_quiz { lobbyId }
kick_participant { lobbyId, participantId }
```

### Do Servidor → Todos
```javascript
lobby_update { participants: [...] }
start_allowed { allowed: boolean, count: number }
question_start { questionId, text, options, timeLimitSeconds, startedAt }
question_end { questionId, correctOptionId, correctParticipants: [...] }
score_update { ranking: [...] }
final_results { ranking: [...] }
```

## 📊 Banco de Dados

### Modelos Principais
- **admins**: Administradores do sistema
- **quizzes**: Quizzes criados
- **questions**: Perguntas dos quizzes
- **lobbies**: Sessões de jogo
- **participants**: Participantes dos lobbies
- **answers**: Respostas dos participantes

## 🔐 Segurança

- JWT com expiração de 24h
- Senhas hasheadas com bcrypt (salt 12)
- Rate limiting (100 req/15min por IP)
- Helmet para headers de segurança
- CORS configurado
- Validação de dados com Joi

## 🚀 Deploy

### Variáveis de Ambiente (Produção)
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=sua-chave-jwt-super-secreta
CLIENT_URL=https://seudominio.com
```

### Considerações para Produção
- Use PostgreSQL em vez de SQLite
- Configure HTTPS
- Use Redis para sessões Socket.IO (clustering)
- Configure logs estruturados
- Use PM2 ou Docker para deploy
- Configure backup automático do banco

### Exemplo Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN cd client && npm ci && npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Problemas Comuns

**WebSocket não conecta**
- Verifique se as portas estão liberadas
- Confirme as URLs no arquivo .env
- Teste com diferentes navegadores

**Timer dessincronizado**
- Verifique o horário do sistema
- Confirme se o servidor está rodando corretamente

**Participantes não aparecem**
- Verifique conexão WebSocket
- Confirme se o lobby está no status 'waiting'

**Build falha**
- Limpe node_modules: `rm -rf node_modules client/node_modules`
- Reinstale: `npm run setup`

### Logs Úteis
```bash
# Ver logs do servidor
npm run server:dev

# Ver logs do cliente
npm run client:dev
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎯 Roadmap

- [ ] Exportar resultados para CSV/PDF
- [ ] Categorias de quiz
- [ ] Quiz com imagens
- [ ] Modo torneio
- [ ] Estatísticas avançadas
- [ ] Temas personalizáveis
- [ ] API pública
- [ ] Integração com redes sociais

## 💡 Créditos

Desenvolvido como sistema completo de quiz em tempo real, seguindo as melhores práticas de desenvolvimento full-stack moderno.

---

**🎉 Divirta-se criando seus quizzes interativos!**
