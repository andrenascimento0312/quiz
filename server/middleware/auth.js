const jwt = require('jsonwebtoken');
const { getQuery, createConnection } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'quiz-secret-key-change-in-production';

// Middleware de autenticação
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar se o admin ainda existe no banco
    const db = createConnection();
    const admin = await getQuery(db, 
      'SELECT id, name, email FROM admins WHERE id = ?', 
      [decoded.adminId]
    );
    db.close();

    if (!admin) {
      return res.status(401).json({ error: 'Admin não encontrado' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Gerar token JWT
function generateToken(adminId) {
  return jwt.sign(
    { adminId }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
}

// Verificar token sem middleware (para websocket)
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = createConnection();
    const admin = await getQuery(db, 
      'SELECT id, name, email FROM admins WHERE id = ?', 
      [decoded.adminId]
    );
    db.close();

    return admin;
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  generateToken,
  verifyToken
};
