import React from 'react';
import { Lock, Globe, Building2, Sliders } from 'lucide-react';

export default function ComplianceCatalogTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', color: '#38bdf8', margin: 0, fontWeight: 700 }}>
          🛡️ Catálogo de Controles de Ciberseguridad Implementados
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
          PhishHunter Live articula una arquitectura de ciberdefensa alineada formalmente con los principales estándares y marcos normativos de la industria:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* ISO/IEC 27001 */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Lock size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              🔒 ISO/IEC 27001:2022
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>Control A.8.15 (Logging):</strong> Registro sistemático inmutable en SQLite de cada inspección, trazando tiempo, IP, URL original, saltos y score.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Control A.8.20 (Seguridad en Redes / Aislamiento):</strong> Neutralización de enlaces y contención preventiva en Sandbox ante cualquier riesgo sospechoso o crítico.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Control A.8.24 (Uso de Criptografía):</strong> Inspección obligatoria de certificados SSL/TLS y penalización severa ante HTTP en texto claro o degradaciones criptográficas.
            </li>
          </ul>
        </div>

        {/* OWASP ASVS v4.0 */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Globe size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              🌐 OWASP ASVS v4.0 & Top 10
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>Control V5.1 / CWE-601 (Open Redirects):</strong> Rastreo controlado salto por salto (301, 302, 307, 308) detectando bifurcaciones entre dominios no relacionados y bucles.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>CWE-79 (Cross-Site Scripting):</strong> Sanitización estricta del DOM en Sandbox Pasivo, desarmando JavaScript y eventos onclick para evitar ataques 'Drive-by'.
            </li>
          </ul>
        </div>

        {/* NIST Special Publications */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Building2 size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              🏛️ NIST Special Publications
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>NIST SP 800-52 Rev. 2:</strong> Verificación de suites criptográficas TLS, expiración de certificados y detección de puertos no convencionales.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>NIST SP 800-63B / MITRE ATT&CK T1583.001:</strong> Detección de Typosquatting mediante cálculo de distancia de Levenshtein contra marcas y pasarelas oficiales.
            </li>
          </ul>
        </div>

        {/* CIS Controls v8 & RFC 5890 */}
        <div className="soc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Sliders size={20} color="#38bdf8" />
            <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.05rem' }}>
              ⚙️ CIS Controls v8 & RFC 5890
            </h4>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <li>
              <strong style={{ color: '#f8fafc' }}>CIS Controls v8 (4.1):</strong> Alerta por uso directo de direcciones IP públicas en lugar de FQDN y monitoreo de TLDs de alto riesgo (.xyz, .top, .live).
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>RFC 5890 / MITRE ATT&CK T1566.002:</strong> Detección de ataques homógrafos IDN por sustitución de caracteres cirílicos/griegos y prefijos Punycode (<code>xn--</code>).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
