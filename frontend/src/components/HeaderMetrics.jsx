import React from 'react';

export default function HeaderMetrics() {
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Top Banner */}
      <div className="soc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '2.2rem',
            filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.4))',
            flexShrink: 0
          }}>
            🛡️
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{
              color: '#38bdf8',
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              PhishHunter: Detector de Phishing y Códigos QR Falsos
            </h1>
            <p style={{ color: '#94a3b8', margin: '6px 0 0 0', fontSize: '0.98rem' }}>
              Escanea códigos QR o analiza enlaces web al instante para comprobar su autenticidad y navegar de forma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
