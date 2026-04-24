const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const filePath = path.join(process.cwd(), 'terrein search', 'Linha_amarela.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const geojson = JSON.parse(raw);
    return res.status(200).json(geojson);
  } catch (error) {
    console.error('Erro ao carregar Linha_amarela.json:', error);
    return res.status(500).json({ error: 'Erro ao carregar camada Linha Amarela' });
  }
};
