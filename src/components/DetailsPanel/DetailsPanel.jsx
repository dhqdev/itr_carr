import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ITRTab from './ITRTab';
import CARTab from './CARTab';
import ActionFooter from './ActionFooter';
import './DetailsPanel.css';

/**
 * COLUNA 3: Painel de Detalhes e Ação
 * 
 * Componente principal que contém:
 * - Header com dados do proprietário
 * - Tabs ITR (Fiscal) e CAR (Ambiental)
 * - Footer com botões de ação
 */
function DetailsPanel({ property }) {
  const [activeTab, setActiveTab] = useState('itr'); // 'itr' ou 'car'

  if (!property) {
    return (
      <div className="details-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px', flexDirection: 'column', gap: '8px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span>Selecione uma propriedade</span>
      </div>
    );
  }

  return (
    <div className="details-panel">
      {/* Header fixo com perfil */}
      <ProfileHeader property={property} />

      {/* Tabs de navegação */}
      <div className="details-tabs">
        <button
          className={`tab-btn ${activeTab === 'itr' ? 'active' : ''}`}
          onClick={() => setActiveTab('itr')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>ITR (Fiscal)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'car' ? 'active' : ''}`}
          onClick={() => setActiveTab('car')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path 
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>CAR (Ambiental)</span>
        </button>
      </div>

      {/* Conteúdo scrollável das tabs */}
      <div className="details-content scroll-container">
        {activeTab === 'itr' ? (
          <ITRTab property={property} />
        ) : (
          <CARTab property={property} />
        )}
      </div>

      {/* Footer fixo com ações */}
      <ActionFooter property={property} />
    </div>
  );
}

export default DetailsPanel;
