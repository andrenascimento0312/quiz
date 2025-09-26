const express = require('express');
const { createConnection, getQuery, allQuery } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/lobby/:lobbyId - Informações básicas do lobby (público)
router.get('/:lobbyId', async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const db = createConnection();

    const lobby = await getQuery(db, `
      SELECT 
        l.lobby_id,
        l.status,
        l.created_at,
        q.title as quiz_title,
        q.description as quiz_description,
        a.name as admin_name
      FROM lobbies l
      JOIN quizzes q ON l.quiz_id = q.id
      JOIN admins a ON l.admin_id = a.id
      WHERE l.lobby_id = ?
    `, [lobbyId]);

    if (!lobby) {
      db.close();
      return res.status(404).json({ error: 'Lobby não encontrado' });
    }

    // Contar participantes
    const participantCount = await getQuery(db,
      'SELECT COUNT(*) as count FROM participants WHERE lobby_id = ?',
      [lobbyId]
    );

    db.close();

    res.json({
      lobby: {
        ...lobby,
        participantCount: participantCount.count
      }
    });

  } catch (error) {
    console.error('Erro ao buscar lobby:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/lobby/:lobbyId/participants - Lista de participantes (admin)
router.get('/:lobbyId/participants', authenticateToken, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const db = createConnection();

    // Verificar se o lobby pertence ao admin
    const lobby = await getQuery(db, 
      'SELECT admin_id FROM lobbies WHERE lobby_id = ?',
      [lobbyId]
    );

    if (!lobby) {
      db.close();
      return res.status(404).json({ error: 'Lobby não encontrado' });
    }

    if (lobby.admin_id !== req.admin.id) {
      db.close();
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar participantes
    const participants = await allQuery(db, `
      SELECT id, nickname, score, joined_at, last_seen, socket_id
      FROM participants 
      WHERE lobby_id = ?
      ORDER BY joined_at ASC
    `, [lobbyId]);

    db.close();

    res.json({ participants });

  } catch (error) {
    console.error('Erro ao buscar participantes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/lobby/:lobbyId/quiz - Dados do quiz para o lobby (admin)
router.get('/:lobbyId/quiz', authenticateToken, async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const db = createConnection();

    // Verificar se o lobby pertence ao admin
    const lobby = await getQuery(db, `
      SELECT l.admin_id, l.quiz_id, l.status
      FROM lobbies l
      WHERE l.lobby_id = ?
    `, [lobbyId]);

    if (!lobby) {
      db.close();
      return res.status(404).json({ error: 'Lobby não encontrado' });
    }

    if (lobby.admin_id !== req.admin.id) {
      db.close();
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar quiz e perguntas
    const quiz = await getQuery(db, `
      SELECT id, title, description
      FROM quizzes 
      WHERE id = ?
    `, [lobby.quiz_id]);

    const questions = await allQuery(db, `
      SELECT id, text, options, correct_option_id, time_limit_seconds, order_index
      FROM questions 
      WHERE quiz_id = ? 
      ORDER BY order_index
    `, [lobby.quiz_id]);

    // Parse das opções JSON
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    db.close();

    res.json({
      lobby: {
        lobbyId: lobbyId,
        status: lobby.status
      },
      quiz: {
        ...quiz,
        questions: parsedQuestions
      }
    });

  } catch (error) {
    console.error('Erro ao buscar quiz do lobby:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
