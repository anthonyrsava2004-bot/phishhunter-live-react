import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Search, 
  RefreshCw, 
  FileText, 
  FileSpreadsheet, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { fetchLogs, fetchStats } from '../api';

export default function ForensicDashboardTab({ refreshTrigger }) {
  const [statsData, setStatsData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        fetchStats(),
        fetchLogs(150, searchQuery)
      ]);
      setStatsData(statsRes);
      setLogs(logsRes);
    } catch (err) {
      console.error('Error al cargar datos del historial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger, searchQuery]);

  const stats = statsData?.stats || {
    total_inspections: 0,
    critical_count: 0,
    suspicious_count: 0,
    safe_count: 0,
    average_score: 0
  };

  const threatFrequencies = statsData?.threat_frequencies || [];

  // Donut chart calculations
  const total = stats.total_inspections || 0;
  const criticalPct = total > 0 ? (stats.critical_count / total) * 100 : 0;
  const suspiciousPct = total > 0 ? (stats.suspicious_count / total) * 100 : 0;
  const safePct = total > 0 ? (stats.safe_count / total) * 100 : 0;

  // SVG Donut calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const strokeCritical = (criticalPct / 100) * circumference;
  const strokeSuspicious = (suspiciousPct / 100) * circumference;
  const strokeSafe = (safePct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#38bdf8', margin: 0, fontWeight: 700 }}>
            📊 Historial de Análisis y Estadísticas de Seguridad
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Registro cronológico de enlaces escaneados y resumen de confiabilidad
          </p>
        </div>
        <button 
          onClick={loadDashboardData} 
          className="btn-secondary"
          style={{ fontSize: '0.82rem', padding: '7px 14px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar Datos
        </button>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Donut Chart: Risk Distribution */}
        <div className="soc-card">
          <h4 style={{
            fontSize: '0.95rem',
            color: '#38bdf8',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <PieChart size={18} /> Clasificación de Enlaces Analizados
          </h4>

          {total === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.9rem' }}>
              Sin análisis registrados todavía.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap' }}>
              {/* Circular SVG Donut */}
              <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="18"
                  />
                  {/* Safe Segment */}
                  {safePct > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="18"
                      strokeDasharray={`${strokeSafe} ${circumference}`}
                      strokeDashoffset="0"
                    />
                  )}
                  {/* Suspicious Segment */}
                  {suspiciousPct > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="18"
                      strokeDasharray={`${strokeSuspicious} ${circumference}`}
                      strokeDashoffset={`-${strokeSafe}`}
                    />
                  )}
                  {/* Critical Segment */}
                  {criticalPct > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="18"
                      strokeDasharray={`${strokeCritical} ${circumference}`}
                      strokeDashoffset={`-${strokeSafe + strokeSuspicious}`}
                    />
                  )}
                </svg>
                {/* Center text */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{total}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Analizados</span>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444' }}></span>
                  <span style={{ color: '#f87171' }}>Peligroso / Fraude:</span>
                  <strong style={{ color: '#fff' }}>{stats.critical_count} ({criticalPct.toFixed(0)}%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b' }}></span>
                  <span style={{ color: '#fbbf24' }}>Sospechoso:</span>
                  <strong style={{ color: '#fff' }}>{stats.suspicious_count} ({suspiciousPct.toFixed(0)}%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }}></span>
                  <span style={{ color: '#34d399' }}>Seguro:</span>
                  <strong style={{ color: '#fff' }}>{stats.safe_count} ({safePct.toFixed(0)}%)</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Bar Chart: Threat Signatures */}
        <div className="soc-card">
          <h4 style={{
            fontSize: '0.95rem',
            color: '#38bdf8',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BarChart3 size={18} /> Amenazas Más Comunes Detectadas
          </h4>

          {threatFrequencies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.9rem' }}>
              No se han detectado incidentes suficientes para mostrar frecuencias.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {threatFrequencies.map((item, idx) => {
                const maxFreq = Math.max(...threatFrequencies.map(t => t.frequency), 1);
                const pct = (item.frequency / maxFreq) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#cbd5e1', fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {item.frequency} detección{item.frequency > 1 ? 'es' : ''}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Forensic Audit Log Table */}
      <div className="soc-card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', margin: 0 }}>
            📋 Historial de Enlaces Analizados
          </h3>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="search"
              placeholder="Buscar por enlace, dominio o resultado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '36px',
                fontSize: '0.85rem',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}
            />
          </div>
        </div>

        {/* Table Content */}
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            No hay registros que coincidan con la búsqueda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
            <table className="soc-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th>#</th>
                  <th>Fecha y Hora</th>
                  <th>Enlace o QR Original</th>
                  <th>Destino Final</th>
                  <th>Redirecciones</th>
                  <th>Riesgo</th>
                  <th>Resultado</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => {
                  const levelClass = row.risk_level === 'CRÍTICO / QUISHING' ? 'badge-critical' : (row.risk_level === 'SOSPECHOSO' ? 'badge-suspicious' : 'badge-safe');
                  return (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#{row.id}</td>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                        {row.timestamp?.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {row.qr_raw_data}
                      </td>
                      <td style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono)',
                        color: '#38bdf8'
                      }}>
                        {row.final_url}
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.redirect_count}</td>
                      <td>
                        <strong style={{
                          color: row.risk_score >= 70 ? '#ef4444' : (row.risk_score >= 30 ? '#f59e0b' : '#10b981')
                        }}>
                          {row.risk_score}/100
                        </strong>
                      </td>
                      <td>
                        <span className={levelClass} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          {row.risk_level}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {Array.isArray(row.detected_flags) ? row.detected_flags.length : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Forensic Export Buttons */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 600 }}>
            📥 Descargar Reporte de Seguridad:
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="/api/logs/export/csv"
              download="phishhunter_reporte_seguridad.csv"
              className="btn-secondary"
              style={{ textDecoration: 'none', fontSize: '0.85rem' }}
            >
              <FileSpreadsheet size={16} color="#34d399" />
              Descargar en Formato Excel / CSV
            </a>
            <a
              href="/api/logs/export/json"
              download="phishhunter_reporte_seguridad.json"
              className="btn-secondary"
              style={{ textDecoration: 'none', fontSize: '0.85rem' }}
            >
              <FileText size={16} color="#38bdf8" />
              Descargar en Formato JSON
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
