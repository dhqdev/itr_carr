const { properties } = require('../_data/staticData');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const municipios = [...new Set(properties.map((p) => p.municipio))].sort();
  return res.status(200).json(
    municipios.map((nome) => ({ id: nome.toLowerCase(), nome }))
  );
};
