# 🚀 Guia de Deploy

## Deploy com Docker

### 1. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json files
COPY package*.json ./
COPY client/package*.json ./client/

# Instalar dependências
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Copiar código fonte
COPY . .

# Build do frontend
RUN cd client && npm run build

# Criar diretório de dados
RUN mkdir -p server/data

# Executar migrações
RUN npm run migrate

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]
```

### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  quiz-app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=sua-chave-jwt-super-secreta
      - CLIENT_URL=https://seudominio.com
    volumes:
      - ./data:/app/server/data
    restart: unless-stopped

  # Opcional: usar PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=quiz
      - POSTGRES_USER=quiz_user
      - POSTGRES_PASSWORD=senha_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Deploy na Vercel (Frontend)

### 1. Configurar build
```json
{
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### 2. Variáveis de ambiente
```bash
VITE_API_URL=https://seu-backend.herokuapp.com
```

## Deploy no Heroku (Backend)

### 1. Procfile
```
web: npm start
release: npm run migrate && npm run seed
```

### 2. Configurações
```bash
# Instalar Heroku CLI e fazer login
heroku create seu-app-quiz

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=sua-chave-jwt-super-secreta
heroku config:set CLIENT_URL=https://seu-frontend.vercel.app

# Deploy
git push heroku main
```

## Deploy no Railway

### 1. railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Deploy com PM2

### 1. ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'quiz-app',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      JWT_SECRET: 'sua-chave-jwt-super-secreta'
    }
  }]
}
```

### 2. Deploy
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save
pm2 startup
```

## Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name seudominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Servir arquivos estáticos
    location / {
        try_files $uri $uri/ @backend;
    }

    # Proxy para API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket para Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fallback para SPA
    location @backend {
        proxy_pass http://localhost:3001;
    }
}
```

## Checklist de Deploy

### Antes do Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Testar build de produção localmente
- [ ] Configurar banco de dados de produção
- [ ] Configurar certificado SSL
- [ ] Testar WebSocket em produção

### Pós Deploy
- [ ] Verificar health check endpoint
- [ ] Testar fluxo completo (admin + participantes)
- [ ] Configurar monitoramento
- [ ] Configurar backup do banco
- [ ] Testar performance com múltiplos usuários

### Monitoramento
```javascript
// Adicionar ao server/index.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

## Otimizações para Produção

### 1. Compressão
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Cache de assets
```javascript
app.use(express.static('client/dist', {
  maxAge: '1y',
  etag: false
}));
```

### 3. Rate limiting avançado
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

app.use('/api/', apiLimiter);
```

### 4. Clustering Socket.IO
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```
