import React, { useState, useEffect } from 'react';
import { FlaskConical, QrCode, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { fetchLabSamples, generateQrImage } from '../api';

export default function LabSamplesTab({ onSelectSample }) {
  const [samples, setSamples] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [currentSample, setCurrentSample] = useState(null);
  const [qrImageData, setQrImageData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    async function loadSamples() {
      try {
        const list = await fetchLabSamples();
        setSamples(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          setCurrentSample(list[0]);
        }
      } catch (err) {
        console.error('Error al cargar muestras del laboratorio:', err);
      }
    }
    loadSamples();
  }, []);

  useEffect(() => {
    if (!currentSample) return;
    async function fetchQr() {
      try {
        setLoadingQr(true);
        const res = await generateQrImage(currentSample.payload);
        if (res.success) {
          setQrImageData(res.qr_image);
        }
      } catch (err) {
        console.error('Error al generar QR de muestra:', err);
      } finally {
        setLoadingQr(false);
      }
    }
    fetchQr();
  }, [currentSample]);

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const found = samples.find(s => s.id === id);
    if (found) {
      setCurrentSample(found);
    }
  };

  const handleTransferToInspect = () => {
    if (currentSample && onSelectSample) {
      onSelectSample(currentSample.payload);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', color: '#38bdf8', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FlaskConical size={22} /> Laboratorio Forense: Generador de Vectores de Quishing
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
          Seleccione un arquetipo de amenaza o vector legítimo para generar su respectivo código QR en memoria y transferirlo al motor de inspección defensiva:
        </p>
      </div>

      <div className="soc-card">
        <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
          Seleccione un arquetipo de prueba:
        </label>
        <select
          value={selectedId}
          onChange={handleSelectChange}
          style={{ marginBottom: '20px', fontSize: '0.95rem' }}
        >
          {samples.map((s) => (
            <option key={s.id} value={s.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
              {s.title}
            </option>
          ))}
        </select>

        {currentSample && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            alignItems: 'center'
          }}>
            {/* QR Image Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              {loadingQr ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', padding: '60px 0' }}>
                  <RefreshCw size={24} className="animate-spin" /> Generando QR sintético...
                </div>
              ) : qrImageData ? (
                <img
                  src={qrImageData}
                  alt="QR Sintético"
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: '#fff'
                  }}
                />
              ) : (
                <div style={{ color: '#ef4444' }}>Error al generar QR</div>
              )}
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '10px' }}>
                Código QR Generado para el Vector
              </span>
            </div>

            {/* Vector Payload & Details Column */}
            <div>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                Payload del Vector:
              </span>
              <pre style={{
                background: 'rgba(9, 14, 23, 0.95)',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                margin: '8px 0 14px 0'
              }}>
                <code>{currentSample.payload}</code>
              </pre>

              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '20px' }}>
                <strong>Explicación Técnica:</strong> {currentSample.description}
              </p>

              <button
                onClick={handleTransferToInspect}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              >
                <ArrowRight size={18} /> Cargar este Vector en la Pestaña de Inspección
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
