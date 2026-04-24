import React, { useState, useMemo, useEffect } from 'react';
import Login from './components/Login/Login';
import UserHeader from './components/Header/UserHeader';
import Sidebar from './components/Sidebar/Sidebar';
import RealMapView from './components/MapView/RealMapView';
import DetailsPanel from './components/DetailsPanel/DetailsPanel';
import API_BASE from './config/apiConfig';
import './App.css';

/**
 * APLICAÇÃO PRINCIPAL - ITR/CAR Dashboard
 * 
 * Arquitetura: Single Page Application com 3 colunas
 * - Coluna 1: Sidebar (20-25%)
 * - Coluna 2: Mapa (50-55%)
 * - Coluna 3: Detalhes (20-25%)
 * 
 * Features:
 * - Sistema de autenticação
 * - Análise PRO com IA
 * - Gestão de usuários e perfis
 */
function App() {
  // Estado de autenticação
  const [user, setUser] = useState(null);

  // Estado global da aplicação
  const [selectedMunicipio, setSelectedMunicipio] = useState('Campinas');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para dados da API
  const [properties, setProperties] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega propriedades e municípios do banco de dados
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Busca todas as propriedades
        const propertiesResponse = await fetch(`${API_BASE}/api/properties`);
        const propertiesData = await propertiesResponse.json();
        setProperties(propertiesData);

        // Busca municípios
        const municipiosResponse = await fetch(`${API_BASE}/api/municipios`);
        const municipiosData = await municipiosResponse.json();
        setMunicipios(municipiosData);

        // Seleciona a primeira propriedade como padrão
        if (propertiesData.length > 0) {
          setSelectedProperty(propertiesData[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  /**
   * Filtra propriedades por município e termo de busca
   */
  const filteredProperties = useMemo(() => {
    let filtered = properties.filter(
      prop => prop.municipio === selectedMunicipio
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prop =>
        prop.proprietario.nome.toLowerCase().includes(query) ||
        prop.proprietario.documento.includes(query) ||
        prop.imovel.nome.toLowerCase().includes(query)
      );
    }

    // Ordena por prioridade de auditoria
    const priorityOrder = {
      'divergencia_alta': 1,
      'atencao': 2,
      'validado': 3
    };

    return filtered.sort((a, b) => 
      priorityOrder[a.status_auditoria] - priorityOrder[b.status_auditoria]
    );
  }, [properties, selectedMunicipio, searchQuery]);

  /**
   * Handler para seleção de propriedade
   */
  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
  };

  /**
   * Handler para mudança de município
   */
  const handleMunicipioChange = (municipio) => {
    setSelectedMunicipio(municipio);
    // Seleciona a primeira propriedade do novo município
    const firstProperty = properties.find(p => p.municipio === municipio);
    if (firstProperty) {
      setSelectedProperty(firstProperty);
    }
  };

  /**
   * Handler para login
   */
  const handleLogin = (userData) => {
    setUser(userData);
  };

  /**
   * Handler para logout
   */
  const handleLogout = () => {
    setUser(null);
    setProperties([]);
    setMunicipios([]);
    setSelectedProperty(null);
    setSearchQuery('');
    setMobileTab('lista');
  };

  // Estado da aba ativa no mobile
  const [mobileTab, setMobileTab] = useState('lista');

  // Quando seleciona propriedade no mobile, vai pro mapa automaticamente
  const handlePropertySelectMobile = (property) => {
    handlePropertySelect(property);
    setMobileTab('mapa');
  };

  // Tela de login se não estiver autenticado
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Tela de carregamento
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Header com informações do usuário */}
      <UserHeader user={user} onLogout={handleLogout} />

      {/* Layout desktop: 3 colunas */}
      <div className="app app-desktop">
        <Sidebar
          municipios={municipios}
          selectedMunicipio={selectedMunicipio}
          onMunicipioChange={handleMunicipioChange}
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onPropertySelect={handlePropertySelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <RealMapView property={selectedProperty} />
        <DetailsPanel property={selectedProperty} />
      </div>

      {/* Layout mobile: uma coluna + abas na base */}
      <div className="app-mobile">
        <div className="mobile-panel" style={{ display: mobileTab === 'lista' ? 'flex' : 'none' }}>
          <Sidebar
            municipios={municipios}
            selectedMunicipio={selectedMunicipio}
            onMunicipioChange={handleMunicipioChange}
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertySelectMobile}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div className="mobile-panel" style={{ display: mobileTab === 'mapa' ? 'flex' : 'none' }}>
          <RealMapView property={selectedProperty} />
        </div>
        <div className="mobile-panel" style={{ display: mobileTab === 'detalhes' ? 'flex' : 'none' }}>
          <DetailsPanel property={selectedProperty} />
        </div>

        {/* Barra de navegação inferior */}
        <nav className="mobile-tab-bar">
          <button
            className={`mobile-tab-btn${mobileTab === 'lista' ? ' active' : ''}`}
            onClick={() => setMobileTab('lista')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>Propriedades</span>
          </button>
          <button
            className={`mobile-tab-btn${mobileTab === 'mapa' ? ' active' : ''}`}
            onClick={() => setMobileTab('mapa')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <span>Mapa</span>
          </button>
          <button
            className={`mobile-tab-btn${mobileTab === 'detalhes' ? ' active' : ''}`}
            onClick={() => setMobileTab('detalhes')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Detalhes</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
