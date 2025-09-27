const { createConnection, runQuery, getQuery, allQuery } = require('../database/init');
const { verifyToken } = require('../middleware/auth');

// Armazenar estado dos lobbies em memória
const lobbies = new Map(); // lobbyId -> { status, currentQuestion, participants, adminSocket, timer }

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Evento: Admin se autentica
    socket.on('admin_auth', async (data) => {
      try {
        console.log('📥 Dados recebidos para admin_auth:', data);
        const { token, lobbyId } = data;
        console.log(`🔐 Admin tentando autenticar no lobby: ${lobbyId}`);
        const admin = await verifyToken(token);
        
        if (!admin) {
          console.log('❌ Token inválido para admin');
          socket.emit('auth_error', { message: 'Token inválido' });
          return;
        }

        // Verificar se o lobby pertence ao admin
        const db = createConnection();
        const lobby = await getQuery(db, 
          'SELECT admin_id FROM lobbies WHERE lobby_id = ?',
          [lobbyId]
        );

        if (!lobby || lobby.admin_id !== admin.id) {
          db.close();
          socket.emit('auth_error', { message: 'Lobby não encontrado' });
          return;
        }

        // Associar socket ao admin
        socket.adminId = admin.id;
        socket.lobbyId = lobbyId;
        socket.isAdmin = true;
        socket.join(lobbyId);

        // Inicializar lobby em memória se não existir
        if (!lobbies.has(lobbyId)) {
          // Carregar participantes existentes do banco
          const existingParticipants = await allQuery(db, `
            SELECT id, nickname, socket_id, score, joined_at
            FROM participants 
            WHERE lobby_id = ?
          `, [lobbyId]);

          const participantsMap = new Map();
          existingParticipants.forEach(p => {
            participantsMap.set(p.id, {
              id: p.id,
              nickname: p.nickname,
              socketId: p.socket_id,
              score: p.score,
              joinedAt: new Date(p.joined_at)
            });
          });

          lobbies.set(lobbyId, {
            status: 'waiting',
            currentQuestion: 0,
            participants: participantsMap,
            adminSocket: socket.id,
            timer: null,
            quiz: null
          });
        } else {
          lobbies.get(lobbyId).adminSocket = socket.id;
        }

        db.close();

        console.log(`✅ Admin ${admin.name} autenticado no lobby ${lobbyId}`);
        socket.emit('admin_authenticated', { admin, lobbyId });
        
        // Enviar estado atual do lobby
        await sendLobbyUpdate(lobbyId);
        console.log(`📊 Estado do lobby enviado para admin`);
        
        // Se o quiz estiver em andamento, reenviar a pergunta atual
        const lobbyData = lobbies.get(lobbyId);
        if (lobbyData && lobbyData.status === 'running' && lobbyData.quiz) {
          const currentQuestionIndex = lobbyData.currentQuestion;
          const currentQuestion = lobbyData.quiz[currentQuestionIndex];
          
          if (currentQuestion) {
            console.log(`🔄 Quiz em andamento! Reenviando pergunta atual ${currentQuestionIndex + 1} para admin`);
            
            const questionData = {
              questionId: currentQuestion.id,
              text: currentQuestion.text,
              options: currentQuestion.options,
              timeLimitSeconds: currentQuestion.time_limit_seconds,
              startedAt: new Date().toISOString(), // Timestamp atual
              questionIndex: currentQuestionIndex + 1,
              totalQuestions: lobbyData.quiz.length
            };
            
            socket.emit('question_start', questionData);
            console.log(`📤 Pergunta atual reenviada para admin: ${currentQuestion.text.substring(0, 50)}...`);
          }
        }
        
      } catch (error) {
        console.error('Erro na autenticação admin:', error);
        socket.emit('auth_error', { message: 'Erro interno' });
      }
    });

    // Evento: Participante entra no lobby
    socket.on('join_lobby', async (data) => {
      try {
        const { lobbyId, nickname } = data;
        
        if (!lobbyId || !nickname) {
          socket.emit('join_error', { message: 'Lobby ID e nickname são obrigatórios' });
          return;
        }

        const db = createConnection();
        
        // Verificar se o lobby existe
        const lobby = await getQuery(db, 
          'SELECT status FROM lobbies WHERE lobby_id = ?',
          [lobbyId]
        );

        if (!lobby) {
          db.close();
          socket.emit('join_error', { message: 'Lobby não encontrado' });
          return;
        }

        if (lobby.status !== 'waiting') {
          db.close();
          socket.emit('join_error', { message: 'Quiz já iniciado ou finalizado' });
          return;
        }

        // Verificar se nickname já existe
        const existingParticipant = await getQuery(db,
          'SELECT id FROM participants WHERE lobby_id = ? AND nickname = ?',
          [lobbyId, nickname]
        );

        let participantId;

        if (existingParticipant) {
          // Participante reconectando
          participantId = existingParticipant.id;
          await runQuery(db,
            'UPDATE participants SET socket_id = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [socket.id, participantId]
          );
        } else {
          // Novo participante
          const result = await runQuery(db,
            'INSERT INTO participants (lobby_id, nickname, socket_id) VALUES (?, ?, ?)',
            [lobbyId, nickname, socket.id]
          );
          participantId = result.id;
        }

        db.close();

        // Associar socket ao participante
        socket.participantId = participantId;
        socket.lobbyId = lobbyId;
        socket.nickname = nickname;
        socket.isAdmin = false;
        socket.join(lobbyId);

        // Atualizar lobby em memória
        if (!lobbies.has(lobbyId)) {
          lobbies.set(lobbyId, {
            status: 'waiting',
            currentQuestion: 0,
            participants: new Map(),
            adminSocket: null,
            timer: null,
            quiz: null
          });
        }

        const lobbyData = lobbies.get(lobbyId);
        lobbyData.participants.set(participantId, {
          id: participantId,
          nickname,
          socketId: socket.id,
          score: 0,
          joinedAt: new Date()
        });

        console.log(`👤 Participante ${nickname} (ID: ${participantId}) entrou no lobby ${lobbyId}`);
        socket.emit('join_success', { participantId, nickname, lobbyId });
        
        // Notificar todos sobre atualização
        await sendLobbyUpdate(lobbyId);

      } catch (error) {
        console.error('Erro ao entrar no lobby:', error);
        socket.emit('join_error', { message: 'Erro interno' });
      }
    });

    // Evento: Admin inicia o quiz
    socket.on('start_quiz', async (data) => {
      try {
        const { lobbyId } = data;
        console.log(`🚀 Admin iniciando quiz no lobby: ${lobbyId}`);
        
        if (!socket.isAdmin || socket.lobbyId !== lobbyId) {
          console.log('❌ Acesso negado para iniciar quiz');
          socket.emit('error', { message: 'Acesso negado' });
          return;
        }

        const lobbyData = lobbies.get(lobbyId);
        if (!lobbyData) {
          console.log('❌ Lobby não encontrado em memória');
          socket.emit('error', { message: 'Lobby não encontrado' });
          return;
        }

        console.log(`👥 Participantes no lobby: ${lobbyData.participants.size}`);
        
        // Verificar se tem pelo menos 2 participantes
        if (lobbyData.participants.size < 2) {
          console.log('❌ Participantes insuficientes');
          socket.emit('error', { message: 'Mínimo de 2 participantes necessário' });
          return;
        }

        // Carregar quiz do banco
        const db = createConnection();
        const lobby = await getQuery(db, 'SELECT quiz_id FROM lobbies WHERE lobby_id = ?', [lobbyId]);
        
        if (!lobby) {
          console.log('❌ Lobby não encontrado no banco de dados');
          db.close();
          socket.emit('error', { message: 'Lobby não encontrado no banco' });
          return;
        }
        
        console.log(`📋 Carregando quiz ID: ${lobby.quiz_id}`);
        
        const questions = await allQuery(db, `
          SELECT id, text, options, correct_option_id, time_limit_seconds, order_index
          FROM questions 
          WHERE quiz_id = ? 
          ORDER BY order_index
        `, [lobby.quiz_id]);

        console.log(`❓ Quiz carregado com ${questions.length} pergunta(s)`);
        
        if (questions.length === 0) {
          console.log('❌ Nenhuma pergunta encontrada para este quiz');
          db.close();
          socket.emit('error', { message: 'Quiz não possui perguntas' });
          return;
        }

        // Marcar lobby como iniciado
        await runQuery(db, 
          'UPDATE lobbies SET status = "running", started_at = CURRENT_TIMESTAMP WHERE lobby_id = ?',
          [lobbyId]
        );

        db.close();

        // Atualizar estado do lobby
        lobbyData.status = 'running';
        lobbyData.currentQuestion = 0;
        lobbyData.quiz = questions.map(q => ({
          ...q,
          options: JSON.parse(q.options)
        }));

        console.log(`🎯 Iniciando quiz com ${questions.length} pergunta(s)`);
        console.log(`🔢 currentQuestion inicializado como: ${lobbyData.currentQuestion}`);
        console.log(`📋 Quiz carregado:`, lobbyData.quiz.map((q, i) => `${i}: ${q.text.substring(0, 50)}...`));
        
        // Iniciar primeira pergunta (SEMPRE índice 0)
        console.log(`🎯 FORÇANDO início da pergunta 0 (primeira pergunta)`);
        // lobbyData.currentQuestion já é 0, então está sincronizado
        await startQuestion(lobbyId, lobbyData.currentQuestion);

      } catch (error) {
        console.error('Erro ao iniciar quiz:', error);
        socket.emit('error', { message: 'Erro interno' });
      }
    });

    // Evento: Participante submete resposta
    socket.on('submit_answer', async (data) => {
      try {
        const { lobbyId, questionId, optionId } = data;
        
        if (!socket.participantId || socket.lobbyId !== lobbyId) {
          socket.emit('error', { message: 'Acesso negado' });
          return;
        }

        const lobbyData = lobbies.get(lobbyId);
        if (!lobbyData || lobbyData.status !== 'running') {
          socket.emit('error', { message: 'Quiz não está em andamento' });
          return;
        }

        // Verificar se é a pergunta atual
        const currentQuestion = lobbyData.quiz[lobbyData.currentQuestion];
        if (currentQuestion.id !== questionId) {
          socket.emit('error', { message: 'Pergunta inválida' });
          return;
        }

        // Salvar resposta no banco
        const db = createConnection();
        const correct = currentQuestion.correct_option_id === optionId;
        
        await runQuery(db, `
          INSERT OR REPLACE INTO answers 
          (lobby_id, question_id, participant_id, option_id, correct)
          VALUES (?, ?, ?, ?, ?)
        `, [lobbyId, questionId, socket.participantId, optionId, correct]);

        // Atualizar score se correto
        if (correct) {
          await runQuery(db,
            'UPDATE participants SET score = score + 1 WHERE id = ?',
            [socket.participantId]
          );
          
          // Atualizar score em memória
          const participant = lobbyData.participants.get(socket.participantId);
          if (participant) {
            participant.score += 1;
          }
        }

        db.close();

        socket.emit('answer_submitted', { correct, optionId });

        // Verificar se todos os participantes responderam
        const totalParticipants = lobbyData.participants.size;
        const answersQuery = await allQuery(createConnection(), `
          SELECT COUNT(DISTINCT participant_id) as answered_count 
          FROM answers 
          WHERE lobby_id = ? AND question_id = ?
        `, [lobbyId, questionId]);
        
        const answeredCount = answersQuery[0]?.answered_count || 0;
        
        console.log(`📊 Respostas: ${answeredCount}/${totalParticipants} participantes`);
        
        if (answeredCount >= totalParticipants) {
          console.log(`✅ Todos responderam! Finalizando pergunta IMEDIATAMENTE`);
          console.log(`🔢 Pergunta atual que está sendo finalizada: ${lobbyData.currentQuestion} (${lobbyData.currentQuestion + 1}/${lobbyData.quiz.length})`);
          // Cancelar timer
          if (lobbyData.timer) {
            clearTimeout(lobbyData.timer);
            lobbyData.timer = null;
          }
          // Finalizar IMEDIATAMENTE sem delay
          console.log(`⚡ Finalizando pergunta IMEDIATAMENTE (índice atual: ${lobbyData.currentQuestion})`);
          endQuestion(lobbyId, lobbyData.currentQuestion);
        }

      } catch (error) {
        console.error('Erro ao submeter resposta:', error);
        socket.emit('error', { message: 'Erro interno' });
      }
    });

    // Evento: Participante/Admin confirma que VIU a pergunta
    socket.on('question_ready', (data) => {
      try {
        const { lobbyId } = data;
        const lobbyData = lobbies.get(lobbyId);
        
        if (!lobbyData || lobbyData.timerStarted) return;
        
        lobbyData.questionReadyCount = (lobbyData.questionReadyCount || 0) + 1;
        const totalNeeded = lobbyData.participants.size + 1; // participantes + admin
        
        console.log(`✅ Confirmação recebida (${lobbyData.questionReadyCount}/${totalNeeded})`);
        
        // Se TODOS confirmaram que viram, iniciar timer IMEDIATAMENTE
        if (lobbyData.questionReadyCount >= totalNeeded) {
          console.log(`🎯 TODOS viram a pergunta - iniciando timer AGORA!`);
          const currentQuestion = lobbyData.quiz[lobbyData.currentQuestion];
          if (currentQuestion) {
            startQuestionTimer(lobbyId, lobbyData.currentQuestion, currentQuestion.time_limit_seconds);
          }
        }
        
      } catch (error) {
        console.error('Erro ao processar question_ready:', error);
      }
    });

    // Evento: Admin remove participante
    socket.on('kick_participant', async (data) => {
      try {
        const { lobbyId, participantId } = data;
        
        if (!socket.isAdmin || socket.lobbyId !== lobbyId) {
          socket.emit('error', { message: 'Acesso negado' });
          return;
        }

        const lobbyData = lobbies.get(lobbyId);
        if (!lobbyData) {
          socket.emit('error', { message: 'Lobby não encontrado' });
          return;
        }

        // Remover participante da memória
        const participant = lobbyData.participants.get(participantId);
        if (participant) {
          // Desconectar socket do participante
          const participantSocket = io.sockets.sockets.get(participant.socketId);
          if (participantSocket) {
            participantSocket.emit('kicked', { message: 'Você foi removido do lobby' });
            participantSocket.disconnect();
          }
          
          lobbyData.participants.delete(participantId);
        }

        // Remover do banco
        const db = createConnection();
        await runQuery(db, 'DELETE FROM participants WHERE id = ?', [participantId]);
        db.close();

        // Notificar atualização
        await sendLobbyUpdate(lobbyId);

      } catch (error) {
        console.error('Erro ao remover participante:', error);
        socket.emit('error', { message: 'Erro interno' });
      }
    });

    // Evento: Desconexão
    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
      
      if (socket.lobbyId) {
        const lobbyData = lobbies.get(socket.lobbyId);
        if (lobbyData) {
          if (socket.isAdmin) {
            // Admin desconectou
            lobbyData.adminSocket = null;
          } else if (socket.participantId) {
            // Participante desconectou - manter na memória mas marcar como desconectado
            const participant = lobbyData.participants.get(socket.participantId);
            if (participant) {
              participant.socketId = null;
            }
          }
        }
      }
    });
  });

  // Função para iniciar uma pergunta
  async function startQuestion(lobbyId, questionIndex) {
    console.log(`🎯 [CHAMADA] startQuestion(${lobbyId}, ${questionIndex})`);
    console.log(`🎯 Iniciando pergunta ${questionIndex + 1} no lobby ${lobbyId}`);
    console.log(`🔍 ANÁLISE: questionIndex=${questionIndex}, será enviado como questionIndex=${questionIndex + 1} para o frontend`);
    
    const lobbyData = lobbies.get(lobbyId);
    if (!lobbyData || !lobbyData.quiz) {
      console.log('❌ Lobby ou quiz não encontrado na memória');
      return;
    }
    
    // Sincronizar currentQuestion com questionIndex
    console.log(`🔢 Estado ANTES: lobbyData.currentQuestion = ${lobbyData.currentQuestion}`);
    lobbyData.currentQuestion = questionIndex;
    console.log(`🔢 Estado DEPOIS: lobbyData.currentQuestion = ${lobbyData.currentQuestion} (sincronizado)`);
    console.log(`🔄 SINCRONIZAÇÃO: currentQuestion agora é ${questionIndex}, igual ao questionIndex passado`);

    console.log(`🔍 Debug - Total perguntas: ${lobbyData.quiz.length}, Índice atual: ${questionIndex}`);
    
    const question = lobbyData.quiz[questionIndex];
    if (!question) {
      console.log(`❌ Erro: Pergunta não encontrada no índice ${questionIndex}`);
      console.log(`📋 Perguntas disponíveis:`, lobbyData.quiz.map((q, i) => `${i}: ${q.text.substring(0, 30)}...`));
      return;
    }

    console.log(`📝 Enviando pergunta ${questionIndex + 1}/${lobbyData.quiz.length}`);
    console.log(`⏱️ Tempo limite: ${question.time_limit_seconds} segundos`);

    const startedAt = new Date().toISOString();
    
    // Enviar pergunta para todos (sem resposta correta)
    const questionData = {
      questionId: question.id,
      text: question.text,
      options: question.options,
      timeLimitSeconds: question.time_limit_seconds,
      startedAt,
      questionIndex: questionIndex + 1,
      totalQuestions: lobbyData.quiz.length
    };
    
    console.log(`📤 Enviando question_start para lobby ${lobbyId} (pergunta ${questionIndex + 1})`);
    
    // Inicializar sistema de confirmação de recebimento
    lobbyData.questionReadyCount = 0;
    lobbyData.questionStartTime = null;
    lobbyData.timerStarted = false;
    
    io.to(lobbyId).emit('question_start', questionData);
    
    console.log(`⏳ Aguardando confirmação de que TODOS viram a pergunta...`);
    
    // Aguardar 1 segundo para garantir que todos receberam a pergunta
    setTimeout(() => {
      console.log(`🚀 Iniciando timer da pergunta (todos devem ter visto)`);
      startQuestionTimer(lobbyId, questionIndex, question.time_limit_seconds);
    }, 1000);
  }

  // Função para iniciar o timer da pergunta (quando todos estão prontos)
  function startQuestionTimer(lobbyId, questionIndex, timeLimitSeconds) {
    const lobbyData = lobbies.get(lobbyId);
    if (!lobbyData || lobbyData.timerStarted) return;
    
    console.log(`⏰ Iniciando timer de ${timeLimitSeconds}s para pergunta ${questionIndex + 1}`);
    console.log(`🚦 Todos os participantes confirmaram recebimento - timer oficial iniciado!`);
    
    lobbyData.timerStarted = true;
    lobbyData.questionStartTime = new Date().toISOString();
    
    // Timer de segurança removido - sistema simplificado
    
    // Notificar todos que o timer oficial iniciou
    io.to(lobbyId).emit('timer_started', { 
      startTime: lobbyData.questionStartTime,
      timeLimitSeconds 
    });
    
    // Timer principal para finalizar pergunta
    lobbyData.timer = setTimeout(() => {
      console.log(`⏰ Tempo esgotado para pergunta ${questionIndex + 1}`);
      endQuestion(lobbyId, questionIndex);
    }, timeLimitSeconds * 1000);
  }

  // Função para finalizar uma pergunta
  async function endQuestion(lobbyId, questionIndex) {
    console.log(`🏁 [CHAMADA] endQuestion(${lobbyId}, ${questionIndex})`);
    console.log(`🏁 Finalizando pergunta ${questionIndex + 1} no lobby ${lobbyId}`);
    
    const lobbyData = lobbies.get(lobbyId);
    if (!lobbyData || !lobbyData.quiz) return;
    
    console.log(`🔢 Estado antes: lobbyData.currentQuestion = ${lobbyData.currentQuestion}`);

    const question = lobbyData.quiz[questionIndex];
    
    // Buscar participantes que acertaram (ordenados alfabeticamente)
    const db = createConnection();
    const correctAnswers = await allQuery(db, `
      SELECT p.id, p.nickname
      FROM answers a
      JOIN participants p ON a.participant_id = p.id
      WHERE a.lobby_id = ? AND a.question_id = ? AND a.correct = TRUE
      ORDER BY p.nickname ASC
    `, [lobbyId, question.id]);

    db.close();

    // Enviar resultado da pergunta
    io.to(lobbyId).emit('question_end', {
      questionId: question.id,
      correctOptionId: question.correct_option_id,
      correctParticipants: correctAnswers
    });

    // Enviar ranking atualizado
    await sendScoreUpdate(lobbyId);

    // Avançar para próxima pergunta após 3 segundos
    setTimeout(() => {
      console.log(`🔢 Estado ANTES de avançar: currentQuestion = ${lobbyData.currentQuestion}`);
      const nextQuestionIndex = lobbyData.currentQuestion + 1;
      console.log(`➡️ Calculando próxima pergunta: ${nextQuestionIndex + 1} (índice: ${nextQuestionIndex})`);
      console.log(`📊 Total de perguntas disponíveis: ${lobbyData.quiz.length}`);
      
      // Verificar se há próxima pergunta
      if (nextQuestionIndex < lobbyData.quiz.length) {
        console.log(`✅ Próxima pergunta existe (índice ${nextQuestionIndex})`);
        // startQuestion vai sincronizar currentQuestion automaticamente
        startQuestion(lobbyId, nextQuestionIndex);
      } else {
        console.log(`🏁 Todas as perguntas foram respondidas (tentou acessar índice ${nextQuestionIndex})`);
        finishQuiz(lobbyId);
      }
    }, 3000);
  }

  // Função para finalizar quiz
  async function finishQuiz(lobbyId) {
    console.log(`🏁 Finalizando quiz no lobby ${lobbyId}`);
    const lobbyData = lobbies.get(lobbyId);
    if (!lobbyData) {
      console.log('❌ Lobby não encontrado ao finalizar quiz');
      return;
    }

    // Marcar como finalizado no banco
    const db = createConnection();
    await runQuery(db, 
      'UPDATE lobbies SET status = "finished", finished_at = CURRENT_TIMESTAMP WHERE lobby_id = ?',
      [lobbyId]
    );

    // Buscar ranking final
    const finalRanking = await allQuery(db, `
      SELECT id, nickname, score
      FROM participants
      WHERE lobby_id = ?
      ORDER BY score DESC, nickname ASC
    `, [lobbyId]);

    db.close();

    // Atualizar estado
    lobbyData.status = 'finished';

    // Enviar resultados finais
    io.to(lobbyId).emit('final_results', {
      ranking: finalRanking.map((p, index) => ({
        ...p,
        position: index + 1
      }))
    });
  }

  // Função para enviar atualização do lobby
  async function sendLobbyUpdate(lobbyId) {
    const lobbyData = lobbies.get(lobbyId);
    if (!lobbyData) {
      console.log(`⚠️ Lobby ${lobbyId} não encontrado em memória`);
      return;
    }

    const participants = Array.from(lobbyData.participants.values());
    const participantCount = participants.length;

    console.log(`📡 Enviando atualização do lobby ${lobbyId}: ${participantCount} participantes`);
    console.log(`📝 Participantes:`, participants.map(p => p.nickname));

    io.to(lobbyId).emit('lobby_update', {
      participants,
      count: participantCount
    });

    // Verificar se pode iniciar (>= 2 participantes)
    const allowed = participantCount >= 2;
    const needed = Math.max(0, 2 - participantCount);
    
    console.log(`🚦 Start allowed: ${allowed}, needed: ${needed}`);
    
    io.to(lobbyId).emit('start_allowed', {
      allowed,
      count: participantCount,
      needed
    });
  }

  // Função para enviar atualização de score
  async function sendScoreUpdate(lobbyId) {
    const db = createConnection();
    const ranking = await allQuery(db, `
      SELECT id, nickname, score
      FROM participants
      WHERE lobby_id = ?
      ORDER BY score DESC, nickname ASC
    `, [lobbyId]);
    db.close();

    io.to(lobbyId).emit('score_update', { ranking });
  }
}

module.exports = socketHandler;
