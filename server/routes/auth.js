const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { createConnection, runQuery, getQuery } = require('../database/init');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { ensureAdminExists } = require('../middleware/ensureAdmin');

const router = express.Router();

// Schemas de validação
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().min(10).max(20).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(10).max(20).allow('').optional(),
  avatar: Joi.string().uri().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// POST /api/admin/register
router.post('/register', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, phone } = value;
    const db = createConnection();

    // Verificar se email já existe
    const existingAdmin = await getQuery(db, 
      'SELECT id FROM admins WHERE email = ?', 
      [email]
    );

    if (existingAdmin) {
      db.close();
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Verificar se é o primeiro usuário (será superadmin)
    const userCount = await getQuery(db, 'SELECT COUNT(*) as count FROM admins');
    const isFirstUser = userCount.count === 0;

    // Criar admin
    const result = await runQuery(db, 
      'INSERT INTO admins (name, email, password_hash, phone, role, status, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name, 
        email, 
        passwordHash, 
        phone || null,
        isFirstUser ? 'superadmin' : 'admin',
        isFirstUser ? 'approved' : 'pending',
        isFirstUser ? new Date().toISOString() : null
      ]
    );

    db.close();

    if (isFirstUser) {
      // Primeiro usuário (superadmin) - fazer login automaticamente
      const token = generateToken(result.id);
      
      res.status(201).json({
        message: 'Superadmin criado com sucesso',
        admin: { id: result.id, name, email, role: 'superadmin', status: 'approved' },
        token
      });
    } else {
      // Usuário comum - aguardar aprovação
      res.status(201).json({
        message: 'Conta criada com sucesso! Aguarde a aprovação de um administrador para fazer login.',
        admin: { id: result.id, name, email, role: 'admin', status: 'pending' }
      });
    }

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/login
router.post('/login', ensureAdminExists, async (req, res) => {
  try {
    // Validar dados
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;
    const db = createConnection();

    // Buscar admin
    const admin = await getQuery(db, 
      'SELECT id, name, email, password_hash, role, status, phone, avatar FROM admins WHERE email = ?', 
      [email]
    );

    if (!admin) {
      db.close();
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar status da conta
    if (admin.status === 'pending') {
      db.close();
      return res.status(401).json({ error: 'Sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.' });
    }

    if (admin.status === 'rejected') {
      db.close();
      return res.status(401).json({ error: 'Sua conta foi rejeitada. Entre em contato com um administrador.' });
    }

    if (admin.status === 'restricted') {
      db.close();
      return res.status(401).json({ error: 'Sua conta está restrita. Entre em contato com um administrador.' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      db.close();
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    db.close();

    // Gerar token
    const token = generateToken(admin.id);

    res.json({
      message: 'Login realizado com sucesso',
      admin: { 
        id: admin.id, 
        name: admin.name, 
        email: admin.email, 
        role: admin.role,
        status: admin.status,
        phone: admin.phone,
        avatar: admin.avatar
      },
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/profile (rota protegida para verificar token)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = createConnection();
    const admin = await getQuery(db, 
      'SELECT id, name, email, role, status, phone, avatar FROM admins WHERE id = ?',
      [req.admin.id]
    );
    db.close();

    if (!admin) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ admin });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/profile - Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, phone, avatar } = value;
    const db = createConnection();

    // Atualizar apenas campos fornecidos
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar || null);
    }

    if (updates.length === 0) {
      db.close();
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.admin.id);
    
    await runQuery(db, 
      `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Buscar dados atualizados
    const updatedAdmin = await getQuery(db, 
      'SELECT id, name, email, role, status, phone, avatar FROM admins WHERE id = ?',
      [req.admin.id]
    );

    db.close();

    res.json({
      message: 'Perfil atualizado com sucesso',
      admin: updatedAdmin
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/change-password - Alterar senha
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { currentPassword, newPassword } = value;
    const db = createConnection();

    // Buscar senha atual
    const admin = await getQuery(db, 
      'SELECT password_hash FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (!admin) {
      db.close();
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!validPassword) {
      db.close();
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await runQuery(db, 
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.admin.id]
    );

    db.close();

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/forgot-password - Solicitar reset de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = value;
    const db = createConnection();

    // Verificar se usuário existe
    const admin = await getQuery(db, 
      'SELECT id, name FROM admins WHERE email = ?',
      [email]
    );

    if (!admin) {
      db.close();
      // Não revelar se o email existe ou não por segurança
      return res.json({ message: 'Se o email existir, um link de recuperação será enviado.' });
    }

    // Gerar token único
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hora

    // Invalidar tokens antigos
    await runQuery(db, 
      'UPDATE password_reset_tokens SET used = TRUE WHERE admin_id = ? AND used = FALSE',
      [admin.id]
    );

    // Criar novo token
    await runQuery(db, 
      'INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)',
      [admin.id, token, expiresAt]
    );

    db.close();

    // TODO: Implementar envio de email
    // Por enquanto, retornar o token para desenvolvimento
    console.log(`🔑 Token de recuperação para ${email}: ${token}`);
    
    res.json({ 
      message: 'Se o email existir, um link de recuperação será enviado.',
      // Remover em produção:
      dev_token: process.env.NODE_ENV === 'development' ? token : undefined
    });

  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/reset-password - Resetar senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { token, newPassword } = value;
    const db = createConnection();

    // Buscar token válido
    const resetToken = await getQuery(db, `
      SELECT prt.admin_id, a.email 
      FROM password_reset_tokens prt
      JOIN admins a ON prt.admin_id = a.id
      WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > CURRENT_TIMESTAMP
    `, [token]);

    if (!resetToken) {
      db.close();
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Hash da nova senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await runQuery(db, 
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [passwordHash, resetToken.admin_id]
    );

    // Marcar token como usado
    await runQuery(db, 
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
      [token]
    );

    db.close();

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
