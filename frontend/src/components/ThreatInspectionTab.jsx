import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Keyboard, 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Layers, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronRight, 
  FileCode, 
  Eye, 
  Copy,
  CreditCard,
  RefreshCw,
  Globe,
  AlertTriangle,
  Info
} from 'lucide-react';
import { scanUploadFile, scanCameraFrame, analyzePayload } from '../api';

export default function ThreatInspectionTab({ initialPayload, onAnalysisComplete }) {
  const [inputMethod, setInputMethod] = useState('upload'); // 'upload' | 'camera' | 'manual'
  const [payloadText, setPayloadText] = useState(initialPayload || '');
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [decodingMethod, setDecodingMethod] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', text: '' }

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [showHtmlCode, setShowHtmlCode] = useState(false);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  useEffect(() => {
    if (initialPayload) {
      setPayloadText(initialPayload);
    }
  }, [initialPayload]);

  // Handle Camera stream start/stop
  useEffect(() => {
    if (inputMethod === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMethod]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('No se pudo acceder a la cámara web: ' + err.message);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture frame from camera
  const captureCameraFrame = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setUploadStatus({ type: 'info', text: 'Analizando fotograma capturado...' });
    try {
      const res = await scanCameraFrame(dataUrl);
      if (res.success) {
        setPayloadText(res.data);
        setAnnotatedImage(res.annotated_image);
        setDecodingMethod(res.method);
        setUploadStatus({ 
          type: 'success', 
          text: 'Código QR detectado y leído exitosamente.' 
        });
      } else {
        setUploadStatus({ type: 'error', text: res.error || 'No se detectó un código QR válido en la toma.' });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.message });
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus({ type: 'info', text: 'Leyendo código QR de la imagen...' });
    try {
      const res = await scanUploadFile(file);
      if (res.success) {
        setPayloadText(res.data);
        setAnnotatedImage(res.annotated_image);
        setDecodingMethod(res.method);
        setUploadStatus({ 
          type: 'success', 
          text: 'Código QR detectado y decodificado exitosamente.' 
        });
      } else {
        setUploadStatus({ type: 'error', text: res.error || 'No se detectó código QR en el archivo.' });
        setAnnotatedImage(null);
      }
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.message });
      setAnnotatedImage(null);
    }
  };

  // Trigger full analysis pipeline
  const handleTriggerAnalysis = async () => {
    if (!payloadText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 500);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1000);
    const stepTimer3 = setTimeout(() => setAnalysisStep(4), 1500);
    const stepTimer4 = setTimeout(() => setAnalysisStep(5), 2000);

    try {
      const res = await analyzePayload(payloadText);
      setAnalysisStep(6);
      setTimeout(() => {
        setAnalysisResult(res);
        setIsAnalyzing(false);
        if (onAnalysisComplete) onAnalysisComplete();
      }, 400);
    } catch (err) {
      setAnalysisError(err.message);
      setIsAnalyzing(false);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Input Selection Header */}
      <div className="soc-card" style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#38bdf8',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          📥 Ingresa o Escanea un Código QR o Enlace
        </h3>

        {/* Input Vector Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          <button
            onClick={() => setInputMethod('upload')}
            className="vector-mode-btn"
            style={{
              flex: '1 1 180px',
              minWidth: 0,
              padding: '12px 14px',
              borderRadius: '8px',
              border: inputMethod === 'upload' ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
              background: inputMethod === 'upload' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: inputMethod === 'upload' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={18} /> Subir Imagen con QR
          </button>

          <button
            onClick={() => setInputMethod('camera')}
            className="vector-mode-btn"
            style={{
              flex: '1 1 180px',
              minWidth: 0,
              padding: '12px 14px',
              borderRadius: '8px',
              border: inputMethod === 'camera' ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
              background: inputMethod === 'camera' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: inputMethod === 'camera' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Camera size={18} /> Escanear con Cámara
          </button>

          <button
            onClick={() => setInputMethod('manual')}
            className="vector-mode-btn"
            style={{
              flex: '1 1 180px',
              minWidth: 0,
              padding: '12px 14px',
              borderRadius: '8px',
              border: inputMethod === 'manual' ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
              background: inputMethod === 'manual' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: inputMethod === 'manual' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Keyboard size={18} /> Escribir Enlace Directo
          </button>
        </div>

        {/* Input Vector Content */}
        <div style={{
          background: 'rgba(10, 16, 26, 0.6)',
          border: '1px solid rgba(56, 189, 248, 0.12)',
          borderRadius: '10px',
          padding: '18px',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {inputMethod === 'upload' && (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '14px' }}>
                Selecciona una foto o captura de pantalla que contenga un código QR para comprobar si es seguro:
              </p>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                border: '2px dashed rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}>
                <Upload size={32} color="#38bdf8" style={{ marginBottom: '10px' }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>
                  Hacer clic para subir imagen
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  PNG, JPG, JPEG, WEBP
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {inputMethod === 'camera' && (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '14px' }}>
                Apunta tu cámara hacia el código QR y pulsa "Capturar y Leer":
              </p>
              {cameraError ? (
                <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                  ⚠️ {cameraError}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '2px solid rgba(56, 189, 248, 0.3)',
                    background: '#000',
                    position: 'relative'
                  }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>
                  <button
                    onClick={captureCameraFrame}
                    className="btn-primary"
                    style={{ padding: '10px 20px', width: '100%', maxWidth: '320px' }}
                  >
                    <Camera size={18} /> Capturar y Leer Código QR
                  </button>
                </div>
              )}
            </div>
          )}

          {inputMethod === 'manual' && (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '10px' }}>
                Pega la dirección web que deseas verificar:
              </p>
              <input
                type="text"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                placeholder="https://ejemplo-sitio-sospechoso.com/login"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.92rem',
                  padding: '12px 14px'
                }}
              />
            </div>
          )}

          {/* Status Message */}
          {uploadStatus && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              wordBreak: 'break-word',
              background: uploadStatus.type === 'success' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : (uploadStatus.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
              border: `1px solid ${
                uploadStatus.type === 'success' ? '#10b981' : (uploadStatus.type === 'error' ? '#ef4444' : '#38bdf8')
              }`,
              color: uploadStatus.type === 'success' ? '#34d399' : (uploadStatus.type === 'error' ? '#f87171' : '#38bdf8')
            }}>
              {uploadStatus.type === 'success' && <CheckCircle size={16} style={{ flexShrink: 0 }} />}
              {uploadStatus.type === 'error' && <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              {uploadStatus.type === 'info' && <RefreshCw size={16} className="animate-spin" style={{ flexShrink: 0 }} />}
              <span>{uploadStatus.text}</span>
            </div>
          )}

          {/* Annotated Image & Decoded Preview */}
          {annotatedImage && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Código QR Detectado:
                </span>
                <img
                  src={annotatedImage}
                  alt="QR detectado"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Enlace o Texto del Código QR:
                </span>
                <div style={{
                  background: 'rgba(9, 14, 23, 0.9)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  color: '#38bdf8'
                }}>
                  {payloadText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trigger Button */}
        {payloadText && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleTriggerAnalysis}
              disabled={isAnalyzing}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '1rem',
                justifyContent: 'center'
              }}
            >
              <Rocket size={18} />
              {isAnalyzing ? 'Verificando seguridad del enlace...' : '🚀 Analizar Seguridad del Enlace'}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Progress Steps Card */}
      {isAnalyzing && (
        <div className="soc-card" style={{ marginBottom: '24px', borderLeft: '4px solid #38bdf8' }}>
          <h4 style={{ color: '#38bdf8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
            <RefreshCw size={16} className="animate-spin" /> Verificando autenticidad y posibles riesgos...
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
            <div style={{ color: analysisStep >= 1 ? '#34d399' : '#64748b' }}>
              {analysisStep >= 1 ? '✅' : '⏳'} 1️⃣ Verificando seguridad de la conexión y certificados SSL...
            </div>
            <div style={{ color: analysisStep >= 2 ? '#34d399' : '#64748b' }}>
              {analysisStep >= 2 ? '✅' : '⏳'} 2️⃣ Comprobando caracteres especiales y posible suplantación de identidad...
            </div>
            <div style={{ color: analysisStep >= 3 ? '#34d399' : '#64748b' }}>
              {analysisStep >= 3 ? '✅' : '⏳'} 3️⃣ Comparando contra sitios oficiales de bancos y empresas...
            </div>
            <div style={{ color: analysisStep >= 4 ? '#34d399' : '#64748b' }}>
              {analysisStep >= 4 ? '✅' : '⏳'} 4️⃣ Inspeccionando la reputación de la dirección web...
            </div>
            <div style={{ color: analysisStep >= 5 ? '#34d399' : '#64748b' }}>
              {analysisStep >= 5 ? '✅' : '⏳'} 5️⃣ Extrayendo vista previa segura y desinfectando contenido...
            </div>
            <div style={{ color: analysisStep >= 6 ? '#34d399' : '#64748b' }}>
              {analysisStep >= 6 ? '✅' : '⏳'} 6️⃣ Generando reporte final de seguridad...
            </div>
          </div>
        </div>
      )}

      {analysisError && (
        <div style={{
          padding: '14px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '10px',
          color: '#f87171',
          marginBottom: '24px',
          wordBreak: 'break-word',
          fontSize: '0.88rem'
        }}>
          ⚠️ Error al analizar el enlace: {analysisError}
        </div>
      )}

      {/* Analysis Results Display */}
      {analysisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Verdict Card */}
          <div className={analysisResult.risk_score >= 60 ? 'quarantine-shield' : (analysisResult.risk_score >= 20 ? 'soc-card' : 'safe-shield')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '100%' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Resultado del Análisis:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span className={
                    analysisResult.risk_score >= 60 ? 'badge-critical' : (analysisResult.risk_score >= 20 ? 'badge-suspicious' : 'badge-safe')
                  } style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                    {analysisResult.risk_badge} {analysisResult.risk_level} (Riesgo: {analysisResult.risk_score}/100)
                  </span>
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                Ref: #{analysisResult.log_id}
              </span>
            </div>

            <p style={{ fontSize: '0.98rem', margin: '8px 0', color: '#e2e8f0', wordBreak: 'break-word' }}>
              <strong>Recomendación:</strong> {analysisResult.action_recommended}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '6px 0 0 0', wordBreak: 'break-all' }}>
              Sitio web de destino: <code style={{ color: '#38bdf8', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{analysisResult.target_url}</code>
            </p>
          </div>

          {/* 4 Reliability / Reputation Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
            gap: '12px'
          }}>
            <div className="soc-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Nivel de Riesgo
              </span>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                marginTop: '4px',
                color: analysisResult.risk_score >= 60 ? '#ef4444' : (analysisResult.risk_score >= 20 ? '#f59e0b' : '#10b981'),
                wordBreak: 'break-word'
              }}>
                {analysisResult.risk_score} / 100
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-word' }}>
                {analysisResult.risk_score >= 60 ? 'Peligro alto' : (analysisResult.risk_score >= 20 ? 'Precaución' : 'Confiable')}
              </div>
            </div>

            <div className="soc-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Redirecciones
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px', wordBreak: 'break-word' }}>
                {analysisResult.trace_result?.redirect_count || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-word' }}>
                {analysisResult.trace_result?.redirect_count === 0 ? 'Directo al sitio' : `${analysisResult.trace_result?.redirect_count} saltos`}
              </div>
            </div>

            <div className="soc-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Conexión Segura
              </span>
              <div style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                marginTop: '8px',
                wordBreak: 'break-word',
                color: (!analysisResult.trace_result?.is_web_url) 
                  ? '#94a3b8' 
                  : (analysisResult.trace_result?.ssl_valid && !analysisResult.trace_result?.has_tls_downgrade ? '#10b981' : '#ef4444')
              }}>
                {!analysisResult.trace_result?.is_web_url
                  ? 'No Aplica'
                  : (analysisResult.trace_result?.ssl_valid && !analysisResult.trace_result?.has_tls_downgrade ? 'Cifrado Válido' : 'No Segura')}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-word' }}>
                Certificado SSL/TLS
              </div>
            </div>

            <div className="soc-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Alertas
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px', wordBreak: 'break-word' }}>
                {analysisResult.flags_detected?.length || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-word' }}>
                {analysisResult.flags_detected?.length === 0 ? 'Sin advertencias' : 'Detectadas'}
              </div>
            </div>
          </div>

          {/* EMVCo Card if applicable */}
          {analysisResult.payload_type === 'emvco_payment' && analysisResult.emvco_info && (
            <div className="soc-card" style={{ borderLeft: '4px solid #10b981', padding: '16px' }}>
              <h4 style={{ color: '#10b981', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                <CreditCard size={18} /> Datos de Pago Móvil ({analysisResult.emvco_info.network || 'P2P'})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                <p style={{ margin: 0 }}><strong>Beneficiario:</strong> {analysisResult.emvco_info.merchant_name}</p>
                <p style={{ margin: 0 }}><strong>Ubicación:</strong> {analysisResult.emvco_info.merchant_city}, {analysisResult.emvco_info.country_code} (Perú)</p>
                <p style={{ margin: 0 }}><strong>Moneda:</strong> {analysisResult.emvco_info.currency} | <strong>Categoría:</strong> {analysisResult.emvco_info.category_code}</p>
                <p style={{ margin: 0, color: '#10b981', fontSize: '0.8rem' }}>
                  ✓ Integridad verificada y auténtica
                </p>
              </div>
            </div>
          )}

          {/* Findings Breakdown Matrix */}
          <div className="soc-card">
            <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', marginBottom: '14px' }}>
              📋 Detalle de Alertas y Factores de Riesgo
            </h3>

            {(!analysisResult.flags_detected || analysisResult.flags_detected.length === 0) ? (
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem'
              }}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <span>No se detectaron riesgos. El enlace utiliza conexión cifrada segura y no presenta indicios de suplantación de identidad.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analysisResult.flags_detected.map((flag, idx) => {
                  const sev = flag.severity;
                  const sevClass = sev === 'CRÍTICA' ? 'badge-critical' : (sev === 'ALTA' || sev === 'MEDIA' ? 'badge-suspicious' : 'badge-safe');
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.9rem', flex: '1 1 200px', wordBreak: 'break-word' }}>
                          #{idx + 1} {flag.name}
                        </h4>
                        <span className={sevClass} style={{ fontSize: '0.72rem' }}>{sev}</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                        {flag.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HTTP Redirect Trace Table */}
          <div className="soc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', margin: 0 }}>
                🌐 Ruta de Redirección del Enlace
              </h3>
              {analysisResult.trace_result?.hops && analysisResult.trace_result.hops.length > 0 && (
                <button
                  onClick={() => setShowNetworkDetails(!showNetworkDetails)}
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                >
                  {showNetworkDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos (IPs/Latencia)'}
                </button>
              )}
            </div>

            {analysisResult.trace_result?.hops && analysisResult.trace_result.hops.length > 0 ? (
              <div>
                <div className="table-responsive-container" style={{ marginBottom: '12px' }}>
                  <table className="soc-table">
                    <thead>
                      <tr>
                        <th>Paso</th>
                        <th>Estado</th>
                        <th>Dominio / Sitio</th>
                        {showNetworkDetails && <th>IP</th>}
                        {showNetworkDetails && <th>Tiempo</th>}
                        <th>Enlace de Destino</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.trace_result.hops.map((hop, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700 }}>{hop.hop}</td>
                          <td>
                            <span style={{
                              color: hop.status_code >= 400 ? '#ef4444' : (hop.status_code >= 300 ? '#f59e0b' : '#10b981'),
                              fontWeight: 600,
                              fontSize: '0.78rem'
                            }}>
                              {hop.status_code >= 300 && hop.status_code < 400 ? `Redirige (${hop.status_code})` : (hop.status_code === 200 ? '200 OK' : `${hop.status_code}`)}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#f8fafc', wordBreak: 'break-word' }}>{hop.hostname}</td>
                          {showNetworkDetails && <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem' }}>{hop.resolved_ip}</td>}
                          {showNetworkDetails && <td style={{ fontSize: '0.75rem' }}>{hop.elapsed_ms} ms</td>}
                          <td style={{
                            fontFamily: 'var(--font-mono)',
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.75rem'
                          }}>
                            {hop.url}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TLS Audit Row */}
                {analysisResult.trace_result.tls_audit?.enforced && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    wordBreak: 'break-word'
                  }}>
                    <strong style={{ color: '#38bdf8' }}>Certificado:</strong> Emisor: <code style={{ color: '#fff' }}>{analysisResult.trace_result.tls_audit.issuer_cn}</code> | Válido hasta: <code style={{ color: '#fff' }}>{analysisResult.trace_result.tls_audit.expires}</code>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                El enlace no realizó redirecciones; conecta de forma directa a su destino.
              </p>
            )}
          </div>

          {/* Passive Sandbox & Defensive Isolation */}
          <div className="soc-card">
            <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', marginBottom: '12px' }}>
              📦 Vista Previa Segura del Sitio Web
            </h3>

            {analysisResult.is_dangerous ? (
              <div className="quarantine-shield" style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
                  <ShieldAlert size={18} /> Navegación Protegida Activa
                </h4>
                <p style={{ color: '#cbd5e1', margin: '6px 0 0 0', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                  El acceso directo está <strong>bloqueado por precaución</strong> para evitar la descarga de archivos dañinos. A continuación puedes ver el contenido real de la página de forma totalmente segura.
                </p>
              </div>
            ) : (
              <div className="safe-shield" style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
                  <ShieldCheck size={18} /> Sitio Verificado y Seguro
                </h4>
                <p style={{ color: '#cbd5e1', margin: '6px 0 0 0', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                  Este enlace no presenta indicios de fraude o suplantación.
                </p>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '16px'
            }}>
              {/* OpenGraph Metadata Column */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                borderRadius: '8px',
                padding: '14px',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <h4 style={{ color: '#38bdf8', marginBottom: '10px', fontSize: '0.9rem' }}>
                  🖼️ Información y Portada del Sitio:
                </h4>
                {analysisResult.sandbox_res?.metadata ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                    <p style={{ margin: 0, wordBreak: 'break-word' }}><strong>Título:</strong> {analysisResult.sandbox_res.metadata.title || 'No especificado'}</p>
                    <p style={{ margin: 0, wordBreak: 'break-word' }}><strong>Descripción:</strong> {analysisResult.sandbox_res.metadata.description || 'No especificada'}</p>
                    <p style={{ margin: 0, wordBreak: 'break-word' }}><strong>Sitio Web:</strong> {analysisResult.sandbox_res.metadata.site_name || 'No especificado'}</p>
                    {analysisResult.sandbox_res.metadata.image_url && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Imagen de portada del sitio:
                        </span>
                        <img
                          src={analysisResult.sandbox_res.metadata.image_url}
                          alt="Portada del sitio"
                          style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '6px', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {analysisResult.sandbox_res.metadata.favicon_url && (
                      <p style={{ margin: '4px 0 0 0' }}>
                        <strong>Icono del sitio:</strong> <a href={analysisResult.sandbox_res.metadata.favicon_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>Ver Favicon</a>
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Sin portada web disponible.</p>
                )}
              </div>

              {/* Sanitized DOM Column */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                borderRadius: '8px',
                padding: '14px',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '0.9rem' }}>
                    📄 Resumen del Contenido:
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {analysisResult.sandbox_res?.page_size_kb || 0} KB
                  </span>
                </div>

                <textarea
                  readOnly
                  rows={5}
                  value={analysisResult.sandbox_res?.text_summary || 'Sin contenido de texto detectado en la página.'}
                  style={{
                    resize: 'none',
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                    marginBottom: '10px',
                    width: '100%',
                    maxWidth: '100%'
                  }}
                />

                {/* Sanitized HTML Accordion (Optional) */}
                <button
                  onClick={() => setShowHtmlCode(!showHtmlCode)}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.78rem', padding: '6px 10px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode size={14} /> Ver código HTML desinfectado (Avanzado)
                  </span>
                  {showHtmlCode ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {showHtmlCode && (
                  <div style={{ marginTop: '8px', position: 'relative' }}>
                    <button
                      onClick={() => copyToClipboard(analysisResult.sandbox_res?.sanitized_html || '')}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Copy size={12} /> {copiedHtml ? 'Copiado!' : 'Copiar'}
                    </button>
                    <pre style={{
                      background: 'rgba(9, 14, 23, 0.95)',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      fontSize: '0.72rem',
                      color: '#93c5fd',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <code>{analysisResult.sandbox_res?.sanitized_html}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
