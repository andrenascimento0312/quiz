# 🧪 Testes Automatizados - Quiz Realtime

## 📋 Visão Geral

Este diretório contém testes automatizados end-to-end para o sistema de Quiz em Tempo Real usando Puppeteer.

## 🚀 Como Executar

### Pré-requisitos

1. **Servidor rodando**: Certifique-se de que o sistema está rodando:
   ```bash
   cd ..
   npm run dev
   ```

2. **Instalar dependências dos testes**:
   ```bash
   cd tests
   npm install
   ```

### Executar Testes

```bash
# Executar teste completo
npm test

# Ou diretamente
node automated-quiz-test.js
```

## 🎯 O que o Teste Faz

### Fluxo Completo Testado

1. **Setup**: Configura browsers (admin + participantes incógnitos)
2. **Login Admin**: Faz login como administrador
3. **Criar Quiz**: Cria quiz com 2 perguntas automaticamente
4. **Publicar Quiz**: Publica quiz e obtém código do lobby
5. **Conectar Participantes**: Abre 2 guias incógnitas e conecta participantes
6. **Iniciar Quiz**: Admin inicia o quiz
7. **Responder Perguntas**: Participantes respondem as 2 perguntas
8. **Verificar Resultados**: Valida se resultados são reais (não fictícios)

### Validações Realizadas

- ✅ Login de admin funcional
- ✅ Criação de quiz bem-sucedida
- ✅ Publicação e geração de código do lobby
- ✅ Conexão de participantes em guias incógnitas
- ✅ Quiz inicia na **Pergunta 1 de 2** (não pula)
- ✅ Timer para próxima pergunta aparece
- ✅ Avança corretamente para **Pergunta 2 de 2**
- ✅ Resultados finais mostram participantes reais
- ✅ Redirecionamento para página de resultados

## 🔧 Configuração

### Credenciais de Teste

O teste usa as credenciais padrão:
- **Email**: `teste@teste.com`
- **Senha**: `123456`

### Participantes de Teste

- Alice (responde alternadamente correto/incorreto)
- Bob (responde alternadamente incorreto/correto)

### URLs Testadas

- **Admin Login**: `http://localhost:5173/admin/login`
- **Participantes**: `http://localhost:5173/`

## 📊 Relatório de Testes

O teste gera um relatório completo mostrando:

```
✅ Testes passou: X
❌ Testes falharam: Y
🚨 Erros encontrados: [lista de erros]
```

## 🐛 Debug

### Modo Visual

Os testes rodam com `headless: false`, permitindo ver:
- Janela do admin (maximizada)
- Janelas dos participantes (incógnitas, posicionadas)

### Logs Detalhados

O teste produz logs timestampados:
```
[14:30:25] 🚀 Iniciando testes automatizados...
[14:30:26] 👤 Browser do admin configurado
[14:30:27] 👥 Criando 2 browsers para participantes (modo incógnito)...
```

## 🔄 Cenários Testados

### Fluxo Principal
- [x] Login admin
- [x] Criação de quiz (2 perguntas)
- [x] Publicação de quiz
- [x] Entrada de participantes
- [x] Início do quiz
- [x] Resposta às perguntas
- [x] Visualização de resultados

### Validações Específicas
- [x] **Pergunta 1 primeiro**: Não pula para pergunta 2
- [x] **Timer intermediário**: 3 segundos entre perguntas
- [x] **Resultados reais**: Não mostra dados fictícios
- [x] **Guias incógnitas**: Participantes em sessões isoladas
- [x] **Fluxo completo**: Do login aos resultados

## 📝 Personalização

### Alterar Número de Participantes

```javascript
await this.createParticipantBrowsers(3); // Para 3 participantes
```

### Alterar Perguntas do Quiz

Edite as seções `createQuiz()` e `answerQuestions()` no arquivo `automated-quiz-test.js`.

### Alterar Credenciais

Modifique a função `loginAdmin()`:

```javascript
await this.adminPage.type('input[type="email"]', 'seu@email.com');
await this.adminPage.type('input[type="password"]', 'suasenha');
```

## 🚨 Solução de Problemas

### Erro: "Element not found"
- Verifique se o servidor está rodando
- Confirme que as URLs estão corretas
- Aguarde elementos carregarem (timeouts)

### Erro: "Login failed"
- Verifique credenciais no banco de dados
- Confirme se admin tem status 'approved'

### Erro: "Quiz creation failed"
- Verifique se formulário de quiz carregou
- Confirme seletores CSS ainda válidos

## 📋 TODO

- [ ] Testes de múltiplos quizzes simultâneos
- [ ] Testes de reconexão automática
- [ ] Testes de performance com muitos participantes
- [ ] Integração com CI/CD
- [ ] Screenshots automáticos em caso de falha

---

**Versão**: 1.0.0  
**Compatível com**: Quiz Realtime v1.2.0
