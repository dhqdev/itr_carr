import React from 'react';
import './ITRTab.css';

/**
 * ITRTab Component - Aba de dados fiscais (ITR)
 */
function ITRTab({ property }) {
  if (!property) return null;
  const itr = property.itr_dados;
  const percentageDiff = ((itr.vtn_declarado_hectare / itr.vtn_referencia_prefeitura) * 100 - 100).toFixed(1);
  const isSubdeclarado = percentageDiff < -5;

  return (
    <div className="itr-tab">
      {/* Card de Valor da Terra Nua */}
      <div className="data-card">
        <div className="card-header">
          <h3>Valor da Terra Nua (VTN)</h3>
          <span className="card-year">Exercício {itr.ano_exercicio}</span>
        </div>

        <div className="vtn-comparison">
          <div className="vtn-item">
            <label>Declarado pelo Contribuinte</label>
            <div className="vtn-value declarado">
              R$ {itr.vtn_declarado_hectare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span>/ha</span>
            </div>
          </div>

          <div className="vtn-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="vtn-item">
            <label>Referência (Prefeitura)</label>
            <div className="vtn-value referencia">
              R$ {itr.vtn_referencia_prefeitura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span>/ha</span>
            </div>
          </div>
        </div>

        {/* Barra comparativa */}
        <div className="vtn-bar">
          <div 
            className="vtn-bar-fill"
            style={{ 
              width: `${(itr.vtn_declarado_hectare / itr.vtn_referencia_prefeitura) * 100}%`,
              background: isSubdeclarado ? '#ef4444' : '#10b981'
            }}
          />
        </div>

        {isSubdeclarado && (
          <div className="vtn-alert">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>
              Subdeclaração de <strong>{Math.abs(percentageDiff)}%</strong> em relação ao valor de referência
            </span>
          </div>
        )}
      </div>

      {/* Card de Grau de Utilização */}
      <div className="data-card">
        <div className="card-header">
          <h3>Grau de Utilização (GU)</h3>
          <div className="gu-percentage">{itr.gu_grau_utilizacao}%</div>
        </div>

        <div className="gu-bar">
          <div 
            className="gu-bar-fill"
            style={{ 
              width: `${itr.gu_grau_utilizacao}%`,
              background: itr.gu_grau_utilizacao < 30 ? '#ef4444' : 
                         itr.gu_grau_utilizacao < 65 ? '#f59e0b' : '#10b981'
            }}
          />
        </div>

        <div className="gu-scale">
          <div className="gu-scale-item">
            <div className="gu-scale-dot" style={{ background: '#ef4444' }}></div>
            <span>&lt; 30% (Baixo)</span>
          </div>
          <div className="gu-scale-item">
            <div className="gu-scale-dot" style={{ background: '#f59e0b' }}></div>
            <span>30-65% (Médio)</span>
          </div>
          <div className="gu-scale-item">
            <div className="gu-scale-dot" style={{ background: '#10b981' }}></div>
            <span>&gt; 65% (Alto)</span>
          </div>
        </div>

        {itr.gu_grau_utilizacao < 30 && (
          <div className="info-box warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>Propriedade subutilizada. Pode indicar terra improdutiva ou especulação imobiliária.</p>
          </div>
        )}
      </div>

      {/* Card de Potencial de Arrecadação */}
      <div className="data-card highlight">
        <div className="card-header">
          <h3>Potencial de Arrecadação</h3>
        </div>

        <div className="arrecadacao-grid">
          <div className="arrecadacao-item">
            <label>Imposto Projetado</label>
            <div className="valor-grande">
              R$ {itr.imposto_projetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="arrecadacao-divider"></div>

          <div className="arrecadacao-item">
            <label>Incremento Potencial</label>
            <div 
              className="valor-grande incremento"
              style={{ 
                color: itr.potencial_incremento_arrecadacao > 0 ? '#10b981' : '#6b7280'
              }}
            >
              + R$ {itr.potencial_incremento_arrecadacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {itr.potencial_incremento_arrecadacao > 10000 && (
          <div className="info-box success">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <p>
              <strong>Alto potencial de recuperação fiscal.</strong> Recomendada fiscalização prioritária.
            </p>
          </div>
        )}
      </div>

      {/* Observação */}
      {property.historico.observacao && (
        <div className="data-card observacao">
          <div className="card-header">
            <h3>Observações da Análise</h3>
          </div>
          <p>{property.historico.observacao}</p>
        </div>
      )}
    </div>
  );
}

export default ITRTab;
