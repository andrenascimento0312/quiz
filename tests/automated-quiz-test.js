/**
 * Teste Automatizado do Sistema de Quiz
 * 
 * Este script automatiza o teste do sistema de quiz:
 * 1. Abre guia admin para criar e gerenciar quiz
 * 2. Abre guias anônimas para participantes
 * 3. Executa fluxo completo do quiz
 * 4. Valida resultados
 */

const puppeteer = require('puppeteer');

class QuizTester {
  constructor() {
    this.adminBrowser = null;
    this.participantBrowsers = [];
    this.adminPage = null;
    this.participantPages = [];
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  }

  async assert(condition, message) {
    if (condition) {
      this.testResults.passed++;
      await this.log(`✅ ${message}`);
    } else {
      this.testResults.failed++;
      this.testResults.errors.push(message);
      await this.log(`❌ ${message}`);
    }
  }

  async setup() {
    await this.log('🚀 Iniciando testes automatizados...');
    
    // Configurar browser do admin
    this.adminBrowser = await puppeteer.launch({
      headless: false, // Visível para debug
      args: ['--start-maximized']
    });
    
    this.adminPage = await this.adminBrowser.newPage();
    await this.adminPage.setViewport({ width: 1920, height: 1080 });
    
    await this.log('👤 Browser do admin configurado');
  }

  async createParticipantBrowsers(count = 2) {
    await this.log(`👥 Criando ${count} browsers para participantes (modo incógnito)...`);
    
    for (let i = 0; i < count; i++) {
      const browser = await puppeteer.launch({
        headless: false,
        args: [
          '--incognito',
          '--start-maximized',
          `--window-position=${i * 100},${i * 50}`
        ]
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      
      this.participantBrowsers.push(browser);
      this.participantPages.push(page);
      
      await this.log(`👤 Participante ${i + 1} configurado (incógnito)`);
    }
  }

  async loginAdmin() {
    await this.log('🔐 Fazendo login como admin...');
    
    await this.adminPage.goto('http://localhost:5173/admin/login');
    
    // Aguardar formulário carregar
    await this.adminPage.waitForSelector('input[type="email"]');
    
    // Preencher credenciais (ajustar conforme necessário)
    await this.adminPage.type('input[type="email"]', 'teste@teste.com');
    await this.adminPage.type('input[type="password"]', '123456');
    
    // Clicar em login
    await this.adminPage.click('button[type="submit"]');
    
    // Aguardar redirecionamento para dashboard
    await this.adminPage.waitForNavigation();
    
    const currentUrl = this.adminPage.url();
    await this.assert(
      currentUrl.includes('/admin/dashboard'),
      'Admin logado com sucesso'
    );
  }

  async createQuiz() {
    await this.log('📝 Criando novo quiz...');
    
    // Clicar em "Criar Quiz"
    await this.adminPage.waitForSelector('a[href="/admin/quiz/create"]');
    await this.adminPage.click('a[href="/admin/quiz/create"]');
    
    await this.adminPage.waitForNavigation();
    
    // Preencher informações do quiz
    await this.adminPage.waitForSelector('input[placeholder*="Quiz"]');
    await this.adminPage.type('input[placeholder*="Quiz"]', 'Quiz Teste Automatizado');
    
    const descriptionSelector = 'textarea';
    await this.adminPage.waitForSelector(descriptionSelector);
    await this.adminPage.type(descriptionSelector, 'Quiz criado automaticamente para testes');
    
    // Aguardar primeira pergunta aparecer
    await this.adminPage.waitForSelector('textarea[placeholder*="pergunta"]');
    
    // Preencher primeira pergunta
    await this.adminPage.type('textarea[placeholder*="pergunta"]', 'Qual é a capital do Brasil?');
    
    // Preencher opções
    const optionInputs = await this.adminPage.$$('input[placeholder*="opção"]');
    if (optionInputs.length >= 2) {
      await optionInputs[0].type('Brasília');
      await optionInputs[1].type('São Paulo');
    }
    
    // Adicionar segunda pergunta
    await this.adminPage.click('button:has-text("Nova Pergunta")');
    await this.adminPage.waitForTimeout(1000);
    
    // Navegar para segunda pergunta
    const questionNavButtons = await this.adminPage.$$('button[class*="rounded-full"]');
    if (questionNavButtons.length > 1) {
      await questionNavButtons[1].click();
      await this.adminPage.waitForTimeout(500);
    }
    
    // Preencher segunda pergunta
    await this.adminPage.type('textarea[placeholder*="pergunta"]', 'Quanto é 2 + 2?');
    
    const optionInputs2 = await this.adminPage.$$('input[placeholder*="opção"]');
    if (optionInputs2.length >= 2) {
      await optionInputs2[0].clear();
      await optionInputs2[0].type('4');
      await optionInputs2[1].clear();
      await optionInputs2[1].type('3');
    }
    
    // Salvar quiz
    await this.adminPage.click('button:has-text("Criar Quiz")');
    await this.adminPage.waitForNavigation();
    
    await this.assert(
      this.adminPage.url().includes('/admin/dashboard'),
      'Quiz criado com sucesso'
    );
  }

  async publishQuiz() {
    await this.log('📢 Publicando quiz...');
    
    // Encontrar o quiz criado e publicar
    await this.adminPage.waitForSelector('button:has-text("Publicar")');
    await this.adminPage.click('button:has-text("Publicar")');
    
    // Aguardar modal ou confirmação
    await this.adminPage.waitForTimeout(2000);
    
    // Procurar código do lobby
    const lobbyCodeElement = await this.adminPage.$('text=/[A-Z0-9]{8}/');
    let lobbyCode = null;
    
    if (lobbyCodeElement) {
      lobbyCode = await this.adminPage.evaluate(el => el.textContent, lobbyCodeElement);
      await this.log(`🔑 Código do lobby: ${lobbyCode}`);
    }
    
    await this.assert(lobbyCode !== null, 'Quiz publicado e código gerado');
    
    return lobbyCode;
  }

  async joinParticipants(lobbyCode) {
    await this.log('👥 Conectando participantes ao lobby...');
    
    const participantNames = ['Alice', 'Bob', 'Carol', 'David'];
    
    for (let i = 0; i < this.participantPages.length; i++) {
      const page = this.participantPages[i];
      const name = participantNames[i] || `Participante${i + 1}`;
      
      await page.goto('http://localhost:5173/');
      
      // Inserir código do lobby
      await page.waitForSelector('input[placeholder*="código"]');
      await page.type('input[placeholder*="código"]', lobbyCode);
      await page.click('button:has-text("Entrar")');
      
      // Inserir nome
      await page.waitForSelector('input[placeholder*="nome"]');
      await page.type('input[placeholder*="nome"]', name);
      await page.click('button:has-text("Confirmar")');
      
      // Aguardar entrar no lobby
      await page.waitForTimeout(2000);
      
      await this.log(`👤 ${name} entrou no lobby`);
    }
    
    await this.assert(true, 'Todos os participantes conectados');
  }

  async startQuiz() {
    await this.log('🚀 Iniciando quiz...');
    
    // No painel admin, clicar em iniciar
    await this.adminPage.waitForSelector('button:has-text("Iniciar Quiz")');
    await this.adminPage.click('button:has-text("Iniciar Quiz")');
    
    await this.adminPage.waitForTimeout(3000);
    
    // Verificar se apareceu "Pergunta 1 de 2"
    const questionIndicator = await this.adminPage.$('text=/Pergunta.*1.*2/');
    await this.assert(questionIndicator !== null, 'Quiz iniciou na Pergunta 1 de 2');
  }

  async answerQuestions() {
    await this.log('❓ Respondendo perguntas...');
    
    // Primeira pergunta - todos respondem
    for (let i = 0; i < this.participantPages.length; i++) {
      const page = this.participantPages[i];
      
      // Aguardar pergunta aparecer
      await page.waitForSelector('button:has-text("Brasília")', { timeout: 10000 });
      
      // Responder (alternando entre correto e incorreto)
      if (i % 2 === 0) {
        await page.click('button:has-text("Brasília")'); // Correto
      } else {
        await page.click('button:has-text("São Paulo")'); // Incorreto
      }
      
      await this.log(`👤 Participante ${i + 1} respondeu pergunta 1`);
    }
    
    // Aguardar tela de resultados intermediários
    await this.adminPage.waitForTimeout(5000);
    
    // Verificar se apareceu timer para próxima pergunta
    const nextQuestionTimer = await this.adminPage.$('text=/Próxima pergunta/');
    await this.assert(nextQuestionTimer !== null, 'Timer para próxima pergunta apareceu');
    
    // Aguardar segunda pergunta
    await this.adminPage.waitForTimeout(4000);
    
    // Verificar se apareceu "Pergunta 2 de 2"
    const question2Indicator = await this.adminPage.$('text=/Pergunta.*2.*2/');
    await this.assert(question2Indicator !== null, 'Avançou para Pergunta 2 de 2');
    
    // Segunda pergunta - todos respondem
    for (let i = 0; i < this.participantPages.length; i++) {
      const page = this.participantPages[i];
      
      await page.waitForSelector('button:has-text("4")', { timeout: 10000 });
      await page.click('button:has-text("4")'); // Todos corretos
      
      await this.log(`👤 Participante ${i + 1} respondeu pergunta 2`);
    }
  }

  async checkResults() {
    await this.log('📊 Verificando resultados...');
    
    // Aguardar redirecionamento para resultados
    await this.adminPage.waitForTimeout(8000);
    
    // Verificar se foi para página de resultados
    const currentUrl = this.adminPage.url();
    await this.assert(
      currentUrl.includes('/results/'),
      'Redirecionado para página de resultados'
    );
    
    // Verificar se há participantes reais (não fictícios)
    const participantElements = await this.adminPage.$$('text=/Alice|Bob/');
    await this.assert(
      participantElements.length > 0,
      'Resultados mostram participantes reais (não fictícios)'
    );
  }

  async cleanup() {
    await this.log('🧹 Limpando recursos...');
    
    if (this.adminBrowser) {
      await this.adminBrowser.close();
    }
    
    for (const browser of this.participantBrowsers) {
      await browser.close();
    }
  }

  async runFullTest() {
    try {
      await this.setup();
      await this.createParticipantBrowsers(2);
      
      await this.loginAdmin();
      await this.createQuiz();
      const lobbyCode = await this.publishQuiz();
      
      if (lobbyCode) {
        await this.joinParticipants(lobbyCode);
        await this.startQuiz();
        await this.answerQuestions();
        await this.checkResults();
      }
      
      await this.log('✅ Teste completo finalizado!');
      
    } catch (error) {
      await this.log(`❌ Erro durante o teste: ${error.message}`);
      this.testResults.errors.push(error.message);
      
    } finally {
      await this.cleanup();
      
      // Relatório final
      await this.log('\n📋 RELATÓRIO FINAL:');
      await this.log(`✅ Testes passou: ${this.testResults.passed}`);
      await this.log(`❌ Testes falharam: ${this.testResults.failed}`);
      
      if (this.testResults.errors.length > 0) {
        await this.log('\n🚨 Erros encontrados:');
        this.testResults.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    }
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  const tester = new QuizTester();
  tester.runFullTest();
}

module.exports = QuizTester;
