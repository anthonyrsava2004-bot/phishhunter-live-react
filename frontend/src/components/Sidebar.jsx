import React, { useState } from 'react';
import { 
  Shield, 
  Activity, 
  Database, 
  Clock, 
  GitBranch, 
  Terminal, 
  FileCheck, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Server
} from 'lucide-react';
import { purgeLogs } from '../api';

export default function Sidebar({ telemetry, onPurgeSuccess }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState('');

  const handlePurge = async () => {
    try {
      setPurging(true);
      const res = await purgeLogs();
      setPurgeMsg(`Bitácora purgada (${res.purged_count} registros eliminados).`);
      setShowConfirm(false);
      if (onPurgeSuccess) onPurgeSuccess();
      setTimeout(() => setPurgeMsg(''), 4000);
    } catch (err) {
      alert('Error al purgar bitácora: ' + err.message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <aside style={{
      width: '300px',
      minWidth: '300px',
      background: 'rgba(10, 16, 26, 0.95)',
      borderRight: '1px solid rgba(56, 189, 248, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 18px',
      gap: '20px',
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
          border: '1px solid #38bdf8'
        }}>
          <Shield size={26} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            PhishHunter <span style={{ color: '#38bdf8' }}>SOC</span>
          </h2>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
            Inspección Heurística Anti-Quishing
          </p>
        </div>
      </div>

      {/* Operational Status Pill */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }}></span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>SOC Activo & Resiliente</span>
        </div>
        <span style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>v2.4</span>
      </div>

      {purgeMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#34d399',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={16} />
          {purgeMsg}
        </div>
      )}

      {/* Telemetry Block */}
      <div className="soc-card" style={{ padding: '16px' }}>
        <h4 style={{
          fontSize: '0.82rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#38bdf8',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={16} /> Telemetría del Sistema
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span style={{ color: '#94a3b8' }}>Motor:</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>Heurístico Multicapa</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span style={{ color: '#94a3b8' }}>Base Forense:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#38bdf8' }}>SQLite Local</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span style={{ color: '#94a3b8' }}>Timeout Red:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
              {telemetry?.http_timeout || '4.0'}s
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span style={{ color: '#94a3b8' }}>Saltos Máximos:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {telemetry?.max_redirect_hops || '7'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span style={{ color: '#94a3b8' }}>Agente Crawler:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94a3b8' }}>PhishHunter</span>
          </div>
        </div>
      </div>

      {/* Compliance Block */}
      <div className="soc-card" style={{ padding: '16px', flex: 1 }}>
        <h4 style={{
          fontSize: '0.82rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#38bdf8',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FileCheck size={16} /> Alineación Normativa
        </h4>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.78rem',
          color: '#cbd5e1'
        }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>▪</span>
            <div><strong>ISO/IEC 27001:2022</strong> (A.8.15, A.8.20, A.8.24)</div>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>▪</span>
            <div><strong>OWASP ASVS v4.0</strong> (V5.1 / CWE-601 / CWE-79)</div>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>▪</span>
            <div><strong>NIST SP 800-52 / 63B</strong></div>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>▪</span>
            <div><strong>CIS Controls v8</strong> (Control 4.1)</div>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>▪</span>
            <div><strong>MITRE ATT&CK</strong> (T1566.002 / T1583.001)</div>
          </li>
        </ul>
      </div>

      {/* Purge Logs Button */}
      <div style={{ marginTop: 'auto' }}>
        {!showConfirm ? (
          <button 
            onClick={() => setShowConfirm(true)}
            className="btn-danger"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Trash2 size={16} /> Purgar Bitácora Forense
          </button>
        ) : (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '10px' }}>
              ¿Confirmar purga completa de registros de auditoría?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button 
                onClick={handlePurge}
                disabled={purging}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {purging ? 'Purgando...' : 'Sí, Purgar'}
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{
                  background: 'rgba(148, 163, 184, 0.2)',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
