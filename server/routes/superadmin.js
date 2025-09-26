const express = require('express');
const Joi = require('joi');
const { createConnection, runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar se é superadmin
const requireSuperAdmin = async (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas superadmins podem acessar esta funcionalidade.' });
  }
  next();
};

// Schema de validação para ações do superadmin
const actionSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject', 'restrict', 'unrestrict').required(),
  reason: Joi.string().max(500).optional()
});

// GET /api/superadmin/users - Listar todos os usuários
router.get('/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = createConnection();
    
    const users = await allQuery(db, `
      SELECT 
        a.id,
        a.name,
        a.email,
        a.phone,
        a.avatar,
        a.role,
        a.status,
        a.created_at,
        a.approved_at,
        approver.name as approved_by_name,
        COUNT(q.id) as quiz_count
      FROM admins a
      LEFT JOIN admins approver ON a.approved_by = approver.id
      LEFT JOIN quizzes q ON a.id = q.admin_id
      WHERE a.role != 'superadmin'
      GROUP BY a.id
      ORDER BY 
        CASE a.status 
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'restricted' THEN 3
          WHEN 'rejected' THEN 4
        END,
        a.created_at DESC
    `);

    db.close();
    res.json({ users });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/superadmin/stats - Estatísticas do sistema
router.get('/stats', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = createConnection();
    
    const stats = await getQuery(db, `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_users,
        SUM(CASE WHEN status = 'restricted' THEN 1 ELSE 0 END) as restricted_users,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_users
      FROM admins 
      WHERE role != 'superadmin'
    `);

    const quizStats = await getQuery(db, `
      SELECT COUNT(*) as total_quizzes
      FROM quizzes
    `);

    const recentActions = await allQuery(db, `
      SELECT 
        al.action,
        al.reason,
        al.created_at,
        sa.name as superadmin_name,
        ta.name as target_name
      FROM admin_logs al
      JOIN admins sa ON al.superadmin_id = sa.id
      JOIN admins ta ON al.target_admin_id = ta.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    db.close();
    
    res.json({ 
      stats: {
        ...stats,
        total_quizzes: quizStats.total_quizzes
      },
      recent_actions: recentActions
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/superadmin/users/:userId/action - Ação sobre usuário
router.post('/users/:userId/action', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    // Validar dados
    const { error, value } = actionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId } = req.params;
    const { action, reason } = value;
    const db = createConnection();

    // Verificar se o usuário existe e não é superadmin
    const user = await getQuery(db, 
      'SELECT id, name, email, status, role FROM admins WHERE id = ? AND role != "superadmin"',
      [userId]
    );

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Determinar novo status baseado na ação
    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'restrict':
        newStatus = 'restricted';
        break;
      case 'unrestrict':
        newStatus = 'approved';
        break;
    }

    // Atualizar status do usuário
    if (action === 'approve') {
      await runQuery(db, `
        UPDATE admins 
        SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [newStatus, req.admin.id, userId]);
    } else {
      await runQuery(db, `
        UPDATE admins 
        SET status = ? 
        WHERE id = ?
      `, [newStatus, userId]);
    }

    // Registrar log da ação
    await runQuery(db, `
      INSERT INTO admin_logs (superadmin_id, target_admin_id, action, reason)
      VALUES (?, ?, ?, ?)
    `, [req.admin.id, userId, action, reason || null]);

    db.close();

    res.json({ 
      message: `Usuário ${action === 'approve' ? 'aprovado' : action === 'reject' ? 'rejeitado' : action === 'restrict' ? 'restringido' : 'desbloqueado'} com sucesso`,
      user: { id: user.id, name: user.name, status: newStatus }
    });

  } catch (error) {
    console.error('Erro na ação do superadmin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/superadmin/users/:userId - Excluir usuário
router.delete('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const db = createConnection();

    // Verificar se o usuário existe e não é superadmin
    const user = await getQuery(db, 
      'SELECT id, name, email, role FROM admins WHERE id = ? AND role != "superadmin"',
      [userId]
    );

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Registrar log antes de excluir
    await runQuery(db, `
      INSERT INTO admin_logs (superadmin_id, target_admin_id, action, reason)
      VALUES (?, ?, 'delete', ?)
    `, [req.admin.id, userId, reason || 'Usuário excluído pelo superadmin']);

    // Excluir dados relacionados (em cascata)
    await runQuery(db, 'DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE admin_id = ?))', [userId]);
    await runQuery(db, 'DELETE FROM participants WHERE lobby_id IN (SELECT lobby_id FROM lobbies WHERE admin_id = ?)', [userId]);
    await runQuery(db, 'DELETE FROM lobbies WHERE admin_id = ?', [userId]);
    await runQuery(db, 'DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE admin_id = ?)', [userId]);
    await runQuery(db, 'DELETE FROM quizzes WHERE admin_id = ?', [userId]);
    await runQuery(db, 'DELETE FROM password_reset_tokens WHERE admin_id = ?', [userId]);
    
    // Excluir o usuário
    await runQuery(db, 'DELETE FROM admins WHERE id = ?', [userId]);

    db.close();

    res.json({ message: 'Usuário excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/superadmin/logs - Logs de ações
router.get('/logs', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = createConnection();
    
    const logs = await allQuery(db, `
      SELECT 
        al.id,
        al.action,
        al.reason,
        al.created_at,
        sa.name as superadmin_name,
        ta.name as target_name,
        ta.email as target_email
      FROM admin_logs al
      JOIN admins sa ON al.superadmin_id = sa.id
      LEFT JOIN admins ta ON al.target_admin_id = ta.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const total = await getQuery(db, 'SELECT COUNT(*) as count FROM admin_logs');

    db.close();
    
    res.json({ 
      logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total.count / limit),
        total_items: total.count
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
