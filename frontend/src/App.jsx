import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  BarChart2, 
  FileCheck2, 
  FlaskConical, 
  Menu, 
  X 
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import HeaderMetrics from './components/HeaderMetrics';
import ThreatInspectionTab from './components/ThreatInspectionTab';
import ForensicDashboardTab from './components/ForensicDashboardTab';
import ComplianceCatalogTab from './components/ComplianceCatalogTab';
import LabSamplesTab from './components/LabSamplesTab';
import { fetchHealth, fetchStats } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('inspect'); // 'inspect' | 'dashboard' | 'compliance' | 'lab'
  const [telemetry, setTelemetry] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [samplePayload, setSamplePayload] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadGlobalData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchStats().catch(() => null)
      ]);
      if (healthRes) setTelemetry(healthRes);
      if (statsRes) setStats(statsRes.stats);
    } catch (err) {
      console.error('Error al inicializar telemetría global:', err);
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, [refreshKey]);

  const handleAnalysisComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePurgeSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectSample = (payload) => {
    setSamplePayload(payload);
    setActiveTab('inspect');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 50,
          background: '#0284c7',
          color: '#fff',
          border: '1px solid #38bdf8',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }}
        className="mobile-menu-btn"
      >
        {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Persistent Left Sidebar */}
      <Sidebar 
        telemetry={telemetry} 
        onPurgeSuccess={handlePurgeSuccess} 
      />

      {/* Main Workspace Area */}
      <main style={{
        flex: 1,
        padding: '28px 36px',
        overflowY: 'auto',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header & KPI Metrics */}
        <HeaderMetrics stats={stats} />

        {/* Tab Navigation Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          <button
            onClick={() => setActiveTab('inspect')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'inspect' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'inspect' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'inspect' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <Search size={18} /> 🔍 Inspección de Amenazas
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'dashboard' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'dashboard' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart2 size={18} /> 📊 SOC Forensic Dashboard & Trazabilidad
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'compliance' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'compliance' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'compliance' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <FileCheck2 size={18} /> 🛡️ Catálogo de Controles y Marco Normativo
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'lab' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'lab' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'lab' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <FlaskConical size={18} /> 🧪 Laboratorio de Muestras y Pruebas
          </button>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'inspect' && (
            <ThreatInspectionTab 
              initialPayload={samplePayload} 
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {activeTab === 'dashboard' && (
            <ForensicDashboardTab refreshTrigger={refreshKey} />
          )}

          {activeTab === 'compliance' && (
            <ComplianceCatalogTab />
          )}

          {activeTab === 'lab' && (
            <LabSamplesTab onSelectSample={handleSelectSample} />
          )}
        </div>
      </main>
    </div>
  );
}
