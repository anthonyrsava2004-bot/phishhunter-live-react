import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Layers, Award, Shield } from 'lucide-react';

export default function HeaderMetrics({ stats }) {
  const safeStats = stats || {
    total_inspections: 0,
    critical_count: 0,
    suspicious_count: 0,
    safe_count: 0,
    average_score: 0
  };

  // Convert risk score to reliability score (e.g. 0-100 risk score -> safety level)
  const avgRisk = safeStats.average_score || 0;
  const isHealthy = avgRisk < 30;

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Top Banner */}
      <div className="soc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '2.5rem',
            filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.4))',
            flexShrink: 0
          }}>
            🛡️
          </div>
          <div>
            <h1 style={{
              color: '#38bdf8',
              margin: 0,
              fontSize: '1.85rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              PhishHunter: Detector de Phishing y Códigos QR Falsos
            </h1>
            <p style={{ color: '#94a3b8', margin: '6px 0 0 0', fontSize: '0.98rem' }}>
              Escanea códigos QR o analiza enlaces web al instante para comprobar su autenticidad y navegar de forma segura.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Scanned */}
        <div className="soc-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Enlaces Escaneados
            </span>
            <Layers size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {safeStats.total_inspections}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Análisis realizados
          </div>
        </div>

        {/* Critical Threats */}
        <div className="soc-card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>
              Amenazas Peligrosas
            </span>
            <ShieldAlert size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '8px' }}>
            {safeStats.critical_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', opacity: 0.8, marginTop: '4px' }}>
            Sitios fraudulentos bloqueados
          </div>
        </div>

        {/* Suspicious */}
        <div className="soc-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>
              Sitios Sospechosos
            </span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>
            {safeStats.suspicious_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', opacity: 0.8, marginTop: '4px' }}>
            Con advertencias de seguridad
          </div>
        </div>

        {/* Safe Sites */}
        <div className="soc-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
              Sitios Seguros
            </span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>
            {safeStats.safe_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, marginTop: '4px' }}>
            Verificados y auténticos
          </div>
        </div>

        {/* Average Risk Score */}
        <div className="soc-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Nivel de Riesgo Promedio
            </span>
            <Award size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            {safeStats.average_score}<span style={{ fontSize: '1rem', color: '#64748b' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isHealthy ? '#34d399' : '#f59e0b', marginTop: '4px' }}>
            {avgRisk === 0 ? 'Sin registros' : (avgRisk < 30 ? 'Índice de riesgo bajo' : (avgRisk < 70 ? 'Índice de riesgo moderado' : 'Índice de riesgo alto'))}
          </div>
        </div>
      </div>
    </div>
  );
}
