const bcrypt = require('bcrypt');
const { createConnection, runQuery, getQuery } = require('../database/init');

async function seed() {
  console.log('🌱 Executando seeds do banco de dados...');
  
  const db = createConnection();
  
  try {
    // Verificar se já existe um admin
    const existingAdmin = await getQuery(db, 'SELECT id FROM admins LIMIT 1');
    
    if (existingAdmin) {
      console.log('ℹ️ Dados de seed já existem, pulando...');
      db.close();
      return;
    }

    // Criar admin de teste
    const passwordHash = await bcrypt.hash('123456', 12);
    const adminResult = await runQuery(db, 
      'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
      ['Admin Teste', 'admin@teste.com', passwordHash]
    );

    console.log('✅ Admin criado:', {
      id: adminResult.id,
      email: 'admin@teste.com',
      password: '123456'
    });

    // Criar quiz de exemplo
    const quizResult = await runQuery(db, 
      'INSERT INTO quizzes (admin_id, title, description, published) VALUES (?, ?, ?, ?)',
      [adminResult.id, 'Quiz Exemplo - Geografia do Brasil', 'Um quiz rápido sobre geografia brasileira', true]
    );

    console.log('✅ Quiz criado:', {
      id: quizResult.id,
      title: 'Quiz Exemplo - Geografia do Brasil'
    });

    // Criar perguntas de exemplo
    const questions = [
      {
        text: 'Qual é a capital do Brasil?',
        options: [
          { id: 'A', text: 'São Paulo' },
          { id: 'B', text: 'Brasília' },
          { id: 'C', text: 'Rio de Janeiro' },
          { id: 'D', text: 'Salvador' }
        ],
        correctOptionId: 'B',
        timeLimitSeconds: 30
      },
      {
        text: 'Qual é o maior estado do Brasil em área?',
        options: [
          { id: 'A', text: 'Minas Gerais' },
          { id: 'B', text: 'Bahia' },
          { id: 'C', text: 'Amazonas' },
          { id: 'D', text: 'Pará' }
        ],
        correctOptionId: 'C',
        timeLimitSeconds: 30
      },
      {
        text: 'Quantos estados tem o Brasil?',
        options: [
          { id: 'A', text: '25' },
          { id: 'B', text: '26' },
          { id: 'C', text: '27' },
          { id: 'D', text: '28' }
        ],
        correctOptionId: 'C',
        timeLimitSeconds: 15
      },
      {
        text: 'Qual rio passa pela cidade de São Paulo?',
        options: [
          { id: 'A', text: 'Rio Tietê' },
          { id: 'B', text: 'Rio Amazonas' },
          { id: 'C', text: 'Rio São Francisco' },
          { id: 'D', text: 'Rio Paraná' }
        ],
        correctOptionId: 'A',
        timeLimitSeconds: 45
      },
      {
        text: 'Qual é a região mais populosa do Brasil?',
        options: [
          { id: 'A', text: 'Norte' },
          { id: 'B', text: 'Nordeste' },
          { id: 'C', text: 'Sudeste' },
          { id: 'D', text: 'Sul' }
        ],
        correctOptionId: 'C',
        timeLimitSeconds: 30
      }
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await runQuery(db, `
        INSERT INTO questions (quiz_id, text, options, correct_option_id, time_limit_seconds, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        quizResult.id,
        question.text,
        JSON.stringify(question.options),
        question.correctOptionId,
        question.timeLimitSeconds,
        i
      ]);
    }

    console.log(`✅ ${questions.length} perguntas criadas`);

    console.log('\n🎉 Seeds executados com sucesso!');
    console.log('\n📝 Dados de acesso:');
    console.log('   Email: admin@teste.com');
    console.log('   Senha: 123456');
    console.log('\n🚀 Inicie o servidor com: npm run dev');

  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
