const bcrypt = require('bcryptjs');
const { users } = require('../_data/staticData');

module.exports = async (req, res) => {
  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  const isValid = bcrypt.compareSync(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  return res.status(200).json({
    username: user.username,
    name: user.name,
    role: user.role,
    authenticated: true
  });
};
