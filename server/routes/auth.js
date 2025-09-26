const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { createConnection, runQuery, getQuery } = require('../database/init');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schemas de validação
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /api/admin/register
router.post('/register', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password } = value;
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

    // Criar admin
    const result = await runQuery(db, 
      'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    db.close();

    // Gerar token
    const token = generateToken(result.id);

    res.status(201).json({
      message: 'Admin criado com sucesso',
      admin: { id: result.id, name, email },
      token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
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
      'SELECT id, name, email, password_hash FROM admins WHERE email = ?', 
      [email]
    );

    if (!admin) {
      db.close();
      return res.status(401).json({ error: 'Email ou senha incorretos' });
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
      admin: { id: admin.id, name: admin.name, email: admin.email },
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/profile (rota protegida para verificar token)
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    admin: req.admin
  });
});

module.exports = router;
