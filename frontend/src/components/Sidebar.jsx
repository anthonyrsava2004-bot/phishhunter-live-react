import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  Trash2,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { purgeLogs } from '../api';

export default function Sidebar({ telemetry, onPurgeSuccess, isOpen, onClose }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState('');

  const handlePurge = async () => {
    try {
      setPurging(true);
      const res = await purgeLogs();
      setPurgeMsg('Historial de análisis limpiado correctamente.');
      setShowConfirm(false);
      if (onPurgeSuccess) onPurgeSuccess();
      setTimeout(() => setPurgeMsg(''), 4000);
    } catch (err) {
      alert('Error al limpiar el historial: ' + err.message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          title="Tocar para cerrar barra lateral"
        />
      )}

      <aside className={`soc-sidebar ${isOpen ? 'soc-sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
              border: '1px solid #38bdf8',
              flexShrink: 0
            }}>
              <Shield size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                PhishHunter
              </h2>
              <p style={{ fontSize: '0.74rem', color: '#38bdf8', margin: 0, fontWeight: 600 }}>
                Seguridad & Anti-Fraude
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            title="Cerrar panel lateral"
            aria-label="Cerrar barra lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* Operational Status Pill */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }}></span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>Protección en Tiempo Real</span>
          </div>
          <span style={{ color: '#10b981', fontSize: '0.74rem', fontWeight: 600 }}>Activa</span>
        </div>

        {purgeMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            {purgeMsg}
          </div>
        )}

        {/* User Protection Status */}
        <div className="soc-card" style={{ padding: '16px' }}>
          <h4 style={{
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#38bdf8',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700
          }}>
            <ShieldCheck size={16} /> Cobertura de Seguridad
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1' }}>Escaneo de QR</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Activo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1' }}>Anti-Suplantación Web</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Activo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1' }}>Validación SSL/TLS</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Activo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1' }}>Aislamiento Preventivo</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Activo</span>
            </div>
          </div>
        </div>

        {/* Protection Summary */}
        <div className="soc-card" style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <h4 style={{
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#38bdf8',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700
          }}>
            <Sparkles size={16} /> ¿Cómo te protegemos?
          </h4>

          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#cbd5e1'
          }}>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#38bdf8', marginTop: '2px' }}>✓</span>
              <div><strong>Lectura Segura de QR:</strong> Inspeccionamos el enlace antes de que tu dispositivo lo abra.</div>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#38bdf8', marginTop: '2px' }}>✓</span>
              <div><strong>Detección de Sitios Falsos:</strong> Verificamos si intentan imitar a bancos, redes o tiendas oficiales.</div>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#38bdf8', marginTop: '2px' }}>✓</span>
              <div><strong>Conexión Cifrada:</strong> Alertamos si el sitio no cuenta con certificado de seguridad válido.</div>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#38bdf8', marginTop: '2px' }}>✓</span>
              <div><strong>Vista Previa Aislada:</strong> Puedes previsualizar el sitio sin riesgo de descargas maliciosas.</div>
            </li>
          </ul>
        </div>

        {/* Clear History Button */}
        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
          {!showConfirm ? (
            <button 
              onClick={() => setShowConfirm(true)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
            >
              <Trash2 size={15} /> Limpiar Historial de Análisis
            </button>
          ) : (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '10px' }}>
                ¿Deseas vaciar el historial de análisis realizados?
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
                  {purging ? 'Limpiando...' : 'Sí, Limpiar'}
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
    </>
  );
}
