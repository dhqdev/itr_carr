const { properties } = require('./_data/staticData');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  return res.status(200).json(properties);
};
