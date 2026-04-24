import React from 'react';
import './CARTab.css';

/**
 * CARTab Component - Aba de dados ambientais (CAR)
 */
function CARTab({ property }) {
  if (!property) return null;
  const car = property.car_dados;
  const reservaDeficit = car.reserva_legal_exigida - car.reserva_legal_pct;
  const hasDeficit = reservaDeficit > 0;

  return (
    <div className="car-tab">
      {/* Card de Status do CAR */}
      <div className="data-card">
        <div className="card-header">
          <h3>Status do Cadastro</h3>
          <span 
            className={`status-badge ${car.status_cadastro}`}
          >
            {car.status_cadastro === 'ativo' ? 'Ativo' : 'Pendente'}
          </span>
        </div>

        <div className="car-info-grid">
          <div className="car-info-item">
            <label>Data de Cadastro</label>
            <span>
              {new Date(car.data_cadastro).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="car-info-item">
            <label>Área Total</label>
            <span>{property.imovel.area_total_ha} hectares</span>
          </div>

          <div className="car-info-item">
            <label>APP Preservada</label>
            <span>{car.area_preservacao_permanente_ha} ha</span>
          </div>
        </div>
      </div>

      {/* Card de Reserva Legal */}
      <div className={`data-card ${hasDeficit ? 'alert' : ''}`}>
        <div className="card-header">
          <h3>Reserva Legal</h3>
        </div>

        <div className="reserva-comparison">
          <div className="reserva-item">
            <label>Preservada Atualmente</label>
            <div className="reserva-percentage atual">
              {car.reserva_legal_pct}%
              <span className="reserva-hectares">
                ({(property.imovel.area_total_ha * car.reserva_legal_pct / 100).toFixed(1)} ha)
              </span>
            </div>
          </div>

          <div className="reserva-vs">vs</div>

          <div className="reserva-item">
            <label>Exigida por Lei</label>
            <div className="reserva-percentage exigida">
              {car.reserva_legal_exigida}%
              <span className="reserva-hectares">
                ({(property.imovel.area_total_ha * car.reserva_legal_exigida / 100).toFixed(1)} ha)
              </span>
            </div>
          </div>
        </div>

        {/* Barra visual */}
        <div className="reserva-bar">
          <div 
            className="reserva-bar-fill"
            style={{ 
              width: `${(car.reserva_legal_pct / car.reserva_legal_exigida) * 100}%`,
              background: hasDeficit ? '#ef4444' : '#10b981'
            }}
          >
            <span className="reserva-bar-label">{car.reserva_legal_pct}%</span>
          </div>
          <div className="reserva-bar-target" style={{ left: '100%' }}>
            <span>{car.reserva_legal_exigida}%</span>
          </div>
        </div>

        {hasDeficit && (
          <div className="deficit-alert">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <div>
              <strong>Déficit de Reserva Legal</strong>
              <p>
                Necessário recompor <strong>{reservaDeficit.toFixed(1)}%</strong> da área 
                ({(property.imovel.area_total_ha * reservaDeficit / 100).toFixed(1)} ha)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Card de Passivo Ambiental */}
      <div className={`data-card ${car.passivo_ambiental ? 'warning-card' : ''}`}>
        <div className="card-header">
          <h3>Passivo Ambiental</h3>
          <div className={`toggle-indicator ${car.passivo_ambiental ? 'active' : ''}`}>
            {car.passivo_ambiental ? (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>Sim</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Não</span>
              </>
            )}
          </div>
        </div>

        {car.passivo_ambiental ? (
          <div className="info-box warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>
              Propriedade possui pendências ambientais. Necessária regularização junto aos órgãos competentes.
            </p>
          </div>
        ) : (
          <div className="info-box success">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <p>
              Propriedade sem pendências ambientais registradas.
            </p>
          </div>
        )}
      </div>

      {/* Card de Crédito de Carbono */}
      <div className="data-card">
        <div className="card-header">
          <h3>Crédito de Carbono</h3>
          <div className={`toggle-indicator ${car.credito_carbono ? 'active success' : ''}`}>
            {car.credito_carbono ? (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Elegível</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Não Elegível</span>
              </>
            )}
          </div>
        </div>

        {car.credito_carbono ? (
          <div className="credito-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path 
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>
              Propriedade elegível para comercialização de créditos de carbono. Áreas de preservação podem gerar receita adicional.
            </p>
          </div>
        ) : (
          <div className="credito-info neutral">
            <p>
              Para ser elegível, a propriedade deve manter reserva legal acima do mínimo exigido e sem passivos ambientais.
            </p>
          </div>
        )}
      </div>

      {/* Recomendações */}
      <div className="data-card recomendacoes">
        <div className="card-header">
          <h3>Recomendações</h3>
        </div>

        <ul className="recomendacoes-list">
          {hasDeficit && (
            <li className="recomendacao-item urgent">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">!</text>
              </svg>
              <span>Recompor {reservaDeficit.toFixed(1)}% de reserva legal urgentemente</span>
            </li>
          )}
          
          {car.passivo_ambiental && (
            <li className="recomendacao-item urgent">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">!</text>
              </svg>
              <span>Regularizar pendências ambientais junto ao órgão ambiental</span>
            </li>
          )}

          {car.status_cadastro === 'pendente' && (
            <li className="recomendacao-item warning">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">?</text>
              </svg>
              <span>Validar cadastro CAR para evitar sanções</span>
            </li>
          )}

          {!hasDeficit && !car.passivo_ambiental && (
            <li className="recomendacao-item success">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Propriedade em conformidade ambiental</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default CARTab;
