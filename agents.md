# Agentes do Sistema - Quiz Realtime

## 📋 Visão Geral

Este documento descreve os diferentes tipos de agentes (atores) que interagem com o sistema de Quiz em Tempo Real, suas responsabilidades, permissões e fluxos de trabalho.

## 👥 Tipos de Agentes

### 1. Super Administrador (SuperAdmin)

#### Características
- **Papel**: `superadmin`
- **Acesso**: Máximo nível de privilégios
- **Quantidade**: Limitado (geralmente 1)

#### Responsabilidades
- Gerenciar administradores do sistema
- Criar, editar e remover contas de administradores
- Monitorar uso geral da plataforma
- Configurações globais do sistema
- Acesso a relatórios e analytics

#### Funcionalidades
- ✅ Criar/editar/remover administradores
- ✅ Visualizar todos os quizzes do sistema
- ✅ Acessar dashboard de super administrador
- ✅ Gerenciar configurações globais
- ✅ Visualizar estatísticas de uso
- ❌ Criar quizzes diretamente
- ❌ Moderar lobbies específicos

#### Fluxos Principais
1. **Login**: Acesso via credenciais especiais
2. **Gestão de Admins**: Criar novos administradores
3. **Monitoramento**: Visualizar atividades do sistema

### 2. Administrador (Admin)

#### Características
- **Papel**: `admin`
- **Acesso**: Criação e gerenciamento de quizzes
- **Quantidade**: Múltiplos (criados pelo SuperAdmin)

#### Responsabilidades
- Criar e gerenciar seus próprios quizzes
- Configurar perguntas e respostas
- Moderar lobbies e sessões de quiz
- Acompanhar resultados em tempo real
- Gerenciar participantes durante o quiz

#### Funcionalidades
- ✅ Criar/editar/excluir quizzes próprios
- ✅ Publicar quizzes e criar lobbies
- ✅ Moderar sessões de quiz
- ✅ Visualizar resultados em tempo real
- ✅ Controlar fluxo do jogo (iniciar, pausar, finalizar)
- ✅ Remover participantes se necessário
- ❌ Gerenciar outros administradores
- ❌ Acessar quizzes de outros admins

#### Estados do Administrador
```
Logado → Dashboard → [Criar Quiz | Gerenciar Quizzes]
                  ↓
              Quiz Criado → Publicar → Lobby Ativo → Jogo Ativo → Resultados
```

#### Fluxos Principais

**1. Criação de Quiz**
```
Login → Dashboard → Novo Quiz → Quiz Builder → Salvar
```

**2. Condução de Quiz**
```
Dashboard → Publicar Quiz → Lobby → Aguardar Participantes → Iniciar → Moderar → Finalizar
```

**3. Análise de Resultados**
```
Quiz Finalizado → Visualizar Resultados → Exportar (futuro)
```

### 3. Participante (Participant)

#### Características
- **Papel**: `participant`
- **Acesso**: Participação em quizzes
- **Autenticação**: Não requer conta (nome + código do lobby)

#### Responsabilidades
- Entrar em lobbies usando código
- Responder perguntas dentro do tempo limite
- Visualizar seu desempenho
- Seguir regras do quiz

#### Funcionalidades
- ✅ Entrar em lobby com código
- ✅ Visualizar perguntas e opções
- ✅ Enviar respostas dentro do tempo
- ✅ Ver pontuação própria em tempo real
- ✅ Visualizar ranking durante o jogo
- ✅ Ver resultados finais
- ❌ Criar ou modificar quizzes
- ❌ Moderar outros participantes

#### Estados do Participante
```
Entrada → Lobby → Aguardando → Jogo → [Pergunta → Resposta] → Resultados
```

#### Fluxos Principais

**1. Entrada no Quiz**
```
Página Inicial → Inserir Código → Inserir Nome → Lobby → Reconexão Automática
```

**2. Participação no Quiz**
```
Lobby → Aguardar Início (2+ participantes) → Pergunta → Responder → Próxima Pergunta → Resultado Final
```

**3. Reconexão**
```
Desconexão → Tentativa Automática → Restaurar Estado → Continuar Participação
```

## 🔐 Sistema de Permissões

### Hierarquia de Acesso
```
SuperAdmin (Nível 3)
    ↓
Admin (Nível 2)
    ↓
Participant (Nível 1)
```

### Matriz de Permissões

| Funcionalidade | SuperAdmin | Admin | Participant |
|---------------|------------|--------|-------------|
| Criar Admins | ✅ | ❌ | ❌ |
| Criar Quizzes | ❌ | ✅ | ❌ |
| Editar Quizzes | ❌ | ✅ (próprios) | ❌ |
| Publicar Quizzes | ❌ | ✅ | ❌ |
| Moderar Lobbies | ❌ | ✅ (próprios) | ❌ |
| Participar Quizzes | ❌ | ❌ | ✅ |
| Ver Todos Quizzes | ✅ | ❌ | ❌ |
| Dashboard Global | ✅ | ❌ | ❌ |
| Iniciar Quiz (2+ pessoas) | ❌ | ✅ | ❌ |
| Reconexão Automática | ❌ | ✅ | ✅ |
| Debug/Monitoring | ✅ | ✅ (próprios lobbies) | ❌ |

## 🔄 Interações Entre Agentes

### SuperAdmin ↔ Admin
- SuperAdmin cria contas de Admin
- Admin reporta estatísticas para SuperAdmin
- SuperAdmin pode desativar Admins

### Admin ↔ Participant
- Admin cria quizzes para Participants
- Participants se conectam aos lobbies do Admin
- Admin modera comportamento dos Participants
- Participants fornecem feedback via respostas

### Comunicação em Tempo Real

#### Socket.IO Namespaces
```javascript
// Namespace para administradores
/admin
- join-admin-room
- lobby-update
- participant-joined
- quiz-control

// Namespace para participantes  
/participant
- join-lobby
- answer-submitted
- question-update
- quiz-end
```

## 📊 Dados e Contexto por Agente

### SuperAdmin Context
```javascript
{
  id: string,
  role: 'superadmin',
  name: string,
  email: string,
  permissions: ['manage_admins', 'view_all_data'],
  lastLogin: Date
}
```

### Admin Context
```javascript
{
  id: string,
  role: 'admin',
  name: string,
  email: string,
  quizzes: Quiz[],
  activeLobbies: Lobby[],
  permissions: ['create_quiz', 'manage_own_lobbies'],
  createdAt: Date
}
```

### Participant Context
```javascript
{
  id: string, // session-based
  name: string,
  lobbyId: string,
  score: number,
  answers: Answer[],
  joinedAt: Date,
  isActive: boolean
}
```

## 🎯 Casos de Uso por Agente

### SuperAdmin
1. **Onboarding de Novo Admin**
   - Criar conta de administrador
   - Definir credenciais iniciais
   - Enviar informações de acesso

2. **Monitoramento do Sistema**
   - Visualizar métricas de uso
   - Identificar problemas de performance
   - Analisar padrões de uso

### Admin
1. **Preparação de Quiz**
   - Criar quiz com múltiplas perguntas
   - Definir tempos limite
   - Configurar opções de resposta

2. **Condução de Sessão**
   - Publicar quiz e gerar código
   - Aguardar participantes no lobby
   - Iniciar quiz quando apropriado
   - Moderar durante o jogo

3. **Pós-Quiz**
   - Analisar resultados
   - Identificar perguntas problemáticas
   - Planejar melhorias

### Participant
1. **Entrada no Jogo**
   - Receber código do quiz
   - Entrar no lobby
   - Aguardar início

2. **Participação Ativa**
   - Ler perguntas rapidamente
   - Selecionar respostas
   - Acompanhar pontuação

3. **Visualização de Resultados**
   - Ver pontuação final
   - Comparar com outros participantes
   - Receber feedback

## 🚨 Cenários de Exceção

### Desconexões
- **Admin desconecta**: Lobby pausado, participantes notificados
- **Participant desconecta**: Removido automaticamente, jogo continua
- **Reconexão**: Tentativa automática com estado preservado
- **Sincronização perdida**: Sistema de logs para debugging e reconexão automática

### Comportamento Inadequado
- **Spam de respostas**: Rate limiting por participante
- **Nomes inadequados**: Filtros e moderação do admin
- **Abandono massivo**: Notificação ao admin
- **Múltiplas conexões**: Controle de sessão por participante

### Falhas Técnicas
- **Banco indisponível**: Modo degradado com cache
- **Socket.IO falha**: Fallback para polling
- **Servidor sobrecarregado**: Queue de participantes
- **Lobby em memória perdido**: Reconstrução automática a partir do banco de dados
- **Porta ocupada**: Detecção automática e reinicialização

### Debug e Monitoramento
- **Logs detalhados**: Sistema de logging em tempo real para WebSocket
- **Estado inconsistente**: Verificação e correção automática entre banco e memória
- **Autenticação**: Logs de tentativas de autenticação e falhas

## 📈 Métricas por Agente

### SuperAdmin Metrics
- Número total de admins ativos
- Quizzes criados por período
- Participantes únicos
- Uptime do sistema

### Admin Metrics
- Quizzes criados/publicados
- Participantes por quiz
- Taxa de engajamento
- Tempo médio de sessão

### Participant Metrics
- Taxa de acerto por quiz
- Tempo médio de resposta
- Participação em múltiplos quizzes
- Feedback qualitativo

## 🔧 Melhorias Implementadas (v1.2.0)

### Correções de Bugs Críticos
- ✅ **Mínimo de participantes reduzido**: De 5 para 2 participantes
- ✅ **Sincronização WebSocket corrigida**: Participantes aparecem em tempo real no painel admin
- ✅ **Autenticação 403 corrigida**: Migração do banco de dados para campos role/status
- ✅ **Reconexão de participantes**: Participantes reconectam automaticamente ao lobby
- ✅ **Indexação de perguntas corrigida**: Quiz sempre inicia na pergunta 1, não pula para pergunta 2
- ✅ **Fluxo de múltiplas perguntas**: Sistema agora suporta corretamente quizzes com várias perguntas
- ✅ **Resultados reais**: Removidos dados fictícios, agora mostra participantes reais

### Funcionalidades de Quiz Avançadas
- ✅ **Finalização inteligente**: Quiz avança quando todos respondem (não espera tempo limite)
- ✅ **Tela intermediária**: Mostra quem acertou cada pergunta com timer de 3s
- ✅ **Timer visual**: Contagem regressiva animada para próxima pergunta
- ✅ **Resultados em tempo real**: Admin vê quem acertou imediatamente
- ✅ **Delay de segurança**: 2s para admin ver pergunta antes de avançar automaticamente

### Melhorias de Sistema
- ✅ **Logs detalhados**: Sistema de debugging para WebSocket, autenticação e fluxo de perguntas
- ✅ **Estado em memória**: Carregamento automático de participantes existentes do banco
- ✅ **Detecção de problemas**: Logs para identificar problemas de sincronização
- ✅ **Migração automática**: Scripts de migração para atualizações do banco
- ✅ **Validação aprimorada**: Schema permite campos `dbId` e `tempId` para edição de quizzes

### Segurança
- ✅ **Logs seguros**: Removidos logs que mostravam perguntas e respostas no console
- ✅ **Proteção contra vazamento**: Apenas informações não-sensíveis nos logs do servidor

### Interface do Usuário
- ✅ **Resultados personalizados**: Página de resultados com dados reais dos participantes
- ✅ **Feedback visual**: Indicadores claros de progresso e status
- ✅ **Responsividade**: Interface adaptada para diferentes dispositivos

### Configurações Atualizadas
- **Mínimo de participantes**: 2 (anteriormente 5)
- **Autenticação**: Status 'approved' obrigatório para admins
- **WebSocket**: Logs detalhados para debugging (sem informações sensíveis)
- **Banco de dados**: Campos role e status adicionados
- **Timer de avanço**: 3 segundos entre perguntas
- **Delay de segurança**: 2 segundos para admin visualizar

### Fluxo Atualizado do Quiz
1. **Lobby**: Aguarda 2+ participantes
2. **Pergunta 1**: Sempre inicia corretamente
3. **Respostas**: Avança quando todos respondem OU tempo esgota
4. **Resultados intermediários**: Mostra quem acertou + timer 3s
5. **Próxima pergunta**: Continua até finalizar todas
6. **Resultados finais**: Dados reais salvos no localStorage

---

## 🌐 Deploy em Produção

### URLs de Produção
- **Sistema Online**: https://quiz-ten-beta-25.vercel.app/
- **Backend API**: https://quiz-production-8b29.up.railway.app
- **Admin Dashboard**: https://quiz-ten-beta-25.vercel.app/admin/login

### Arquitetura de Deploy
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Socket.IO)
- **WebSocket**: Funcional em produção
- **Banco de Dados**: SQLite (Railway managed)
- **Autenticação**: JWT + bcrypt
- **CORS**: Configurado para produção

### Credenciais de Teste
- **Admin**: Configurado via variáveis de ambiente
- **Participantes**: Acesso livre via código do lobby

---

**Última atualização**: Setembro 2025  
**Versão**: 1.3.0 - Deploy em Produção  
**Status**: ✅ Sistema Online e Funcional
