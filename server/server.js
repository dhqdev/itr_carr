const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { db, rowToProperty } = require('./database');

const app = express();
const PORT = 3001;

// Mesmo mapeamento usado na migração de geometrias
const propertyToLoteMapping = {
  prop_001: 'BA-2902005-AD06AC9BEE924477AA13EFE0908D15E0',
  prop_002: 'SC-4210100-EA1F3824FC3D4148B83F921E253C6DCD',
  prop_003: 'RJ-3301009-DC994438D87A4CE29E7EECC060BB792E',
  prop_004: 'PI-2200806-97CAEADC4E0A46F5BDB3374851967EDB',
  prop_005: 'PR-4127965-5B8ED84AA1A94E6399506A04DE910B83'
};

// Vínculo explícito propriedade -> identificador_lote da camada amarela
// (prioritário, equivalente ao filtro do Consulta.py)
const propertyToLinhaAmarelaIds = {
  prop_001: ['3708083'],
  prop_002: ['1087945'],
  prop_005: ['606675']
};

function getImovelIdsForProperty(propertyId) {
  const explicitIds = propertyToLinhaAmarelaIds[propertyId];
  if (Array.isArray(explicitIds) && explicitIds.length > 0) {
    return explicitIds.map(String);
  }

  const loteId = propertyToLoteMapping[propertyId];
  if (!loteId) return [];

  try {
    const imovelFilePath = path.join(__dirname, '..', 'terrein search', 'imovel_dados_clean.json');
    const raw = fs.readFileSync(imovelFilePath, 'utf-8');
    const data = JSON.parse(raw);
    const loteData = data?.[loteId]?.result;

    if (!Array.isArray(loteData)) return [];

    const ids = new Set();
    loteData.forEach((item) => {
      const id = item?.identificadorimovel ?? item?.codigoimovel;
      if (id !== undefined && id !== null) {
        ids.add(String(id));
      }
    });

    return [...ids];
  } catch (error) {
    console.error('Erro ao mapear imóvel/lote para Linha Amarela:', error);
    return [];
  }
}

// Middlewares
app.use(cors());
app.use(express.json());

/**
 * Rota de autenticação
 */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Retorna dados do usuário (sem a senha)
    res.json({
      username: user.username,
      name: user.name,
      role: user.role,
      authenticated: true
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para listar todas as propriedades
 */
app.get('/api/properties', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM properties').all();
    const properties = rows.map(rowToProperty);
    res.json(properties);
  } catch (error) {
    console.error('Erro ao buscar propriedades:', error);
    res.status(500).json({ error: 'Erro ao buscar propriedades' });
  }
});

/**
 * Rota para buscar propriedades por município
 */
app.get('/api/properties/municipio/:municipio', (req, res) => {
  const { municipio } = req.params;

  try {
    const rows = db.prepare('SELECT * FROM properties WHERE municipio = ?').all(municipio);
    const properties = rows.map(rowToProperty);
    res.json(properties);
  } catch (error) {
    console.error('Erro ao buscar propriedades:', error);
    res.status(500).json({ error: 'Erro ao buscar propriedades' });
  }
});

/**
 * Rota para buscar uma propriedade específica
 */
app.get('/api/properties/:id', (req, res) => {
  const { id } = req.params;

  try {
    const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    
    if (!row) {
      return res.status(404).json({ error: 'Propriedade não encontrada' });
    }

    const property = rowToProperty(row);
    res.json(property);
  } catch (error) {
    console.error('Erro ao buscar propriedade:', error);
    res.status(500).json({ error: 'Erro ao buscar propriedade' });
  }
});

/**
 * Rota para buscar geometria WKT de uma propriedade
 */
app.get('/api/properties/:id/geometry', (req, res) => {
  const { id } = req.params;

  try {
    const row = db.prepare('SELECT id, geometry_wkt FROM properties WHERE id = ?').get(id);
    
    if (!row) {
      return res.status(404).json({ error: 'Propriedade não encontrada' });
    }

    if (!row.geometry_wkt) {
      return res.status(404).json({ error: 'Geometria não disponível para esta propriedade' });
    }

    res.json({
      id: row.id,
      geometry_wkt: row.geometry_wkt
    });
  } catch (error) {
    console.error('Erro ao buscar geometria:', error);
    res.status(500).json({ error: 'Erro ao buscar geometria' });
  }
});

/**
 * Rota para retornar camada de polígonos secundários (Linha Amarela)
 */
app.get('/api/layers/linha-amarela', (req, res) => {
  const filePath = path.join(__dirname, '..', 'terrein search', 'Linha_amarela.json');

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const geojson = JSON.parse(raw);
    res.json(geojson);
  } catch (error) {
    console.error('Erro ao carregar Linha_amarela.json:', error);
    res.status(500).json({ error: 'Erro ao carregar camada Linha Amarela' });
  }
});

/**
 * Rota para retornar camada Linha Amarela filtrada pela propriedade selecionada
 * (equivalente ao filtro de identificador_lote usado no Consulta.py)
 */
app.get('/api/properties/:id/layers/linha-amarela', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, '..', 'terrein search', 'Linha_amarela.json');

  try {
    const imovelIds = getImovelIdsForProperty(id);

    if (imovelIds.length === 0) {
      return res.json({
        type: 'FeatureCollection',
        name: 'Linha_amarela_filtrada',
        features: []
      });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const geojson = JSON.parse(raw);
    const features = Array.isArray(geojson?.features) ? geojson.features : [];

    const filteredFeatures = features.filter((feature) => {
      const identificador = feature?.properties?.identificador_lote;
      return imovelIds.includes(String(identificador));
    });

    res.json({
      ...geojson,
      type: 'FeatureCollection',
      name: 'Linha_amarela_filtrada',
      features: filteredFeatures
    });
  } catch (error) {
    console.error('Erro ao carregar Linha Amarela filtrada:', error);
    res.status(500).json({ error: 'Erro ao carregar camada Linha Amarela da propriedade' });
  }
});

/**
 * Rota para listar municípios disponíveis
 */
app.get('/api/municipios', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT municipio FROM properties ORDER BY municipio').all();
    const municipios = rows.map((row, index) => ({
      id: row.municipio.toLowerCase(),
      nome: row.municipio
    }));
    res.json(municipios);
  } catch (error) {
    console.error('Erro ao buscar municípios:', error);
    res.status(500).json({ error: 'Erro ao buscar municípios' });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando corretamente' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);
});
