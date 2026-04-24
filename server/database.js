const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Inicializa o banco de dados
const db = new Database(path.join(__dirname, 'itr_car.db'));

// Habilita foreign keys
db.pragma('foreign_keys = ON');

// Mesmo mapeamento usado na migração de geometrias (server/migrate_geometries.js)
const propertyToLoteMapping = {
  prop_001: 'BA-2902005-AD06AC9BEE924477AA13EFE0908D15E0',
  prop_002: 'SC-4210100-EA1F3824FC3D4148B83F921E253C6DCD',
  prop_003: 'RJ-3301009-DC994438D87A4CE29E7EECC060BB792E',
  prop_004: 'PI-2200806-97CAEADC4E0A46F5BDB3374851967EDB',
  prop_005: 'PR-4127965-5B8ED84AA1A94E6399506A04DE910B83'
};

function ensureGeometryWktColumn() {
  try {
    db.exec('ALTER TABLE properties ADD COLUMN geometry_wkt TEXT;');
    console.log('✓ Coluna geometry_wkt adicionada');
  } catch (e) {
    if (String(e?.message || '').includes('duplicate column name')) {
      // já existe
    } else {
      throw e;
    }
  }
}

function extractGeometryFromCleanJson(geometryData, loteId) {
  const loteData = geometryData?.[loteId];
  const resultados = loteData?.result;
  if (!Array.isArray(resultados)) return null;

  // Prioridade de temas para pegar a geometria
  const temaPrioridade = [
    'Área do Imovel',
    'Área Líquida do Imóvel',
    'APP Total',
    'Área Consolidada',
    'Área de Reserva Legal Total',
    'Reserva Legal Proposta'
  ];

  for (const tema of temaPrioridade) {
    for (const item of resultados) {
      if (item?.tema === tema && typeof item?.geoareatema === 'string' && item.geoareatema.trim()) {
        return item.geoareatema;
      }
    }
  }

  // Se não encontrou, pega o primeiro que tiver geometria (geoareatema ou areatotal)
  for (const item of resultados) {
    if (typeof item?.geoareatema === 'string' && item.geoareatema.trim()) {
      return item.geoareatema;
    }
    if (typeof item?.areatotal === 'string' && item.areatotal.trim()) {
      return item.areatotal;
    }
    if (typeof item?.poligonoAreaImovel === 'string' && item.poligonoAreaImovel.trim()) {
      return item.poligonoAreaImovel;
    }
  }

  return null;
}

function migrateMissingGeometriesIfNeeded() {
  ensureGeometryWktColumn();

  const jsonPath = path.join(__dirname, '..', 'terrein search', 'imovel_dados_clean.json');
  if (!require('fs').existsSync(jsonPath)) {
    console.log('ℹ️  imovel_dados_clean.json não encontrado; pulando migração de geometry_wkt');
    return;
  }

  let geometryData;
  try {
    geometryData = JSON.parse(require('fs').readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.log('ℹ️  Falha ao ler imovel_dados_clean.json; pulando migração de geometry_wkt');
    return;
  }

  const selectStmt = db.prepare('SELECT geometry_wkt FROM properties WHERE id = ?');
  const updateStmt = db.prepare('UPDATE properties SET geometry_wkt = ? WHERE id = ?');

  let updated = 0;
  for (const [propId, loteId] of Object.entries(propertyToLoteMapping)) {
    const current = selectStmt.get(propId);
    const alreadyHas = typeof current?.geometry_wkt === 'string' && current.geometry_wkt.trim();
    if (alreadyHas) continue;

    const wkt = extractGeometryFromCleanJson(geometryData, loteId);
    if (typeof wkt === 'string' && wkt.trim()) {
      updateStmt.run(wkt, propId);
      updated++;
    }
  }

  if (updated > 0) {
    console.log(`✓ geometry_wkt preenchido para ${updated} propriedade(s)`);
  }
}

/**
 * Cria as tabelas do banco de dados
 */
function initializeDatabase() {
  // Tabela de usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de propriedades
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      municipio TEXT NOT NULL,
      proprietario_nome TEXT NOT NULL,
      proprietario_tipo_pessoa TEXT NOT NULL,
      proprietario_documento TEXT NOT NULL,
      imovel_nome TEXT NOT NULL,
      imovel_area_total_ha REAL NOT NULL,
      imovel_coordenadas_centro_lat REAL NOT NULL,
      imovel_coordenadas_centro_lng REAL NOT NULL,
      imovel_poligono TEXT NOT NULL,
      imovel_area_divergente TEXT,
      status_auditoria TEXT NOT NULL,
      itr_vtn_declarado_hectare REAL NOT NULL,
      itr_vtn_referencia_prefeitura REAL NOT NULL,
      itr_gu_grau_utilizacao REAL NOT NULL,
      itr_imposto_projetado REAL NOT NULL,
      itr_potencial_incremento_arrecadacao REAL NOT NULL,
      itr_ano_exercicio INTEGER NOT NULL,
      car_status_cadastro TEXT NOT NULL,
      car_reserva_legal_pct REAL NOT NULL,
      car_reserva_legal_exigida REAL NOT NULL,
      car_passivo_ambiental BOOLEAN NOT NULL,
      car_credito_carbono BOOLEAN NOT NULL,
      car_area_preservacao_permanente_ha REAL NOT NULL,
      car_data_cadastro TEXT NOT NULL,
      historico_data_imagem_satelite TEXT NOT NULL,
      historico_observacao TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Banco de dados inicializado com sucesso!');
}

/**
 * Popula o banco de dados com dados iniciais
 */
function seedDatabase() {
  // Verifica se já existem dados
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('ℹ️  Banco de dados já contém dados.');
    return;
  }

  // Insere usuários com senhas criptografadas
  const users = [
    { username: 'admin', password: 'admin123', role: 'Administrador', name: 'Administrador Sistema' },
    { username: 'auditor', password: 'auditor123', role: 'Auditor Fiscal', name: 'Maria Oliveira' },
    { username: 'analista', password: 'analista123', role: 'Analista Ambiental', name: 'João Santos' }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role)
    VALUES (?, ?, ?, ?)
  `);

  users.forEach(user => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    insertUser.run(user.username, hashedPassword, user.name, user.role);
  });

  console.log('✅ Usuários inseridos com sucesso!');

  // Insere propriedades
  const properties = [
    {
      id: "prop_001",
      municipio: "Campinas",
      proprietario_nome: "Roberto Almeida Silva",
      proprietario_tipo_pessoa: "PF",
      proprietario_documento: "123.456.789-00",
      imovel_nome: "Fazenda Santa Fé",
      imovel_area_total_ha: 150.5,
      imovel_coordenadas_centro_lat: -23.1234,
      imovel_coordenadas_centro_lng: -47.1234,
      imovel_poligono: JSON.stringify([
        [-47.1234, -23.1234],
        [-47.1200, -23.1234],
        [-47.1200, -23.1200],
        [-47.1234, -23.1200],
        [-47.1234, -23.1234]
      ]),
      imovel_area_divergente: JSON.stringify([
        [-47.1220, -23.1220],
        [-47.1200, -23.1220],
        [-47.1200, -23.1200],
        [-47.1220, -23.1200],
        [-47.1220, -23.1220]
      ]),
      status_auditoria: "divergencia_alta",
      itr_vtn_declarado_hectare: 5000.00,
      itr_vtn_referencia_prefeitura: 18000.00,
      itr_gu_grau_utilizacao: 25.0,
      itr_imposto_projetado: 12500.00,
      itr_potencial_incremento_arrecadacao: 32000.00,
      itr_ano_exercicio: 2024,
      car_status_cadastro: "ativo",
      car_reserva_legal_pct: 15.0,
      car_reserva_legal_exigida: 20.0,
      car_passivo_ambiental: 1,
      car_credito_carbono: 0,
      car_area_preservacao_permanente_ha: 8.5,
      car_data_cadastro: "2020-03-15",
      historico_data_imagem_satelite: "2025-01-10",
      historico_observacao: "Área de pastagem declarada como floresta nativa. Subdeclaração de VTN em 72%. Prioridade máxima de fiscalização."
    },
    {
      id: "prop_002",
      municipio: "Campinas",
      proprietario_nome: "Agroindústria Verde Ltda",
      proprietario_tipo_pessoa: "PJ",
      proprietario_documento: "12.345.678/0001-99",
      imovel_nome: "Estância Rio Claro",
      imovel_area_total_ha: 320.0,
      imovel_coordenadas_centro_lat: -23.1288,
      imovel_coordenadas_centro_lng: -47.1290,
      imovel_poligono: JSON.stringify([
        [-47.1290, -23.1288],
        [-47.1250, -23.1288],
        [-47.1250, -23.1250],
        [-47.1290, -23.1250],
        [-47.1290, -23.1288]
      ]),
      imovel_area_divergente: null,
      status_auditoria: "validado",
      itr_vtn_declarado_hectare: 17500.00,
      itr_vtn_referencia_prefeitura: 18000.00,
      itr_gu_grau_utilizacao: 85.0,
      itr_imposto_projetado: 45000.00,
      itr_potencial_incremento_arrecadacao: 0.00,
      itr_ano_exercicio: 2024,
      car_status_cadastro: "ativo",
      car_reserva_legal_pct: 22.0,
      car_reserva_legal_exigida: 20.0,
      car_passivo_ambiental: 0,
      car_credito_carbono: 1,
      car_area_preservacao_permanente_ha: 45.2,
      car_data_cadastro: "2018-06-10",
      historico_data_imagem_satelite: "2025-01-10",
      historico_observacao: "Propriedade modelo. Alta produtividade e conformidade ambiental. Elegível para certificação de créditos de carbono."
    },
    {
      id: "prop_003",
      municipio: "Campinas",
      proprietario_nome: "Carlos Dummont",
      proprietario_tipo_pessoa: "PF",
      proprietario_documento: "987.654.321-11",
      imovel_nome: "Sítio Recanto",
      imovel_area_total_ha: 45.0,
      imovel_coordenadas_centro_lat: -23.1100,
      imovel_coordenadas_centro_lng: -47.1100,
      imovel_poligono: JSON.stringify([
        [-47.1100, -23.1100],
        [-47.1080, -23.1100],
        [-47.1080, -23.1080],
        [-47.1100, -23.1080],
        [-47.1100, -23.1100]
      ]),
      imovel_area_divergente: JSON.stringify([
        [-47.1095, -23.1095],
        [-47.1085, -23.1095],
        [-47.1085, -23.1085],
        [-47.1095, -23.1085],
        [-47.1095, -23.1095]
      ]),
      status_auditoria: "atencao",
      itr_vtn_declarado_hectare: 12000.00,
      itr_vtn_referencia_prefeitura: 15000.00,
      itr_gu_grau_utilizacao: 40.0,
      itr_imposto_projetado: 1800.00,
      itr_potencial_incremento_arrecadacao: 450.00,
      itr_ano_exercicio: 2024,
      car_status_cadastro: "pendente",
      car_reserva_legal_pct: 10.0,
      car_reserva_legal_exigida: 20.0,
      car_passivo_ambiental: 1,
      car_credito_carbono: 0,
      car_area_preservacao_permanente_ha: 2.1,
      car_data_cadastro: "2022-11-20",
      historico_data_imagem_satelite: "2025-01-10",
      historico_observacao: "Necessária recomposição de mata ciliar. Reserva legal 50% abaixo do exigido. Cadastro CAR pendente de validação."
    },
    {
      id: "prop_004",
      municipio: "Vinhedo",
      proprietario_nome: "Vinícola Terras Altas S.A.",
      proprietario_tipo_pessoa: "PJ",
      proprietario_documento: "23.456.789/0001-10",
      imovel_nome: "Vinhedo Monte Verde",
      imovel_area_total_ha: 89.3,
      imovel_coordenadas_centro_lat: -23.0300,
      imovel_coordenadas_centro_lng: -46.9800,
      imovel_poligono: JSON.stringify([
        [-46.9800, -23.0300],
        [-46.9750, -23.0300],
        [-46.9750, -23.0250],
        [-46.9800, -23.0250],
        [-46.9800, -23.0300]
      ]),
      imovel_area_divergente: null,
      status_auditoria: "validado",
      itr_vtn_declarado_hectare: 25000.00,
      itr_vtn_referencia_prefeitura: 24500.00,
      itr_gu_grau_utilizacao: 92.0,
      itr_imposto_projetado: 18500.00,
      itr_potencial_incremento_arrecadacao: 0.00,
      itr_ano_exercicio: 2024,
      car_status_cadastro: "ativo",
      car_reserva_legal_pct: 20.0,
      car_reserva_legal_exigida: 20.0,
      car_passivo_ambiental: 0,
      car_credito_carbono: 0,
      car_area_preservacao_permanente_ha: 12.8,
      car_data_cadastro: "2019-02-14",
      historico_data_imagem_satelite: "2025-01-10",
      historico_observacao: "Propriedade em perfeita conformidade. Cultivo de vinhas com práticas sustentáveis."
    },
    {
      id: "prop_005",
      municipio: "Campinas",
      proprietario_nome: "Maria Santos Oliveira",
      proprietario_tipo_pessoa: "PF",
      proprietario_documento: "456.789.123-00",
      imovel_nome: "Chácara Bela Vista",
      imovel_area_total_ha: 28.7,
      imovel_coordenadas_centro_lat: -23.1400,
      imovel_coordenadas_centro_lng: -47.1500,
      imovel_poligono: JSON.stringify([
        [-47.1500, -23.1400],
        [-47.1480, -23.1400],
        [-47.1480, -23.1380],
        [-47.1500, -23.1380],
        [-47.1500, -23.1400]
      ]),
      imovel_area_divergente: JSON.stringify([
        [-47.1495, -23.1395],
        [-47.1485, -23.1395],
        [-47.1485, -23.1385],
        [-47.1495, -23.1385],
        [-47.1495, -23.1395]
      ]),
      status_auditoria: "divergencia_alta",
      itr_vtn_declarado_hectare: 8000.00,
      itr_vtn_referencia_prefeitura: 22000.00,
      itr_gu_grau_utilizacao: 15.0,
      itr_imposto_projetado: 950.00,
      itr_potencial_incremento_arrecadacao: 8500.00,
      itr_ano_exercicio: 2024,
      car_status_cadastro: "ativo",
      car_reserva_legal_pct: 12.0,
      car_reserva_legal_exigida: 20.0,
      car_passivo_ambiental: 1,
      car_credito_carbono: 0,
      car_area_preservacao_permanente_ha: 1.5,
      car_data_cadastro: "2021-08-30",
      historico_data_imagem_satelite: "2025-01-10",
      historico_observacao: "VTN subdeclarado em 64%. Propriedade subutilizada. Possível especulação imobiliária."
    }
  ];

  const insertProperty = db.prepare(`
    INSERT INTO properties (
      id, municipio, proprietario_nome, proprietario_tipo_pessoa, proprietario_documento,
      imovel_nome, imovel_area_total_ha, imovel_coordenadas_centro_lat, imovel_coordenadas_centro_lng,
      imovel_poligono, imovel_area_divergente, status_auditoria,
      itr_vtn_declarado_hectare, itr_vtn_referencia_prefeitura, itr_gu_grau_utilizacao,
      itr_imposto_projetado, itr_potencial_incremento_arrecadacao, itr_ano_exercicio,
      car_status_cadastro, car_reserva_legal_pct, car_reserva_legal_exigida,
      car_passivo_ambiental, car_credito_carbono, car_area_preservacao_permanente_ha,
      car_data_cadastro, historico_data_imagem_satelite, historico_observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  properties.forEach(prop => {
    insertProperty.run(
      prop.id, prop.municipio, prop.proprietario_nome, prop.proprietario_tipo_pessoa, prop.proprietario_documento,
      prop.imovel_nome, prop.imovel_area_total_ha, prop.imovel_coordenadas_centro_lat, prop.imovel_coordenadas_centro_lng,
      prop.imovel_poligono, prop.imovel_area_divergente, prop.status_auditoria,
      prop.itr_vtn_declarado_hectare, prop.itr_vtn_referencia_prefeitura, prop.itr_gu_grau_utilizacao,
      prop.itr_imposto_projetado, prop.itr_potencial_incremento_arrecadacao, prop.itr_ano_exercicio,
      prop.car_status_cadastro, prop.car_reserva_legal_pct, prop.car_reserva_legal_exigida,
      prop.car_passivo_ambiental, prop.car_credito_carbono, prop.car_area_preservacao_permanente_ha,
      prop.car_data_cadastro, prop.historico_data_imagem_satelite, prop.historico_observacao
    );
  });

  console.log('✅ Propriedades inseridas com sucesso!');
}

/**
 * Converte linha do banco em objeto de propriedade
 */
function rowToProperty(row) {
  return {
    id: row.id,
    municipio: row.municipio,
    proprietario: {
      nome: row.proprietario_nome,
      tipo_pessoa: row.proprietario_tipo_pessoa,
      documento: row.proprietario_documento
    },
    imovel: {
      nome: row.imovel_nome,
      area_total_ha: row.imovel_area_total_ha,
      coordenadas_centro: {
        lat: row.imovel_coordenadas_centro_lat,
        lng: row.imovel_coordenadas_centro_lng
      },
      poligono: JSON.parse(row.imovel_poligono),
      area_divergente: row.imovel_area_divergente ? JSON.parse(row.imovel_area_divergente) : null
    },
    status_auditoria: row.status_auditoria,
    itr_dados: {
      vtn_declarado_hectare: row.itr_vtn_declarado_hectare,
      vtn_referencia_prefeitura: row.itr_vtn_referencia_prefeitura,
      gu_grau_utilizacao: row.itr_gu_grau_utilizacao,
      imposto_projetado: row.itr_imposto_projetado,
      potencial_incremento_arrecadacao: row.itr_potencial_incremento_arrecadacao,
      ano_exercicio: row.itr_ano_exercicio
    },
    car_dados: {
      status_cadastro: row.car_status_cadastro,
      reserva_legal_pct: row.car_reserva_legal_pct,
      reserva_legal_exigida: row.car_reserva_legal_exigida,
      passivo_ambiental: row.car_passivo_ambiental === 1,
      credito_carbono: row.car_credito_carbono === 1,
      area_preservacao_permanente_ha: row.car_area_preservacao_permanente_ha,
      data_cadastro: row.car_data_cadastro
    },
    historico: {
      data_imagem_satelite: row.historico_data_imagem_satelite,
      observacao: row.historico_observacao
    },
    geometry_wkt: row.geometry_wkt || null
  };
}

// Inicializa e popula o banco
initializeDatabase();
seedDatabase();
migrateMissingGeometriesIfNeeded();

module.exports = {
  db,
  rowToProperty
};
