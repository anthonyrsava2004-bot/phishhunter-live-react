import React from 'react';
import { Lock, Globe, Building2, Sliders, ShieldCheck } from 'lucide-react';

export default function ComplianceCatalogTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', color: '#38bdf8', margin: 0, fontWeight: 700 }}>
          🛡️ Mecanismos de Protección y Seguridad
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
          Conoce cómo PhishHunter inspecciona cada enlace y código QR en tiempo real para proteger tu información:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '20px'
      }}>
        {/* Encryption & Certificates */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Lock size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              🔒 Conexión Cifrada y Certificados SSL/TLS
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>Verificación de HTTPS:</strong> Garantiza que el sitio utilice canales seguros y descarta conexiones inseguras sin cifrado.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Auditoría de Certificados:</strong> Comprueba la entidad emisora oficial, la vigencia y evita sitios con certificados falsificados o caducados.
            </li>
          </ul>
        </div>

        {/* Redirection Analysis */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Globe size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              🌐 Detección de Redirecciones Ocultas
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>Rastreo de Saltos Web:</strong> Desarma enlaces acortados y cadenas de redirección para descubrir el destino final real.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Prevención de Desvíos Maliciosos:</strong> Te avisa si un enlace aparentemente inofensivo te redirige hacia un portal sospechoso.
            </li>
          </ul>
        </div>

        {/* Brand Impersonation & Typosquatting */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Building2 size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              🏛️ Prevención de Suplantación de Bancos y Marcas
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>Detección de Nombres Falsos:</strong> Identifica dominios que imitan marcas reales cambiando letras sutiles (como usar un '1' por una 'l').
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Protección contra Caracteres Ocultos:</strong> Detecta letras de otros alfabetos (cirílico/griego) utilizadas por atacantes para engañar a simple vista.
            </li>
          </ul>
        </div>

        {/* Safe Sandbox Preview */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Sliders size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              ⚙️ Aislamiento Preventivo y Navegación Segura
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>Entorno Protegido:</strong> Previsualiza el contenido web sin permitir que se ejecuten descargas o programas maliciosos en tu equipo.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Alerta de Direcciones Sospechosas:</strong> Identifica dominios con terminaciones de alto riesgo o enlaces numéricos directos.
            </li>
          </ul>
        </div>
      </div>

      <div style={{
        marginTop: '10px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        fontSize: '0.82rem',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <ShieldCheck size={16} color="#38bdf8" />
        PhishHunter implementa buenas prácticas de seguridad y privacidad alineadas con ISO/IEC 27001, OWASP, NIST y CIS Controls.
      </div>
    </div>
  );
}
