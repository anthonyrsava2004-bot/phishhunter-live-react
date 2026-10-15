"""
PhishHunter Live - Lanzador de Servidor Unificado (React + FastAPI)
===================================================================
Inicia la API REST de seguridad y sirve la interfaz SOC en React en un único puerto.
"""

import os
import sys
import subprocess
from pathlib import Path

# Configurar salida UTF-8 en consolas Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn

def main():
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    dist_dir = Path(__file__).parent / "frontend" / "dist"
    if not dist_dir.exists():
        print("[INFO] Compilacion de React no detectada. Compilando frontend...")
        frontend_dir = Path(__file__).parent / "frontend"
        res = subprocess.run(["npm", "run", "build"], cwd=str(frontend_dir), shell=True)
        if res.returncode != 0:
            print("[ERROR] Error al compilar el frontend React.")
            sys.exit(1)

    print("\n" + "=" * 65)
    print("[*] PHISHHUNTER LIVE | SOC DEFENSIVO ANTI-QUISHING (REACT)")
    print("=" * 65)
    print(f"[*] Servidor web y API activos en: http://localhost:{port}")
    print(f"[*] Documentacion interactiva OpenAPI: http://localhost:{port}/docs")
    print("=" * 65 + "\n")

    uvicorn.run("api:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    main()
