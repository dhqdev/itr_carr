/**
 * DADOS ESTÁTICOS - Substitui o SQLite para deployment serverless (Vercel)
 * Senhas criptografadas com bcrypt (custo 10)
 * admin123, auditor123, analista123
 */

const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$qBYqg4zgYOR.7eKoOz1DquHRxrgOD1gP1aCtL8kfjjhsM5RTMvQUy',
    name: 'Administrador Sistema',
    role: 'Administrador'
  },
  {
    id: 2,
    username: 'auditor',
    password: '$2b$10$ElJh2NwaT3uCw8.hveOZv.VlwPs4/jiNN.DB4QSiH0aRbdtZG70DG',
    name: 'Maria Oliveira',
    role: 'Auditor Fiscal'
  },
  {
    id: 3,
    username: 'analista',
    password: '$2b$10$YNlaxf71md2qjLdgkUnWZOKsWc/Z78mnzK/jsj1QfScFoLiZxW2F6',
    name: 'João Santos',
    role: 'Analista Ambiental'
  }
];

const properties = [
  {
    id: 'prop_001',
    municipio: 'Campinas',
    proprietario: {
      nome: 'Roberto Almeida Silva',
      tipo_pessoa: 'PF',
      documento: '123.456.789-00'
    },
    imovel: {
      nome: 'Fazenda Santa Fé',
      area_total_ha: 150.5,
      coordenadas_centro: { lat: -23.1234, lng: -47.1234 },
      poligono: [
        [-47.1234, -23.1234],
        [-47.1200, -23.1234],
        [-47.1200, -23.1200],
        [-47.1234, -23.1200],
        [-47.1234, -23.1234]
      ],
      area_divergente: [
        [-47.1220, -23.1220],
        [-47.1200, -23.1220],
        [-47.1200, -23.1200],
        [-47.1220, -23.1200],
        [-47.1220, -23.1220]
      ]
    },
    status_auditoria: 'divergencia_alta',
    itr_dados: {
      vtn_declarado_hectare: 5000.0,
      vtn_referencia_prefeitura: 18000.0,
      gu_grau_utilizacao: 25.0,
      imposto_projetado: 12500.0,
      potencial_incremento_arrecadacao: 32000.0,
      ano_exercicio: 2024
    },
    car_dados: {
      status_cadastro: 'ativo',
      reserva_legal_pct: 15.0,
      reserva_legal_exigida: 20.0,
      passivo_ambiental: true,
      credito_carbono: false,
      area_preservacao_permanente_ha: 8.5,
      data_cadastro: '2020-03-15'
    },
    historico: {
      data_imagem_satelite: '2025-01-10',
      observacao:
        'Área de pastagem declarada como floresta nativa. Subdeclaração de VTN em 72%. Prioridade máxima de fiscalização.'
    },
    geometry_wkt: null
  },
  {
    id: 'prop_002',
    municipio: 'Campinas',
    proprietario: {
      nome: 'Agroindústria Verde Ltda',
      tipo_pessoa: 'PJ',
      documento: '12.345.678/0001-99'
    },
    imovel: {
      nome: 'Estância Rio Claro',
      area_total_ha: 320.0,
      coordenadas_centro: { lat: -23.1288, lng: -47.129 },
      poligono: [
        [-47.129, -23.1288],
        [-47.125, -23.1288],
        [-47.125, -23.125],
        [-47.129, -23.125],
        [-47.129, -23.1288]
      ],
      area_divergente: null
    },
    status_auditoria: 'validado',
    itr_dados: {
      vtn_declarado_hectare: 17500.0,
      vtn_referencia_prefeitura: 18000.0,
      gu_grau_utilizacao: 85.0,
      imposto_projetado: 45000.0,
      potencial_incremento_arrecadacao: 0.0,
      ano_exercicio: 2024
    },
    car_dados: {
      status_cadastro: 'ativo',
      reserva_legal_pct: 22.0,
      reserva_legal_exigida: 20.0,
      passivo_ambiental: false,
      credito_carbono: true,
      area_preservacao_permanente_ha: 45.2,
      data_cadastro: '2018-06-10'
    },
    historico: {
      data_imagem_satelite: '2025-01-10',
      observacao:
        'Propriedade modelo. Alta produtividade e conformidade ambiental. Elegível para certificação de créditos de carbono.'
    },
    geometry_wkt: null
  },
  {
    id: 'prop_003',
    municipio: 'Campinas',
    proprietario: {
      nome: 'Carlos Dummont',
      tipo_pessoa: 'PF',
      documento: '987.654.321-11'
    },
    imovel: {
      nome: 'Sítio Recanto',
      area_total_ha: 45.0,
      coordenadas_centro: { lat: -23.11, lng: -47.11 },
      poligono: [
        [-47.11, -23.11],
        [-47.108, -23.11],
        [-47.108, -23.108],
        [-47.11, -23.108],
        [-47.11, -23.11]
      ],
      area_divergente: [
        [-47.1095, -23.1095],
        [-47.1085, -23.1095],
        [-47.1085, -23.1085],
        [-47.1095, -23.1085],
        [-47.1095, -23.1095]
      ]
    },
    status_auditoria: 'atencao',
    itr_dados: {
      vtn_declarado_hectare: 12000.0,
      vtn_referencia_prefeitura: 15000.0,
      gu_grau_utilizacao: 40.0,
      imposto_projetado: 1800.0,
      potencial_incremento_arrecadacao: 450.0,
      ano_exercicio: 2024
    },
    car_dados: {
      status_cadastro: 'pendente',
      reserva_legal_pct: 10.0,
      reserva_legal_exigida: 20.0,
      passivo_ambiental: true,
      credito_carbono: false,
      area_preservacao_permanente_ha: 2.1,
      data_cadastro: '2022-11-20'
    },
    historico: {
      data_imagem_satelite: '2025-01-10',
      observacao:
        'Necessária recomposição de mata ciliar. Reserva legal 50% abaixo do exigido. Cadastro CAR pendente de validação.'
    },
    geometry_wkt: null
  },
  {
    id: 'prop_004',
    municipio: 'Vinhedo',
    proprietario: {
      nome: 'Vinícola Terras Altas S.A.',
      tipo_pessoa: 'PJ',
      documento: '23.456.789/0001-10'
    },
    imovel: {
      nome: 'Vinhedo Monte Verde',
      area_total_ha: 89.3,
      coordenadas_centro: { lat: -23.03, lng: -46.98 },
      poligono: [
        [-46.98, -23.03],
        [-46.975, -23.03],
        [-46.975, -23.025],
        [-46.98, -23.025],
        [-46.98, -23.03]
      ],
      area_divergente: null
    },
    status_auditoria: 'validado',
    itr_dados: {
      vtn_declarado_hectare: 25000.0,
      vtn_referencia_prefeitura: 24500.0,
      gu_grau_utilizacao: 92.0,
      imposto_projetado: 18500.0,
      potencial_incremento_arrecadacao: 0.0,
      ano_exercicio: 2024
    },
    car_dados: {
      status_cadastro: 'ativo',
      reserva_legal_pct: 20.0,
      reserva_legal_exigida: 20.0,
      passivo_ambiental: false,
      credito_carbono: false,
      area_preservacao_permanente_ha: 12.8,
      data_cadastro: '2019-02-14'
    },
    historico: {
      data_imagem_satelite: '2025-01-10',
      observacao: 'Propriedade em perfeita conformidade. Cultivo de vinhas com práticas sustentáveis.'
    },
    geometry_wkt: null
  },
  {
    id: 'prop_005',
    municipio: 'Campinas',
    proprietario: {
      nome: 'Maria Santos Oliveira',
      tipo_pessoa: 'PF',
      documento: '456.789.123-00'
    },
    imovel: {
      nome: 'Chácara Bela Vista',
      area_total_ha: 28.7,
      coordenadas_centro: { lat: -23.14, lng: -47.15 },
      poligono: [
        [-47.15, -23.14],
        [-47.148, -23.14],
        [-47.148, -23.138],
        [-47.15, -23.138],
        [-47.15, -23.14]
      ],
      area_divergente: [
        [-47.1495, -23.1395],
        [-47.1485, -23.1395],
        [-47.1485, -23.1385],
        [-47.1495, -23.1385],
        [-47.1495, -23.1395]
      ]
    },
    status_auditoria: 'divergencia_alta',
    itr_dados: {
      vtn_declarado_hectare: 8000.0,
      vtn_referencia_prefeitura: 22000.0,
      gu_grau_utilizacao: 15.0,
      imposto_projetado: 950.0,
      potencial_incremento_arrecadacao: 8500.0,
      ano_exercicio: 2024
    },
    car_dados: {
      status_cadastro: 'ativo',
      reserva_legal_pct: 12.0,
      reserva_legal_exigida: 20.0,
      passivo_ambiental: true,
      credito_carbono: false,
      area_preservacao_permanente_ha: 1.5,
      data_cadastro: '2021-08-30'
    },
    historico: {
      data_imagem_satelite: '2025-01-10',
      observacao: 'VTN subdeclarado em 64%. Propriedade subutilizada. Possível especulação imobiliária.'
    },
    geometry_wkt: null
  }
];

module.exports = { users, properties };
