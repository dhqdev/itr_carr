/**
 * GET /api/layers/linha-amarela
 * Retorna todos os polígonos da Linha Amarela (sem filtro de propriedade).
 * Dados embutidos — não depende de fs no Vercel.
 */

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
  return res.status(200).json(linhaAmarelaGeoJSON);
};

