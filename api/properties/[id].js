const { properties } = require('../../_data/staticData');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { id } = req.query;

  // Rota: /api/properties/:id/geometry
  if (req.url && req.url.includes('/geometry')) {
    const property = properties.find((p) => p.id === id);
    if (!property) return res.status(404).json({ error: 'Propriedade não encontrada' });
    if (!property.geometry_wkt) return res.status(404).json({ error: 'Geometria não disponível' });
    return res.status(200).json({ id: property.id, geometry_wkt: property.geometry_wkt });
  }

  // Rota: /api/properties/:id
  const property = properties.find((p) => p.id === id);
  if (!property) return res.status(404).json({ error: 'Propriedade não encontrada' });
  return res.status(200).json(property);
};
