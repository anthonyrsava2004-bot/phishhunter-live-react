"""
PhishHunter Live - Catálogo de Firmas de Amenazas y Entidades Legítimas
=============================================================================
Alineado con:
- NIST SP 800-63B (Identificación de Typosquatting e Impersonación)
- MITRE ATT&CK T1583.001 (Acquire Infrastructure: Domains)
- MITRE ATT&CK T1566.002 (Phishing: Spearphishing Link / Quishing)
- CIS Controls v8 4.1 (Configuraciones Seguras y Control de TLDs de Riesgo)
- RFC 5890 (Internationalized Domain Names in Applications - IDNA)
"""

import os
import socket
from typing import Any, Dict, List, Optional, Set, Tuple
import unicodedata
import requests

# ---------------------------------------------------------------------------
# Catálogo de Entidades Legítimas Protegidas (Banca, FinTech, Big Tech, Envíos)
# Usadas como baseline contra ataques de Typosquatting y Suplantación de Marca
# ---------------------------------------------------------------------------
LEGITIMATE_TARGETS: Dict[str, List[str]] = {
    "Banca y FinTech Perú": [
        "viabcp.com",
        "bcp.com.pe",
        "interbank.pe",
        "bbva.pe",
        "scotiabank.com.pe",
        "banbif.com.pe",
        "bancopichincha.pe",
        "bancofalabella.pe",
        "bn.com.pe",
        "yape.com.pe",
        "plin.pe",
        "dinersclub.pe",
    ],
    "Entidades de Gobierno y Trámites Perú": [
        "sunat.gob.pe",
        "gob.pe",
        "reniec.gob.pe",
        "serpost.com.pe",
        "essalud.gob.pe",
        "onpe.gob.pe",
    ],
    "Banca y FinTech LATAM": [
        "bancolombia.com",
        "davivienda.com",
        "nequi.com.co",
        "daviplata.com",
        "bancodechile.cl",
        "bancoestado.cl",
        "santander.cl",
        "banamex.com",
        "bbva.mx",
        "banorte.com",
        "itau.com.br",
        "bradesco.com.br",
        "caixa.gov.br",
        "nubank.com.br",
    ],
    "Banca y Finanzas Global": [
        "chase.com",
        "bankofamerica.com",
        "wellsfargo.com",
        "citi.com",
        "citibank.com",
        "bbva.com",
        "santander.com",
        "hsbc.com",
        "barclays.co.uk",
        "capitalone.com",
        "usbank.com",
        "pnc.com",
    ],
    "Pasarelas de Pago y FinTech": [
        "paypal.com",
        "stripe.com",
        "square.com",
        "mercadopago.com",
        "mercadolibre.com",
        "mercadopago.com.pe",
        "mercadolibre.com.pe",
        "venmo.com",
        "zellepay.com",
        "revolut.com",
        "wise.com",
        "payoneer.com",
    ],
    "Criptomonedas e Intercambios": [
        "binance.com",
        "coinbase.com",
        "metamask.io",
        "kraken.com",
        "crypto.com",
        "kucoin.com",
        "bybit.com",
        "ledger.com",
        "trezor.io",
        "trustwallet.com",
    ],
    "Servicios Corporativos y Cloud": [
        "google.com",
        "accounts.google.com",
        "microsoft.com",
        "login.microsoftonline.com",
        "live.com",
        "office.com",
        "apple.com",
        "icloud.com",
        "amazon.com",
        "aws.amazon.com",
        "meta.com",
        "facebook.com",
        "instagram.com",
        "whatsapp.com",
        "telegram.org",
        "tiktok.com",
        "netflix.com",
        "spotify.com",
        "linkedin.com",
        "github.com",
        "gitlab.com",
        "dropbox.com",
        "salesforce.com",
        "okta.com",
        "auth0.com",
        "zoom.us",
        "adobe.com",
        "steamcommunity.com",
        "steampowered.com",
        "roblox.com",
        "epicgames.com",
    ],
    "Logística, Envíos y Telecomunicaciones": [
        "dhl.com",
        "fedex.com",
        "ups.com",
        "usps.com",
        "correos.es",
        "correos.cl",
        "estafeta.com",
        "verizon.com",
        "att.com",
        "t-mobile.com",
        "vodafone.com",
        "movistar.es",
        "claro.com",
        "pedidosya.com",
        "rappi.com",
    ],
}

# Lista aplanada de todos los dominios protegidos
ALL_PROTECTED_DOMAINS: List[str] = [
    domain for group in LEGITIMATE_TARGETS.values() for domain in group
]

# Nombres de marcas clave protegidas para detección de typosquatting y combosquatting
TARGET_BRAND_KEYWORDS: Set[str] = {
    "bcp", "viabcp", "interbank", "bbva", "scotiabank", "banbif", "pichincha",
    "falabella", "bancodelanacion", "yape", "plin", "sunat", "serpost",
    "paypal", "chase", "bankofamerica", "wellsfargo", "citi", "citibank",
    "santander", "hsbc", "barclays", "bancolombia", "davivienda", "nequi",
    "daviplata", "mercadopago", "mercadolibre", "nubank", "itau", "banorte",
    "banamex", "stripe", "square", "venmo", "zelle", "revolut", "wise",
    "binance", "coinbase", "metamask", "kraken", "trustwallet", "ledger",
    "trezor", "google", "microsoft", "apple", "icloud", "amazon", "netflix",
    "facebook", "instagram", "whatsapp", "telegram", "tiktok", "spotify",
    "steam", "roblox", "epicgames", "dhl", "fedex", "ups", "usps"
}

GENERIC_SUBDOMAINS: Set[str] = {
    "www", "login", "accounts", "aws", "secure", "portal", "auth", "api", "app", "m"
}

PROTECTED_BRAND_NAMES: Set[str] = {
    d.split(".")[0] for d in ALL_PROTECTED_DOMAINS if d.split(".")[0] not in GENERIC_SUBDOMAINS
}.union(TARGET_BRAND_KEYWORDS)

# ---------------------------------------------------------------------------
# Infraestructura Abusada: Túneles Efímeros y DNS Dinámico
# Usados intensivamente por atacantes para desplegar Quishing rápido
# ---------------------------------------------------------------------------
ABUSED_TUNNEL_DDNS_PROVIDERS: Set[str] = {
    "duckdns.org", "ngrok.io", "ngrok-free.app", "trycloudflare.com",
    "loca.lt", "serveo.net", "pagekite.me", "no-ip.com", "ddns.net",
    "hopto.org", "zapto.org", "sytes.net", "mooo.com", "bounceme.net",
    "freeddns.org", "dynu.net", "portmap.io", "telebit.io"
}

# ---------------------------------------------------------------------------
# Plataformas de Alojamiento Gratuito / Serverless abusadas con señuelos
# ---------------------------------------------------------------------------
ABUSED_FREE_HOSTING_PLATFORMS: Set[str] = {
    "pages.dev", "workers.dev", "web.app", "firebaseapp.com", "vercel.app",
    "netlify.app", "000webhostapp.com", "glitch.me", "weebly.com", "wixsite.com",
    "render.com", "onrender.com", "surge.sh", "github.io", "gitlab.io",
    "supabase.co", "fly.dev", "railway.app", "site123.me", "jimdofree.com"
}

# ---------------------------------------------------------------------------
# Acortadores de Enlaces utilizados para enmascarar destinos (Quishing)
# ---------------------------------------------------------------------------
ABUSED_URL_SHORTENERS: Set[str] = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl.at",
    "ow.ly", "buff.ly", "rebrand.ly", "goo.su", "clck.ru", "tiny.cc", "s.id"
}

# ---------------------------------------------------------------------------
# TLDs de Alto Riesgo Estadístico (Abusados recurrentemente en campañas Quishing)
# Fuente: Spamhaus, SURBL, CIS Advisories
# ---------------------------------------------------------------------------
HIGH_RISK_TLDS: Set[str] = {
    "xyz", "top", "live", "buzz", "club", "work", "click", "gq", "cf",
    "tk", "ml", "ga", "rest", "cam", "fit", "icu", "monster", "sbs",
    "cfd", "vip", "space", "quest", "surf", "online", "site", "fun",
    "country", "stream", "bid", "loan", "men", "date", "racing", "win",
    "kim", "party", "review", "trade", "accountant", "faith", "cricket",
    "zip", "mov", "lat", "shop", "beauty", "hair", "mom", "lol", "link",
    "pro", "cc", "ws", "to"
}

# ---------------------------------------------------------------------------
# Puertos Anómalos para Servicios Web Públicos (CIS Controls 4.1)
# Puertos no estándar que sugieren servidores de comando/control o túneles
# ---------------------------------------------------------------------------
ANOMALOUS_PORTS: Set[int] = {
    8080, 8443, 8000, 8888, 4444, 1337, 3000, 5000, 9000, 9999,
    21, 22, 23, 25, 445, 3389, 6667, 7001, 8081, 8088, 8085
}

# ---------------------------------------------------------------------------
# Palabras Clave Sospechosas en Rutas, Query Strings y Subdominios (Lures)
# Español e Inglés: Ingeniería Social y Cosecha de Credenciales
# ---------------------------------------------------------------------------
SUSPICIOUS_PATH_KEYWORDS: Set[str] = {
    # Inglés
    "login", "signin", "log-in", "sign-in", "verify", "verification",
    "account-update", "banking", "secure-auth", "wallet", "2fa", "mfa",
    "billing", "confirm-identity", "passcode", "oauth", "token", "recover",
    "suspended", "unusual-activity", "security-alert", "reactivate",
    "passkey", "reset-password", "validation", "authenticate", "unlock-account",
    "claim-reward", "airdrop", "invoice-pdf", "doc-download", "security-check",
    # Español / LATAM
    "iniciar-sesion", "iniciarsesion", "inicio-sesion", "ingresar", "ingreso",
    "acceso", "acceder", "clave", "contrasena", "actualizar", "actualizacion",
    "verificar", "verificacion", "banca", "bancamovil", "banca-internet",
    "bancainternet", "banca-por-internet", "bloqueo", "desbloqueo", "desbloquear",
    "seguridad", "alerta", "notificacion", "urgente", "confirmar", "confirmacion",
    "reactivar", "reactivacion", "reclamar", "premio", "sorteo", "bono",
    "subsidio", "tarjeta", "cuenta", "cuentas", "datos", "tramite", "validacion",
    "validar", "recuperar", "recuperacion", "seguridad-bancaria", "actualizar-datos"
}

# ---------------------------------------------------------------------------
# Mapeo de Caracteres Confusables (Homoglyphs - Cirílico, Griego vs Latín ASCII)
# RFC 5890 / MITRE ATT&CK T1566.002
# ---------------------------------------------------------------------------
CONFUSABLE_CHARACTERS: Dict[str, str] = {
    # Cirílico minúsculas
    "\u0430": "a",  # Cyrillic small letter a
    "\u0441": "c",  # Cyrillic small letter es
    "\u0435": "e",  # Cyrillic small letter ie
    "\u0456": "i",  # Cyrillic small letter byelorussian-ukrainian i
    "\u0458": "j",  # Cyrillic small letter je
    "\u043e": "o",  # Cyrillic small letter o
    "\u0440": "p",  # Cyrillic small letter er
    "\u0455": "s",  # Cyrillic small letter dze
    "\u0443": "y",  # Cyrillic small letter u
    "\u0445": "x",  # Cyrillic small letter ha
    "\u045d": "i",  # Cyrillic small letter i with grave
    "\u04cf": "l",  # Cyrillic small letter palochka
    "\u0501": "d",  # Cyrillic small letter dze
    "\u051b": "q",  # Cyrillic small letter qa
    # Cirílico mayúsculas
    "\u0410": "A",
    "\u0412": "B",
    "\u0421": "C",
    "\u0415": "E",
    "\u041d": "H",
    "\u0406": "I",
    "\u0408": "J",
    "\u041a": "K",
    "\u041c": "M",
    "\u041e": "O",
    "\u0420": "P",
    "\u0422": "T",
    "\u0425": "X",
    "\u0423": "Y",
    # Griego minúsculas y mayúsculas
    "\u03bf": "o",  # Greek small letter omicron
    "\u03c1": "p",  # Greek small letter rho
    "\u03b1": "a",  # Greek small letter alpha
    "\u03bd": "v",  # Greek small letter nu
    "\u03c4": "t",  # Greek small letter tau
    "\u0391": "A",
    "\u0392": "B",
    "\u0395": "E",
    "\u0397": "H",
    "\u0399": "I",
    "\u039a": "K",
    "\u039c": "M",
    "\u039d": "N",
    "\u039f": "O",
    "\u03a1": "P",
    "\u03a4": "T",
    "\u03a7": "X",
    "\u03a5": "Y",
}


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Calcula la distancia de edición de Levenshtein entre dos cadenas de caracteres.
    Implementación puramente algorítmica O(m*n) sin requerir compiladores externos.
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def calculate_similarity_ratio(s1: str, s2: str) -> float:
    """
    Calcula el ratio de similitud normalizado entre 0.0 y 1.0.
    1.0 indica igualdad idéntica, valores cercanos a 1.0 indican alta probabilidad de Typosquatting.
    """
    max_len = max(len(s1), len(s2))
    if max_len == 0:
        return 1.0
    dist = levenshtein_distance(s1, s2)
    return max(0.0, 1.0 - (dist / max_len))


def extract_base_domain(hostname: str) -> str:
    """
    Extrae el dominio base (dominio.tld) omitiendo subdominios comunes (www, etc.).
    """
    parts = hostname.lower().strip().split(".")
    if len(parts) <= 2:
        return hostname.lower().strip()
    # Soporte para ccTLDs compuestos (ej: co.uk, com.br, com.mx)
    second_level_suffixes = {"co", "com", "org", "net", "edu", "gob", "gov"}
    if len(parts) >= 3 and parts[-2] in second_level_suffixes:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def check_global_reputation_feeds(hostname: str, full_url: str = "") -> Optional[Dict[str, Any]]:
    """
    Verifica en tiempo real si el dominio o URL figura en bases de datos y listas negras
    globales de amenazas activas (Google Safe Browsing, SURBL, Spamhaus DBL).
    """
    if not hostname:
        return None

    clean_host = hostname.lower().strip()
    base_domain = extract_base_domain(clean_host)

    # Si es un dominio oficial legítimo registrado en el catálogo, no consultar
    if clean_host in ALL_PROTECTED_DOMAINS or base_domain in ALL_PROTECTED_DOMAINS:
        return None

    # 1. Google Safe Browsing API v4 (si se provee GOOGLE_SAFE_BROWSING_API_KEY)
    api_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")
    if api_key and full_url:
        try:
            sb_endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}"
            body = {
                "client": {"clientId": "phishhunter-soc", "clientVersion": "2.4"},
                "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": full_url}],
                },
            }
            resp = requests.post(sb_endpoint, json=body, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("matches"):
                    threat_type = data["matches"][0].get("threatType", "SOCIAL_ENGINEERING")
                    return {
                        "source": "Google Safe Browsing v4",
                        "category": threat_type,
                        "description": (
                            f"Google Safe Browsing tiene catalogada y bloqueada activamente esta URL "
                            f"bajo la categoría '{threat_type}'. Bloqueo incondicional de seguridad en navegadores."
                        ),
                    }
        except Exception:
            pass

    # 2. SURBL Multi Feed (DNSBL en tiempo real para detección de Quishing y Phishing)
    for target in (base_domain, clean_host):
        if target and "." in target:
            try:
                query_host = f"{target}.multi.surbl.org"
                res = socket.gethostbyname(query_host)
                if res.startswith("127.0.0."):
                    return {
                        "source": "SURBL Global Anti-Phishing & Malware Feed",
                        "category": f"Blacklist Activa ({res})",
                        "description": (
                            f"El dominio '{target}' figura en las listas negras internacionales de SURBL "
                            f"(código {res}) utilizadas por Google, pasarelas de seguridad y filtros anti-fraude."
                        ),
                    }
            except Exception:
                pass

    # 3. Spamhaus DBL (Domain Blocklist)
    for target in (base_domain, clean_host):
        if target and "." in target:
            try:
                query_host = f"{target}.dbl.spamhaus.org"
                res = socket.gethostbyname(query_host)
                if res.startswith("127.0.1."):
                    return {
                        "source": "Spamhaus DBL Real-time Threat Intelligence",
                        "category": f"Dominio Hostil / Phishing ({res})",
                        "description": (
                            f"El dominio '{target}' está catalogado como host fraudulento en Spamhaus DBL "
                            f"por distribución de phishing o infraestructura maliciosa."
                        ),
                    }
            except Exception:
                pass

    return None
