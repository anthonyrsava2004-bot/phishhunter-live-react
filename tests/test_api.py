"""
PhishHunter Live - Pruebas Automatizadas de la API REST y Entrega de React
"""

import pytest
from starlette.testclient import TestClient
from api import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert "standards" in data
    assert len(data["standards"]) >= 5

def test_api_stats():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    assert "total_inspections" in data["stats"]
    assert "threat_frequencies" in data

def test_lab_samples_and_qr_generation():
    res = client.get("/api/lab/samples")
    assert res.status_code == 200
    samples = res.json()
    assert len(samples) >= 6

    # Test synthetic QR generation
    qr_res = client.post("/api/lab/generate-qr", json={"payload": samples[0]["payload"]})
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert qr_data["success"] is True
    assert qr_data["qr_image"].startswith("data:image/png;base64,")

def test_analyze_endpoint():
    res = client.post("/api/analyze", json={"payload": "https://paypa1.com/login"})
    assert res.status_code == 200
    data = res.json()
    assert data["risk_score"] >= 70
    assert data["risk_level"] == "CRÍTICO / QUISHING"
    assert "log_id" in data
    assert "target_url" in data
    assert "trace_result" in data
    assert "sandbox_res" in data
    assert data["is_dangerous"] is True

def test_audit_logs_and_exports():
    res = client.get("/api/logs")
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)

    csv_res = client.get("/api/logs/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]

    json_res = client.get("/api/logs/export/json")
    assert json_res.status_code == 200
    assert "application/json" in json_res.headers["content-type"]

def test_react_spa_served():
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "PhishHunter Live" in res.text
