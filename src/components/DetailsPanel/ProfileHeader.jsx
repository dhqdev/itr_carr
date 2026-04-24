import React from 'react';
import { statusConfig } from '../../config/statusConfig';
import './ProfileHeader.css';

/**
 * ProfileHeader Component - Cabeçalho com dados do proprietário
 */
function ProfileHeader({ property }) {
  if (!property) return null;
  const status = statusConfig[property.status_auditoria];

  return (
    <div className="profile-header">
      {/* Avatar com inicial */}
      <div className="profile-avatar">
        {property.proprietario.nome.charAt(0).toUpperCase()}
      </div>

      {/* Informações do proprietário */}
      <div className="profile-info">
        <h2 className="profile-name">{property.proprietario.nome}</h2>
        <div className="profile-meta">
          <span className="profile-type">
            {property.proprietario.tipo_pessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </span>
          <span className="profile-separator">•</span>
          <span className="profile-doc">{property.proprietario.documento}</span>
        </div>
      </div>

      {/* Badge de status */}
      <div 
        className="profile-status-badge"
        style={{ 
          backgroundColor: status.bgColor,
          color: status.color
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          {status.icon === 'AlertCircle' && (
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          )}
          {status.icon === 'AlertTriangle' && (
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          )}
          {status.icon === 'CheckCircle' && (
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          )}
        </svg>
        {status.label}
      </div>

      {/* Informação adicional */}
      <div className="profile-property">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <strong>{property.imovel.nome}</strong>
          <span>{property.imovel.area_total_ha} hectares</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
