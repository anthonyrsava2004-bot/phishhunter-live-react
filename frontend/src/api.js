/**
 * PhishHunter Live - Cliente de API para React SOC
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Error al obtener telemetría de salud');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Error al obtener estadísticas del SOC');
  return res.json();
}

export async function scanUploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/scan/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al procesar archivo de imagen');
  }
  return res.json();
}

export async function scanCameraFrame(imageBase64) {
  const res = await fetch(`${API_BASE}/scan/camera`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al decodificar captura');
  }
  return res.json();
}

export async function analyzePayload(payload) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al ejecutar inspección');
  }
  return res.json();
}

export async function fetchLogs(limit = 150, searchQuery = '') {
  let url = `${API_BASE}/logs?limit=${limit}`;
  if (searchQuery) {
    url += `&q=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener bitácora forense');
  return res.json();
}

export async function purgeLogs() {
  const res = await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al purgar bitácora');
  return res.json();
}

export async function fetchLabSamples() {
  const res = await fetch(`${API_BASE}/lab/samples`);
  if (!res.ok) throw new Error('Error al obtener casos de laboratorio');
  return res.json();
}

export async function generateQrImage(payload) {
  const res = await fetch(`${API_BASE}/lab/generate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw new Error('Error al generar código QR');
  return res.json();
}
