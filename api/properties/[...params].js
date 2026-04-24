/**
 * Catch-all para sub-rotas de propriedade:
 *   GET /api/properties/:id/geometry
 *   GET /api/properties/:id/layers/linha-amarela
 *
 * Nota: /api/properties/:id simples é tratado pelo [id].js (mais específico).
 * Este arquivo cobre paths com 2+ segmentos após /api/properties/.
 */
const { properties } = require('../_data/staticData');

// Mapeamento propriedade -> identificadores da linha amarela
const propertyToLinhaAmarelaIds = {
  prop_001: ['3708083'],
  prop_002: ['1087945'],
  prop_005: ['606675']
};

// Dados GeoJSON da Linha Amarela embutidos (não depende de fs no Vercel)
const linhaAmarelaGeoJSON = {
  type: 'FeatureCollection',
  name: 'Linha_amarela',
  features: [
    {
      type: 'Feature',
      properties: { identificador_lote: 3708083, nome: 'Linha amarela (3708083) - área 1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-41.48962, -14.39262],
          [-41.48653, -14.39055],
          [-41.48400, -14.38570],
          [-41.48308, -14.38532],
          [-41.48421, -14.38376],
          [-41.48321, -14.38299],
          [-41.47924, -14.38974],
          [-41.47984, -14.39028],
          [-41.48107, -14.39763],
          [-41.48962, -14.39262]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { identificador_lote: 606675, nome: 'Linha amarela (606675) - área 1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-51.53327, -25.08652],
          [-51.53339, -25.08783],
          [-51.53177, -25.08789],
          [-51.53177, -25.08662],
          [-51.53327, -25.08652]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { identificador_lote: 1087945, nome: 'Linha amarela (1087945) - área 1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-49.65552, -26.32259],
          [-49.65577, -26.32225],
          [-49.65499, -26.32142],
          [-49.65483, -26.32157],
          [-49.65552, -26.32259]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { identificador_lote: 1087945, nome: 'Linha amarela (1087945) - área 2' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-49.65535, -26.32152],
          [-49.65543, -26.32118],
          [-49.65519, -26.32143],
          [-49.65535, -26.32152]
        ]]
      }
    }
  ]
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  // params é array: ['prop_001', 'layers', 'linha-amarela'] etc.
  const params = Array.isArray(req.query.params) ? req.query.params : [req.query.params];
  const id = params[0];
  const subPath = params.slice(1).join('/');

  if (!id) return res.status(400).json({ error: 'ID inválido' });

  // GET /api/properties/:id/layers/linha-amarela
  if (subPath === 'layers/linha-amarela') {
    const imovelIds = (propertyToLinhaAmarelaIds[id] || []).map(String);

    if (imovelIds.length === 0) {
      return res.status(200).json({
        type: 'FeatureCollection',
        name: 'Linha_amarela_filtrada',
        features: []
      });
    }

    const filteredFeatures = linhaAmarelaGeoJSON.features.filter((f) =>
      imovelIds.includes(String(f.properties.identificador_lote))
    );

    return res.status(200).json({
      type: 'FeatureCollection',
      name: 'Linha_amarela_filtrada',
      features: filteredFeatures
    });
  }

  // GET /api/properties/:id/geometry
  if (subPath === 'geometry') {
    const property = properties.find((p) => p.id === id);
    if (!property) return res.status(404).json({ error: 'Propriedade não encontrada' });
    if (!property.geometry_wkt) return res.status(404).json({ error: 'Geometria não disponível' });
    return res.status(200).json({ id: property.id, geometry_wkt: property.geometry_wkt });
  }

  return res.status(404).json({ error: 'Rota não encontrada' });
};
