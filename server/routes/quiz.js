const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { createConnection, runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schemas de validação
const questionSchema = Joi.object({
  id: Joi.alternatives().try(Joi.number(), Joi.string()).optional(), // Permite ID temporal do frontend
  dbId: Joi.alternatives().try(Joi.number(), Joi.string()).optional(), // Permite ID do banco para edição
  tempId: Joi.alternatives().try(Joi.number(), Joi.string()).optional(), // Permite ID temporal
  text: Joi.string().min(5).max(500).required(),
  options: Joi.array().items(
    Joi.object({
      id: Joi.string().valid('A', 'B', 'C', 'D').required(),
      text: Joi.string().min(1).max(200).required()
    })
  ).min(2).max(4).required(),
  correctOptionId: Joi.string().valid('A', 'B', 'C', 'D').required(),
  timeLimitSeconds: Joi.number().valid(15, 30, 45, 60).required()
});

const quizSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(500).allow(''),
  questions: Joi.array().items(questionSchema).min(1).max(20).required()
});

// GET /api/quiz/admin/quizzes - Listar quizzes do admin
router.get('/admin/quizzes', authenticateToken, async (req, res) => {
  try {
    const db = createConnection();
    
    const quizzes = await allQuery(db, `
      SELECT 
        q.id,
        q.title,
        q.description,
        q.published,
        q.created_at,
        COUNT(qu.id) as question_count,
        l.lobby_id,
        l.status as lobby_status
      FROM quizzes q
      LEFT JOIN questions qu ON q.id = qu.quiz_id
      LEFT JOIN lobbies l ON q.id = l.quiz_id AND l.status != 'finished'
      WHERE q.admin_id = ?
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [req.admin.id]);

    db.close();
    res.json({ quizzes });

  } catch (error) {
    console.error('Erro ao buscar quizzes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware para verificar se é admin ou superadmin
const requireAdmin = async (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.admin.role)) {
    return res.status(403).json({ error: 'Apenas administradores podem criar quizzes' });
  }
  next();
};

// POST /api/quiz/admin/quizzes - Criar novo quiz
router.post('/admin/quizzes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Validar dados
    const { error, value } = quizSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, questions } = value;
    const db = createConnection();

    // Criar quiz
    const quizResult = await runQuery(db, 
      'INSERT INTO quizzes (admin_id, title, description) VALUES (?, ?, ?)',
      [req.admin.id, title, description || '']
    );

    const quizId = quizResult.id;

    // Criar perguntas
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await runQuery(db, `
        INSERT INTO questions (quiz_id, text, options, correct_option_id, time_limit_seconds, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        quizId,
        question.text,
        JSON.stringify(question.options),
        question.correctOptionId,
        question.timeLimitSeconds,
        i
      ]);
    }

    db.close();

    res.status(201).json({
      message: 'Quiz criado com sucesso',
      quiz: { id: quizId, title, description, questionCount: questions.length }
    });

  } catch (error) {
    console.error('Erro ao criar quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/quiz/:quizId - Buscar quiz público (para preview)
router.get('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = createConnection();

    const quiz = await getQuery(db, `
      SELECT q.id, q.title, q.description, q.published, a.name as admin_name
      FROM quizzes q
      JOIN admins a ON q.admin_id = a.id
      WHERE q.id = ?
    `, [quizId]);

    if (!quiz) {
      db.close();
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    const questions = await allQuery(db, `
      SELECT id, text, options, time_limit_seconds, order_index
      FROM questions 
      WHERE quiz_id = ? 
      ORDER BY order_index
    `, [quizId]);

    // Parse das opções JSON
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    db.close();

    res.json({
      quiz: {
        ...quiz,
        questions: parsedQuestions
      }
    });

  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/quiz/:quizId/publish - Publicar quiz e criar lobby
router.post('/:quizId/publish', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = createConnection();

    // Verificar se o quiz pertence ao admin
    const quiz = await getQuery(db, 
      'SELECT id, title, admin_id FROM quizzes WHERE id = ? AND admin_id = ?',
      [quizId, req.admin.id]
    );

    if (!quiz) {
      db.close();
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Verificar se tem perguntas
    const questionCount = await getQuery(db, 
      'SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    if (questionCount.count === 0) {
      db.close();
      return res.status(400).json({ error: 'Quiz deve ter pelo menos uma pergunta' });
    }

    // Gerar lobby ID único
    const lobbyId = uuidv4().substring(0, 8).toUpperCase();

    // Verificar se já existe lobby ativo para este quiz
    const existingLobby = await getQuery(db,
      'SELECT lobby_id FROM lobbies WHERE quiz_id = ? AND status != "finished"',
      [quizId]
    );

    if (existingLobby) {
      db.close();
      return res.json({
        message: 'Quiz já possui lobby ativo',
        lobbyId: existingLobby.lobby_id,
        joinLink: `/join/${existingLobby.lobby_id}`
      });
    }

    // Marcar quiz como publicado
    await runQuery(db, 
      'UPDATE quizzes SET published = TRUE WHERE id = ?',
      [quizId]
    );

    // Criar lobby
    await runQuery(db, `
      INSERT INTO lobbies (quiz_id, lobby_id, admin_id, status)
      VALUES (?, ?, ?, 'waiting')
    `, [quizId, lobbyId, req.admin.id]);

    db.close();

    const joinLink = `/join/${lobbyId}`;
    
    res.json({
      message: 'Quiz publicado com sucesso',
      lobbyId,
      joinLink,
      quiz: { id: quiz.id, title: quiz.title }
    });

  } catch (error) {
    console.error('Erro ao publicar quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/quiz/admin/quizzes/:quizId - Buscar quiz para edição
router.get('/admin/quizzes/:quizId', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = createConnection();

    // Verificar se o quiz pertence ao admin
    const quiz = await getQuery(db, 
      'SELECT id, title, description FROM quizzes WHERE id = ? AND admin_id = ?',
      [quizId, req.admin.id]
    );

    if (!quiz) {
      db.close();
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Buscar perguntas
    const questions = await allQuery(db, `
      SELECT id, text, options, correct_option_id, time_limit_seconds, order_index
      FROM questions 
      WHERE quiz_id = ? 
      ORDER BY order_index
    `, [quizId]);

    // Parse das opções JSON e adicionar ID temporal para o frontend
    const parsedQuestions = questions.map((q, index) => ({
      id: q.id, // ID real do banco
      tempId: Date.now() + index, // ID temporal para o frontend
      text: q.text,
      options: JSON.parse(q.options),
      correctOptionId: q.correct_option_id,
      timeLimitSeconds: q.time_limit_seconds
    }));

    db.close();

    res.json({
      quiz: {
        ...quiz,
        questions: parsedQuestions
      }
    });

  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/quiz/admin/quizzes/:quizId - Atualizar quiz
router.put('/admin/quizzes/:quizId', authenticateToken, async (req, res) => {
  try {
    // Validar dados
    const { error, value } = quizSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { quizId } = req.params;
    const { title, description, questions } = value;
    const db = createConnection();

    // Verificar se o quiz pertence ao admin
    const quiz = await getQuery(db, 
      'SELECT id FROM quizzes WHERE id = ? AND admin_id = ?',
      [quizId, req.admin.id]
    );

    if (!quiz) {
      db.close();
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Atualizar quiz
    await runQuery(db, 
      'UPDATE quizzes SET title = ?, description = ? WHERE id = ?',
      [title, description || '', quizId]
    );

    // Remover perguntas antigas
    await runQuery(db, 'DELETE FROM questions WHERE quiz_id = ?', [quizId]);

    // Criar novas perguntas
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await runQuery(db, `
        INSERT INTO questions (quiz_id, text, options, correct_option_id, time_limit_seconds, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        quizId,
        question.text,
        JSON.stringify(question.options),
        question.correctOptionId,
        question.timeLimitSeconds,
        i
      ]);
    }

    db.close();

    res.json({
      message: 'Quiz atualizado com sucesso',
      quiz: { id: quizId, title, description, questionCount: questions.length }
    });

  } catch (error) {
    console.error('Erro ao atualizar quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/quiz/admin/quizzes/:quizId - Excluir quiz
router.delete('/admin/quizzes/:quizId', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = createConnection();

    // Verificar se o quiz pertence ao admin
    const quiz = await getQuery(db, 
      'SELECT id FROM quizzes WHERE id = ? AND admin_id = ?',
      [quizId, req.admin.id]
    );

    if (!quiz) {
      db.close();
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Excluir respostas relacionadas
    await runQuery(db, 'DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ?)', [quizId]);
    
    // Excluir participantes de lobbies relacionados
    await runQuery(db, 'DELETE FROM participants WHERE lobby_id IN (SELECT lobby_id FROM lobbies WHERE quiz_id = ?)', [quizId]);
    
    // Excluir lobbies relacionados
    await runQuery(db, 'DELETE FROM lobbies WHERE quiz_id = ?', [quizId]);
    
    // Excluir perguntas relacionadas
    await runQuery(db, 'DELETE FROM questions WHERE quiz_id = ?', [quizId]);
    
    // Excluir o quiz
    await runQuery(db, 'DELETE FROM quizzes WHERE id = ?', [quizId]);

    db.close();

    res.json({ message: 'Quiz excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
