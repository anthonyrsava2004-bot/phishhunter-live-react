"""
PhishHunter Live - Servidor API REST SOC de Ciberseguridad (FastAPI)
=====================================================================
Alineación Normativa y Controles:
- ISO/IEC 27001:2022 (A.8.15 Trazabilidad Forense, A.8.20 Aislamiento, A.8.24 Criptografía)
- OWASP ASVS v4.0 (V5.1 Validación Redirecciones / CWE-601, CWE-79 Aislamiento XSS)
- NIST SP 800-52 Rev. 2 / NIST SP 800-63B (Transporte Seguro y Typosquatting)
- CIS Controls v8 (Control 4.1 Configuraciones Seguras)
- MITRE ATT&CK (T1566.002 Phishing Link / Quishing, T1583.001 Dominios Comprometidos)
"""

import base64
import io
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from core.heuristic_engine import HeuristicEngine
from core.qr_decoder import QRDecoder
from core.sandbox_preview import SandboxPreview
from core.url_tracer import URLTracer
from database.db_manager import DatabaseManager
from utils.threat_signatures import ALL_PROTECTED_DOMAINS, HIGH_RISK_TLDS

# ==============================================================================
# Inicialización de Componentes de Seguridad y Base de Datos
# ==============================================================================
db = DatabaseManager()
qr_decoder = QRDecoder()
url_tracer = URLTracer()
heuristic_engine = HeuristicEngine()
sandbox_preview = SandboxPreview()

app = FastAPI(
    title="PhishHunter Live API",
    description="Motor de Inspección Heurística y Aislamiento Preventivo de Quishing",
    version="2.4.0",
)

# Habilitar CORS para permitir llamadas tanto en desarrollo como en producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Modelos de Datos Pydantic
# ==============================================================================
class AnalyzeRequest(BaseModel):
    payload: str


class CameraScanRequest(BaseModel):
    image_base64: str


class GenerateQRRequest(BaseModel):
    payload: str


# ==============================================================================
# Utilidades Auxiliares
# ==============================================================================
def cv2_to_base64_data_uri(img: Optional[np.ndarray], format: str = "png") -> Optional[str]:
    """Convierte una matriz BGR de OpenCV en un Data URI base64."""
    if img is None or img.size == 0:
        return None
    success, buffer = cv2.imencode(f".{format}", img)
    if not success:
        return None
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/{format};base64,{b64_str}"


# ==============================================================================
# Endpoints de Telemetría y Salud
# ==============================================================================
@app.get("/api/health")
def get_health():
    """Indicadores de salud operacional y telemetría."""
    stats = db.get_audit_stats()
    return {
        "status": "operational",
        "engine": "Heurístico Multicapa v2.4",
        "database": f"SQLite Local ({os.getenv('DATABASE_PATH', 'database/phishhunter.db')})",
        "http_timeout": float(os.getenv("HTTP_TIMEOUT", "4.0")),
        "max_redirect_hops": int(os.getenv("MAX_REDIRECT_HOPS", "7")),
        "crawler_agent": "PhishHunterDefensiveCrawler",
        "total_audited": stats.get("total_inspections", 0),
        "standards": [
            {"name": "ISO/IEC 27001:2022", "controls": "A.8.15, A.8.20, A.8.24"},
            {"name": "OWASP ASVS v4.0", "controls": "V5.1 / CWE-601 / CWE-79"},
            {"name": "NIST SP 800-52 / 63B", "controls": "Transporte Seguro y Typosquatting"},
            {"name": "CIS Controls v8", "controls": "Control 4.1"},
            {"name": "MITRE ATT&CK", "controls": "T1566.002 / T1583.001"},
        ],
    }


@app.get("/api/stats")
def get_stats():
    """Estadísticas agregadas de auditoría forense e incidentes detectados."""
    stats = db.get_audit_stats()
    all_logs = db.get_all_audit_logs(limit=200)

    # Calcular frecuencias de firmas
    flag_frequencies: Dict[str, int] = {}
    for log in all_logs:
        for flag in log.get("detected_flags", []):
            name = flag.get("name", "Desconocida")
            flag_frequencies[name] = flag_frequencies.get(name, 0) + 1

    sorted_flags = sorted(
        [{"name": k, "frequency": v} for k, v in flag_frequencies.items()],
        key=lambda x: x["frequency"],
        reverse=True,
    )

    return {
        "stats": stats,
        "threat_frequencies": sorted_flags[:8],
    }


# ==============================================================================
# Endpoints de Decodificación de Códigos QR
# ==============================================================================
@app.post("/api/scan/upload")
async def scan_upload(file: UploadFile = File(...)):
    """Decodifica un código QR desde un archivo de imagen subido."""
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="El archivo subido está vacío.")

        decode_res = qr_decoder.decode_from_bytes(file_bytes)
        if decode_res["success"]:
            annotated_data_url = cv2_to_base64_data_uri(decode_res["annotated_image"])
            return {
                "success": True,
                "data": decode_res["data"],
                "method": decode_res["method"],
                "annotated_image": annotated_data_url,
            }
        else:
            return {
                "success": False,
                "error": decode_res["error"],
                "annotated_image": None,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar imagen: {str(e)}")


@app.post("/api/scan/camera")
async def scan_camera(req: CameraScanRequest):
    """Decodifica un código QR capturado desde la cámara web (Data URI o Base64)."""
    try:
        raw_b64 = req.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(raw_b64)
        decode_res = qr_decoder.decode_from_bytes(image_bytes)

        if decode_res["success"]:
            annotated_data_url = cv2_to_base64_data_uri(decode_res["annotated_image"])
            return {
                "success": True,
                "data": decode_res["data"],
                "method": decode_res["method"],
                "annotated_image": annotated_data_url,
            }
        else:
            return {
                "success": False,
                "error": decode_res["error"],
                "annotated_image": None,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al decodificar captura de cámara: {str(e)}")


# ==============================================================================
# Endpoint Principal: Análisis Integral de Seguridad y Aislamiento
# ==============================================================================
@app.post("/api/analyze")
def analyze_payload(req: AnalyzeRequest, request: Request):
    """
    Ejecuta la cadena defensiva integral:
    1. Trazado HTTP y verificación TLS
    2. Evaluación Heurística multicapa
    3. Sandbox pasivo con desinfección HTML
    4. Registro forense inmutable en SQLite
    """
    payload = req.payload.strip()
    if not payload:
        raise HTTPException(status_code=400, detail="El payload de análisis no puede estar vacío.")

    try:
        # 1. Rastrear saltos HTTP y TLS
        trace_result = url_tracer.trace(payload)

        # 2. Análisis heurístico preliminar
        prelim_analysis = heuristic_engine.analyze(payload, trace_result)

        # 3. Sandbox pasivo
        is_dangerous = prelim_analysis["risk_score"] >= 20
        sandbox_res = sandbox_preview.fetch_and_isolate(
            prelim_analysis["target_url"],
            is_dangerous=is_dangerous,
        )

        # 4. Integrar hallazgos del DOM si los hay
        sandbox_threats = sandbox_res.get("dom_threats", [])
        if sandbox_threats:
            analysis = heuristic_engine.analyze(payload, trace_result, sandbox_findings=sandbox_threats)
            is_dangerous = analysis["risk_score"] >= 20
        else:
            analysis = prelim_analysis

        # 5. Registrar en bitácora SQLite
        client_ip = request.client.host if request.client else "127.0.0.1"
        log_id = db.insert_audit_log(
            qr_raw_data=payload,
            final_url=analysis["target_url"],
            redirect_count=trace_result["redirect_count"],
            risk_score=analysis["risk_score"],
            risk_level=analysis["risk_level"],
            detected_flags=analysis["flags_detected"],
            client_ip=client_ip,
        )

        return {
            "log_id": log_id,
            "target_url": analysis["target_url"],
            "risk_score": analysis["risk_score"],
            "risk_level": analysis["risk_level"],
            "risk_badge": analysis["risk_badge"],
            "action_recommended": analysis["action_recommended"],
            "flags_detected": analysis["flags_detected"],
            "payload_type": analysis.get("payload_type", "web_url"),
            "emvco_info": analysis.get("emvco_info"),
            "trace_result": trace_result,
            "sandbox_res": sandbox_res,
            "is_dangerous": is_dangerous,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la inspección defensiva: {str(e)}")


# ==============================================================================
# Endpoints de Bitácora Forense (`audit_logs`)
# ==============================================================================
@app.get("/api/logs")
def get_logs(limit: int = 150, q: Optional[str] = Query(None)):
    """Obtiene registros inmutables de la bitácora forense."""
    logs = db.get_all_audit_logs(limit=limit, search_query=q)
    return logs


@app.delete("/api/logs")
def purge_logs():
    """Purga la bitácora forense SQLite."""
    count = db.purge_all_logs()
    return {"purged_count": count}


@app.get("/api/logs/export/csv")
def export_csv():
    """Descarga de la bitácora forense en CSV."""
    csv_content = db.export_to_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="phishhunter_audit_logs.csv"'},
    )


@app.get("/api/logs/export/json")
def export_json():
    """Descarga de la bitácora forense en JSON."""
    json_content = db.export_to_json()
    return Response(
        content=json_content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="phishhunter_audit_logs.json"'},
    )


# ==============================================================================
# Endpoints de Laboratorio de Amenazas y Generador QR
# ==============================================================================
SAMPLES_LAB = [
    {
        "id": "legit_bank",
        "category": "safe",
        "title": "🟢 Caso 1: Enlace Legítimo Seguro (Banca Oficial)",
        "payload": "https://www.chase.com",
        "description": "Dominio oficial verificado con certificados válidos y sin homógrafos.",
    },
    {
        "id": "cyrillic_homoglyph",
        "category": "critical",
        "title": "🔴 Caso 2: Ataque Homógrafo Cirílico (MITRE T1566.002)",
        "payload": "https://\u0440aypal.com/verify-account",
        "description": "Sustitución de la letra 'p' latina por 'р' cirílica para suplantar PayPal.",
    },
    {
        "id": "punycode_idn",
        "category": "critical",
        "title": "🔴 Caso 3: Ataque Punycode IDN Oculto (RFC 5890)",
        "payload": "https://xn--pypal-4ve.com/security/login",
        "description": "Nombre de dominio internacionalizado con codificación RFC 5890 simulando servicio financiero.",
    },
    {
        "id": "typosquatting",
        "category": "critical",
        "title": "🔴 Caso 4: Typosquatting / Combosquatting (NIST SP 800-63B)",
        "payload": "https://paypa1.com/login",
        "description": "Alteración leve de caracteres (número 1 en vez de 'l') calculada con distancia de Levenshtein.",
    },
    {
        "id": "direct_ip_port",
        "category": "critical",
        "title": "🔴 Caso 5: IP Directa + Puerto Anómalo + HTTP (CIS Controls 4.1)",
        "payload": "http://198.51.100.23:8080/portal/auth",
        "description": "Navegación directa por IPv4 sin FQDN en puerto no estándar 8080 sin cifrado SSL.",
    },
    {
        "id": "high_risk_tld",
        "category": "suspicious",
        "title": "🟡 Caso 6: TLD de Alto Riesgo + Lures de Credenciales",
        "payload": "https://soporte-bancario-urgente.xyz/update-banking-2fa",
        "description": "TLD de alta incidencia (.xyz) combinado con palabras señuelo de pánico y urgencia bancaria.",
    },
]


@app.get("/api/lab/samples")
def get_lab_samples():
    """Retorna los casos de prueba del laboratorio."""
    return SAMPLES_LAB


@app.post("/api/lab/generate-qr")
def generate_qr(req: GenerateQRRequest):
    """Genera una imagen QR en memoria para un payload dado."""
    try:
        cv_img = QRDecoder.generate_qr_image(req.payload)
        data_url = cv2_to_base64_data_uri(cv_img)
        return {
            "success": True,
            "payload": req.payload,
            "qr_image": data_url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar QR: {str(e)}")


# ==============================================================================
# Servir Frontend Compilado en Producción (Single-Port Support)
# ==============================================================================
FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Excluir rutas de la API
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Ruta de API no encontrada")
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return Response(content=index_file.read_text(encoding="utf-8"), media_type="text/html")
        return PlainTextResponse("Frontend build no encontrado. Ejecute npm run build en frontend/", status_code=503)
