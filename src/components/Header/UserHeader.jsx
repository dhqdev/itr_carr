import React, { useState } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import './UserHeader.css';

const UserHeader = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleColor = (role) => {
    const colors = {
      'Administrador': '#667eea',
      'Auditor Fiscal': '#f59e0b',
      'Analista Ambiental': '#10b981'
    };
    return colors[role] || '#6b7280';
  };

  return (
    <div className="user-header">
      {/* Brand / Logo */}
      <div className="user-header-brand">
        <div className="user-header-logo">ITR</div>
        <span className="user-header-title">CAR</span>
        <span className="user-header-subtitle">Auditoria Inteligente</span>
      </div>

      <div className="user-info-container">
        <button 
          className="user-trigger"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div 
            className="user-avatar"
            style={{ background: getRoleColor(user.role) }}
          >
            {getInitials(user.name)}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <ChevronDown 
            size={16} 
            className={`chevron ${showDropdown ? 'open' : ''}`}
          />
        </button>

        {showDropdown && (
          <>
            <div 
              className="dropdown-overlay"
              onClick={() => setShowDropdown(false)}
            />
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div 
                  className="dropdown-avatar"
                  style={{ background: getRoleColor(user.role) }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="dropdown-info">
                  <strong>{user.name}</strong>
                  <span>{user.role}</span>
                  <span className="dropdown-username">@{user.username}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <User size={18} />
                  <span>Meu Perfil</span>
                </button>
                <button className="dropdown-item">
                  <Settings size={18} />
                  <span>Configurações</span>
                </button>
              </div>

              <div className="dropdown-divider" />

              <button 
                className="dropdown-item logout"
                onClick={() => {
                  setShowDropdown(false);
                  onLogout();
                }}
              >
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserHeader;
