"""
PhishHunter Live - Motor Heurístico de Inspección Defensiva y Ponderación de Riesgo
=============================================================================
Alineado con:
- ISO/IEC 27001:2022 (A.8.20 Aislamiento, A.8.24 Criptografía)
- OWASP ASVS v4.0 V5.1 (Manejo de Redirecciones / CWE-601)
- NIST SP 800-52 / 63B (Seguridad en Transporte y Mitigación de Typosquatting)
- CIS Controls v8 4.1 (Inspección Estructural y Control de Puertos)
- MITRE ATT&CK T1566.002 / T1583.001
"""

import ipaddress
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import unquote, urlparse

from utils.threat_signatures import (
    ALL_PROTECTED_DOMAINS,
    ANOMALOUS_PORTS,
    CONFUSABLE_CHARACTERS,
    HIGH_RISK_TLDS,
    PROTECTED_BRAND_NAMES,
    TARGET_BRAND_KEYWORDS,
    ABUSED_TUNNEL_DDNS_PROVIDERS,
    ABUSED_FREE_HOSTING_PLATFORMS,
    ABUSED_URL_SHORTENERS,
    SUSPICIOUS_PATH_KEYWORDS,
    calculate_similarity_ratio,
    check_global_reputation_feeds,
    extract_base_domain,
    levenshtein_distance,
)


class HeuristicEngine:
    """
    Motor analítico multicapa para auditoría y evaluación cuantitativa de riesgo
    en amenazas de Quishing.
    """

    def __init__(self):
        # Mapeo rápido de caracteres confusables para detección homógrafa
        self.confusable_chars = CONFUSABLE_CHARACTERS

    def analyze(
        self,
        raw_data: str,
        trace_result: Optional[Dict[str, Any]] = None,
        sandbox_findings: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta la batería integral de controles heurísticos sobre la URL o dato crudo del QR.
        Retorna la matriz de hallazgos, desglose de penalizaciones y Risk Score final (0-100).
        """
        raw_text = raw_data.strip()
        flags: List[Dict[str, Any]] = []

        # Verificar si la carga útil es una URL web o un formato específico (EMVCo, Wi-Fi, etc.)
        from core.url_tracer import URLTracer
        classification = URLTracer.classify_payload(raw_text)

        if not classification["is_web_url"]:
            payload_type = classification["type"]
            if payload_type == "emvco_payment":
                emvco_info = URLTracer.parse_emvco(raw_text)
                return {
                    "risk_score": 0,
                    "risk_level": "SEGURO",
                    "risk_badge": "🟢",
                    "action_recommended": (
                        f"CARGA FINANCIERA VÁLIDA ({emvco_info['network']}): Código QR de pago móvil "
                        f"estandarizado EMVCo ({emvco_info['merchant_city']}, {emvco_info['country_code']}). "
                        f"No contiene hipervínculos web ni representa una amenaza de Quishing por navegación."
                    ),
                    "flags_detected": [],
                    "total_penalties": 0,
                    "target_url": raw_text,
                    "target_hostname": "EMVCo Payment Protocol",
                    "is_web_url": False,
                    "payload_type": "emvco_payment",
                    "emvco_info": emvco_info,
                }
            elif payload_type == "wifi_config":
                return {
                    "risk_score": 0,
                    "risk_level": "SEGURO",
                    "risk_badge": "🟢",
                    "action_recommended": "CONFIGURACIÓN WI-FI: Código QR de credenciales de red inalámbrica sin riesgo de Quishing.",
                    "flags_detected": [],
                    "total_penalties": 0,
                    "target_url": raw_text,
                    "target_hostname": "Wi-Fi Config Protocol",
                    "is_web_url": False,
                    "payload_type": "wifi_config",
                }
            else:
                return {
                    "risk_score": 0,
                    "risk_level": "SEGURO",
                    "risk_badge": "🟢",
                    "action_recommended": "TEXTO PLANO INFORMATIVO: Carga útil no ejecutable sin hipervínculos web activos.",
                    "flags_detected": [],
                    "total_penalties": 0,
                    "target_url": raw_text,
                    "target_hostname": "Plain Text Payload",
                    "is_web_url": False,
                    "payload_type": "plain_text",
                }

        # Si es una URL web navegable, proceder con la inspección heurística completa
        initial_clean_url = classification["url"]
        target_url = trace_result.get("final_url", initial_clean_url) if trace_result else initial_clean_url
        parsed_target = urlparse(target_url if "://" in target_url else f"http://{target_url}")
        parsed_initial = urlparse(initial_clean_url)

        target_hostname = (parsed_target.hostname or "").lower().strip()
        initial_hostname = (parsed_initial.hostname or "").lower().strip()

        # =========================================================================
        # 0. CONTROL: Inteligencia de Amenazas Globales (Google Safe Browsing & SURBL)
        # =========================================================================
        reputation = check_global_reputation_feeds(target_hostname, target_url)
        if not reputation and initial_hostname != target_hostname:
            reputation = check_global_reputation_feeds(initial_hostname, initial_clean_url)

        if reputation:
            flags.append({
                "rule_id": "REPUTATION-BLACKLISTED-THREAT-FEED",
                "name": f"Bloqueo Activo por {reputation['source']}",
                "severity": "CRÍTICA",
                "penalty": 80,
                "standard": "Google Safe Browsing / SURBL / Spamhaus DBL",
                "description": reputation["description"],
                "details": reputation,
            })

        # =========================================================================
        # 1. CONTROL: Detección de Ataques Homógrafos (RFC 5890 / MITRE T1566.002)
        # =========================================================================
        homograph_findings = self._detect_homograph_attack(raw_text, target_hostname)
        if homograph_findings:
            flags.append({
                "rule_id": "HOMOGRAPH-RFC5890",
                "name": "Ataque Homógrafo / Suplantación IDN Detectada",
                "severity": "CRÍTICA",
                "penalty": 45,
                "standard": "RFC 5890 / MITRE ATT&CK T1566.002",
                "description": homograph_findings["description"],
                "details": homograph_findings,
            })

        # =========================================================================
        # 2. CONTROL: Detección de Typosquatting e Impersonación de Marca (NIST SP 800-63B)
        # =========================================================================
        typo_findings = self._detect_typosquatting(target_hostname, target_url)
        if not typo_findings and initial_hostname != target_hostname:
            typo_findings = self._detect_typosquatting(initial_hostname, initial_clean_url)

        if typo_findings:
            flags.append({
                "rule_id": "TYPOSQUAT-NIST800-63B",
                "name": "Impersonación de Marca / Typosquatting Confirmado",
                "severity": "CRÍTICA",
                "penalty": 50,
                "standard": "NIST SP 800-63B / MITRE ATT&CK T1583.001",
                "description": typo_findings["description"],
                "details": typo_findings,
            })

        # =========================================================================
        # 3. CONTROL: Servidor Inaccesible, Caído o Bloqueado por Seguridad
        # =========================================================================
        if trace_result and trace_result.get("unreachable", False):
            err_detail = trace_result.get("error_description", "Servidor no responde o conexión rechazada")
            flags.append({
                "rule_id": "NET-HOST-UNREACHABLE-SUSPICIOUS",
                "name": "Servidor de Destino Inaccesible o Bloqueado",
                "severity": "ALTA",
                "penalty": 40,
                "standard": "CIS Controls v8 4.1 / MITRE ATT&CK T1566",
                "description": (
                    f"El servidor de destino no respondió o la conexión fue abortada ({err_detail}). "
                    f"Comportamiento típico de enlaces fraudulentos bloqueados por proveedores de seguridad, "
                    f"dominios dados de baja por estafa o servidores que bloquean crawlers de inspección."
                ),
            })

        # =========================================================================
        # 4. CONTROL: Auditoría Criptográfica y Transporte (ISO 27001 A.8.24 / NIST SP 800-52)
        # =========================================================================
        crypto_findings = self._audit_cryptography(parsed_target, trace_result)
        for item in crypto_findings:
            flags.append(item)

        # =========================================================================
        # 5. CONTROL: Inspección Estructural y de Infraestructura (CIS Controls v8 4.1)
        # =========================================================================
        structural_findings = self._inspect_url_structure(
            parsed_target, target_url, initial_url=initial_clean_url
        )
        for item in structural_findings:
            flags.append(item)

        # =========================================================================
        # 6. CONTROL: Trazabilidad de Redirecciones Seguras (OWASP ASVS V5.1 / CWE-601)
        # =========================================================================
        if trace_result:
            redirect_findings = self._inspect_redirect_hops(trace_result, initial_hostname, target_hostname)
            for item in redirect_findings:
                flags.append(item)

        # =========================================================================
        # 7. CONTROL: Hallazgos Directos del Sandbox Pasivo (si se proporcionan)
        # =========================================================================
        if sandbox_findings:
            for sf in sandbox_findings:
                flags.append(sf)

        # =========================================================================
        # Cálculo Ponderado de Risk Score con Regla de Severidad Defensiva Estricta
        # =========================================================================
        total_penalty = sum(f["penalty"] for f in flags)
        risk_score = min(100, max(0, total_penalty))

        # Regla de Severidad Defensiva Estricta:
        # 1. Si existe al menos un hallazgo de severidad CRÍTICA -> Mínimo 70 (CRÍTICO)
        # 2. Si existe al menos un hallazgo de severidad ALTA -> Mínimo 35 (SOSPECHOSO)
        has_critical = any(f.get("severity") == "CRÍTICA" for f in flags)
        has_high = any(f.get("severity") == "ALTA" for f in flags)

        if has_critical:
            risk_score = max(risk_score, 70)
        elif has_high:
            risk_score = max(risk_score, 35)

        if risk_score >= 60:
            risk_level = "CRÍTICO / QUISHING"
            risk_badge = "🔴"
            action_recommended = "AISLAMIENTO PREVENTIVO TOTAL: Bloqueo incondicional de hipervínculo y contención en Sandbox."
        elif risk_score >= 20:
            risk_level = "SOSPECHOSO"
            risk_badge = "🟡"
            action_recommended = "PRECAUCIÓN / ALTO RIESGO: Enlace con anomalías de seguridad activas. No ingresar credenciales."
        else:
            risk_level = "SEGURO"
            risk_badge = "🟢"
            action_recommended = "CONFIABLE: No se observan firmas ni anomalías estructurales o criptográficas."

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_badge": risk_badge,
            "action_recommended": action_recommended,
            "flags_detected": flags,
            "total_penalties": total_penalty,
            "target_url": target_url,
            "target_hostname": target_hostname,
        }

    def _detect_homograph_attack(self, raw_input: str, hostname: str) -> Optional[Dict[str, Any]]:
        """
        Identifica caracteres confusables (cirílico, griego) y decodificación Punycode (xn--).
        """
        # Caso 1: Punycode explícito
        if "xn--" in hostname.lower():
            try:
                decoded_puny = hostname.encode("ascii").decode("idna")
                return {
                    "type": "punycode_idn",
                    "original": hostname,
                    "decoded": decoded_puny,
                    "description": (
                        f"El dominio utiliza codificación Punycode ({hostname}) que resuelve "
                        f"a '{decoded_puny}'. Esta técnica oculta caracteres visualmente idénticos "
                        f"para suplantar entidades legítimas (RFC 5890)."
                    ),
                }
            except Exception:
                return {
                    "type": "punycode_malformed",
                    "original": hostname,
                    "description": f"Dominio con prefijo IDN anómalo 'xn--' ({hostname}).",
                }

        # Caso 2: Caracteres no ASCII confusables mezclados en el texto crudo o hostname
        confusable_found = []
        normalized_str = ""
        for char in hostname:
            if char in self.confusable_chars:
                confusable_found.append({
                    "char": char,
                    "latin_equivalent": self.confusable_chars[char],
                    "unicode_code": f"U+{ord(char):04X}",
                })
                normalized_str += self.confusable_chars[char]
            else:
                normalized_str += char

        if confusable_found:
            return {
                "type": "mixed_script_homoglyph",
                "detected_characters": confusable_found,
                "spoofed_string": hostname,
                "apparent_target": normalized_str,
                "description": (
                    f"Se detectaron {len(confusable_found)} caracteres confusables no latinos "
                    f"en el nombre de host '{hostname}' simulando '{normalized_str}'. "
                    f"Patrón clásico de Quishing Homógrafo (MITRE ATT&CK T1566.002)."
                ),
            }

        return None

    def _detect_typosquatting(self, hostname: str, full_url: str = "") -> Optional[Dict[str, Any]]:
        """
        Calcula la distancia de Levenshtein contra marcas y dominios oficiales protegidos,
        e identifica patrones de Combosquatting y falsificación de subdominios.
        Alineado con NIST SP 800-63B y MITRE ATT&CK T1583.001.
        """
        if not hostname:
            return None

        clean_host = hostname.lower().strip()
        base_host = extract_base_domain(clean_host)
        host_stem = base_host.split(".")[0]

        # 1. Si el dominio es exactamente uno de los legítimos protegidos, es oficial
        if clean_host in ALL_PROTECTED_DOMAINS or base_host in ALL_PROTECTED_DOMAINS:
            return None

        # 2. Detección de Falsificación de Subdominios (Subdomain Brand / Domain Spoofing)
        # Ejemplos: paypal.com.seguridad-cuenta.com, bcp.com.pe.actualiza-datos.xyz
        subdomain = clean_host[:-len(base_host)].rstrip(".") if len(clean_host) > len(base_host) else ""
        if subdomain:
            for legit_domain in ALL_PROTECTED_DOMAINS:
                if legit_domain in subdomain:
                    return {
                        "matched_target": legit_domain,
                        "evaluated_domain": clean_host,
                        "description": (
                            f"El subdominio '{subdomain}' simula la dirección oficial '{legit_domain}' "
                            f"para engañar visualmente al usuario mientras el dominio real es '{base_host}'."
                        ),
                    }
            for brand in TARGET_BRAND_KEYWORDS:
                pattern = r"(^|[.-])" + re.escape(brand) + r"([.-]|$)"
                if re.search(pattern, subdomain):
                    return {
                        "matched_target": brand,
                        "evaluated_domain": clean_host,
                        "description": (
                            f"El subdominio contiene el nombre de marca protegida '{brand}' embebido en '{subdomain}' "
                            f"bajo el dominio no oficial '{base_host}' (Subdomain Brand Spoofing)."
                        ),
                    }

        # 3. Comparar contra dominios protegidos completos (Levenshtein distance 1 o 2)
        for legit_domain in ALL_PROTECTED_DOMAINS:
            dist = levenshtein_distance(base_host, legit_domain)
            ratio = calculate_similarity_ratio(base_host, legit_domain)

            # Si la distancia de edición es 1 o 2 sobre un dominio largo (ej: paypa1.com vs paypal.com)
            if dist in (1, 2) and ratio >= 0.78:
                return {
                    "matched_target": legit_domain,
                    "evaluated_domain": base_host,
                    "edit_distance": dist,
                    "similarity": round(ratio * 100, 1),
                    "description": (
                        f"El dominio '{base_host}' presenta una distancia de edición de {dist} "
                        f"(similitud {round(ratio * 100, 1)}%) respecto al dominio oficial '{legit_domain}'. "
                        f"Indicio certero de Typosquatting / Combosquatting (NIST SP 800-63B)."
                    ),
                }

        # 4. Detección de Brand Impersonation / Combosquatting (ej: bcp-seguridad.com, paypal-update.com)
        all_brands = PROTECTED_BRAND_NAMES.union(TARGET_BRAND_KEYWORDS)
        for brand in sorted(all_brands, key=lambda x: len(x), reverse=True):
            if brand in host_stem and host_stem != brand:
                # Si la marca es corta (<= 3 letras como bcp), verificar que esté delimitada por guión o al inicio/fin
                if len(brand) <= 3:
                    if not (host_stem.startswith(brand + "-") or host_stem.endswith("-" + brand) or f"-{brand}-" in host_stem):
                        continue
                return {
                    "matched_target": brand,
                    "evaluated_domain": base_host,
                    "description": (
                        f"El dominio contiene el nombre de marca protegida '{brand}' embebido en '{base_host}'. "
                        f"Patrón sospechoso de combosquatting utilizado para estafas de ingeniería social."
                    ),
                }

        return None

    def _audit_cryptography(
        self, parsed_url: Any, trace_result: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Audita cifrado en tránsito, certificados SSL/TLS y cabeceras HSTS (ISO 27001 A.8.24 / NIST SP 800-52).
        """
        findings = []

        # 1. Protocolo en texto claro (HTTP vs HTTPS)
        if parsed_url.scheme.lower() == "http":
            findings.append({
                "rule_id": "CRYPTO-CLEARTEXT-HTTP",
                "name": "Ausencia de Cifrado en Tránsito (HTTP Plano)",
                "severity": "ALTA",
                "penalty": 30,
                "standard": "ISO/IEC 27001:2022 Control A.8.24 / NIST SP 800-52",
                "description": (
                    "El enlace utiliza protocolo HTTP no cifrado, exponiendo las credenciales y datos "
                    "a interceptación 'Man-in-the-Middle' (MitM)."
                ),
            })

        # 2. Puertos anómalos
        port = parsed_url.port
        if port and port in ANOMALOUS_PORTS:
            findings.append({
                "rule_id": "NET-ANOMALOUS-PORT",
                "name": f"Puerto de Red Anómalo Detectado (:{port})",
                "severity": "ALTA",
                "penalty": 25,
                "standard": "CIS Controls v8 4.1 / NIST SP 800-52",
                "description": (
                    f"El enlace apunta al puerto no convencional :{port}. Los servicios bancarios "
                    f"y corporativos legítimos no emplean puertos no estándar para sus clientes."
                ),
            })

        # 3. Auditoría de certificado SSL si existe información de traza
        if trace_result:
            if not trace_result.get("ssl_valid", True):
                error_msg = trace_result.get("ssl_error_message", "Certificado inválido o revocado")
                findings.append({
                    "rule_id": "CRYPTO-INVALID-TLS",
                    "name": "Fallo Crítico de Validación de Certificado TLS",
                    "severity": "CRÍTICA",
                    "penalty": 40,
                    "standard": "ISO/IEC 27001:2022 Control A.8.24 / NIST SP 800-52",
                    "description": f"El servidor web presentó una infracción criptográfica: {error_msg}.",
                })

            if trace_result.get("has_tls_downgrade", False):
                findings.append({
                    "rule_id": "CRYPTO-TLS-DOWNGRADE",
                    "name": "Degradación Criptográfica de HTTPS a HTTP",
                    "severity": "CRÍTICA",
                    "penalty": 35,
                    "standard": "ISO/IEC 27001:2022 Control A.8.24",
                    "description": (
                        "La cadena de redirecciones degradó la conexión desde un origen HTTPS hacia un "
                        "destino HTTP sin cifrado (SSL Strip / Downgrade Attack)."
                    ),
                })

        return findings

    def _inspect_url_structure(
        self, parsed_url: Any, full_url: str, initial_url: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Inspección morfológica y estructural según CIS Controls v8 4.1 y MITRE ATT&CK.
        """
        findings = []
        hostname = (parsed_url.hostname or "").lower()
        base_host = extract_base_domain(hostname)
        host_stem = base_host.split(".")[0]

        # 1. Uso directo de dirección IP en lugar de FQDN
        is_ip = False
        try:
            ipaddress.ip_address(hostname)
            is_ip = True
        except ValueError:
            is_ip = False

        if is_ip:
            findings.append({
                "rule_id": "STRUCT-DIRECT-IP",
                "name": "Uso Directo de Dirección IP Numérica",
                "severity": "CRÍTICA",
                "penalty": 45,
                "standard": "CIS Controls v8 4.1",
                "description": (
                    f"La URL apunta directamente a la dirección IP '{hostname}' en lugar de un nombre "
                    f"de dominio calificado (FQDN). Técnica típica de campañas de malware y Quishing evasivo."
                ),
            })

        # 2. Infraestructura abusada: Túneles Efímeros y DNS Dinámico
        for ddns in ABUSED_TUNNEL_DDNS_PROVIDERS:
            if hostname == ddns or hostname.endswith("." + ddns):
                findings.append({
                    "rule_id": "INFRA-ABUSED-TUNNEL-DDNS",
                    "name": "Uso de DNS Dinámico o Túnel Efímero de Alto Riesgo",
                    "severity": "ALTA",
                    "penalty": 45,
                    "standard": "MITRE ATT&CK T1583.001 / T1566.002",
                    "description": (
                        f"El enlace está alojado en el proveedor de túnel o DNS dinámico '{ddns}'. "
                        f"Estos servicios son frecuentemente utilizados para Quishing por su carácter desechable y anónimo."
                    ),
                })
                break

        # 3. Infraestructura abusada: Plataformas de Alojamiento Gratuito con Señuelos
        path_query = (parsed_url.path + "?" + parsed_url.query).lower()
        full_text_to_check = f"{hostname} {path_query}"
        matched_lures = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in full_text_to_check]

        for free_host in ABUSED_FREE_HOSTING_PLATFORMS:
            if hostname == free_host or hostname.endswith("." + free_host):
                if matched_lures:
                    findings.append({
                        "rule_id": "INFRA-FREE-HOSTING-LURE",
                        "name": "Alojamiento Gratuito con Señuelo de Acceso/Banca",
                        "severity": "CRÍTICA",
                        "penalty": 45,
                        "standard": "MITRE ATT&CK T1566.002",
                        "description": (
                            f"El enlace utiliza la plataforma gratuita '{free_host}' combinada con términos de acceso "
                            f"o banca ({', '.join(matched_lures[:3])}). Patrón típico de kits de phishing prefabricados."
                        ),
                    })
                break

        # 4. Detección de uso de Acortadores de Enlace
        init_parsed = urlparse(initial_url) if initial_url else parsed_url
        init_host = (init_parsed.hostname or "").lower()
        for shortener in ABUSED_URL_SHORTENERS:
            if init_host == shortener or init_host.endswith("." + shortener):
                findings.append({
                    "rule_id": "STRUCT-URL-SHORTENER-MASK",
                    "name": "Enmascaramiento de Enlace mediante Acortador",
                    "severity": "MEDIA",
                    "penalty": 20,
                    "standard": "OWASP ASVS v4.0 V5.1",
                    "description": (
                        f"El enlace original utiliza el acortador '{shortener}' para ocultar el destino real del enlace, "
                        f"técnica frecuente en Quishing para impedir la inspección visual previa."
                    ),
                })
                break

        # 5. TLDs de alto riesgo
        parts = hostname.split(".")
        if len(parts) >= 2:
            tld = parts[-1].lower()
            if tld in HIGH_RISK_TLDS:
                findings.append({
                    "rule_id": "STRUCT-RISKY-TLD",
                    "name": f"Dominio de Nivel Superior de Alto Riesgo (.{tld})",
                    "severity": "MEDIA",
                    "penalty": 20,
                    "standard": "CIS Controls v8 4.1 / MITRE ATT&CK T1583.001",
                    "description": (
                        f"El TLD '.{tld}' está catalogado con alta tasa de abuso y fraude según "
                        f"inteligencia de amenazas globales por su bajo coste de registro."
                    ),
                })

        # 6. Profundidad excesiva de subdominios (ej. login.security.bank.client.evil.com)
        if len(parts) >= 4 and not is_ip:
            findings.append({
                "rule_id": "STRUCT-EXCESSIVE-SUBDOMAINS",
                "name": f"Profundidad Excesiva de Subdominios ({len(parts)} niveles)",
                "severity": "MEDIA",
                "penalty": 15,
                "standard": "CIS Controls v8 4.1",
                "description": (
                    "El nombre de host presenta una anidación anormal de subdominios, utilizada frecuentemente "
                    "para camuflar marcas en la barra de direcciones de dispositivos móviles."
                ),
            })

        # 7. Credenciales incrustadas en URL (user:pass@host)
        if parsed_url.username or parsed_url.password:
            findings.append({
                "rule_id": "STRUCT-EMBEDDED-CREDENTIALS",
                "name": "Credenciales o Caracteres '@' en Autoridad de URL",
                "severity": "CRÍTICA",
                "penalty": 35,
                "standard": "OWASP ASVS v4.0 V5.1",
                "description": (
                    "La URL incluye credenciales o el delimitador '@' en la autoridad de red, un truco "
                    "conocido para confundir a los usuarios sobre el host real de destino."
                ),
            })

        # 8. Palabras clave de señuelo (lures) en la ruta o query
        matched_keywords = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in path_query]
        if matched_keywords:
            findings.append({
                "rule_id": "STRUCT-LURE-KEYWORDS",
                "name": "Palabras Clave de Cosecha de Credenciales",
                "severity": "MEDIA",
                "penalty": 15,
                "standard": "MITRE ATT&CK T1566.002",
                "description": (
                    f"Se identificaron términos de ingeniería social asociados a robo de credenciales: "
                    f"{', '.join(matched_keywords[:4])}."
                ),
            })

        # 9. Señuelos de Cosecha de Credenciales / Banca en Dominio
        domain_matched_lures = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in host_stem]
        if domain_matched_lures:
            findings.append({
                "rule_id": "STRUCT-DOMAIN-LURES",
                "name": "Términos Sospechosos de Seguridad / Banca en Dominio",
                "severity": "ALTA",
                "penalty": 25,
                "standard": "MITRE ATT&CK T1566.002",
                "description": (
                    f"El nombre de dominio incluye palabras clave de ingeniería social: "
                    f"{', '.join(domain_matched_lures[:3])}."
                ),
            })

        # 10. Ofuscación de caracteres hexadecimales excesivos
        hex_encoded_count = len(re.findall(r"%[0-9a-fA-F]{2}", full_url))
        if hex_encoded_count >= 5:
            findings.append({
                "rule_id": "STRUCT-HEX-OBFUSCATION",
                "name": "Ofuscación URL Hexadecimal Anómala",
                "severity": "MEDIA",
                "penalty": 15,
                "standard": "OWASP ASVS v4.0 V5.1",
                "description": (
                    f"La URL contiene {hex_encoded_count} secuencias de escape percent-encoding, "
                    f"sugiriendo evasión deliberada de escáneres estáticos de seguridad."
                ),
            })

        return findings

    def _inspect_redirect_hops(
        self, trace_result: Dict[str, Any], initial_host: str, target_host: str
    ) -> List[Dict[str, Any]]:
        """
        Inspecciona saltos de redirección, acortadores y bucles (OWASP ASVS V5.1 / CWE-601).
        """
        findings = []
        redirect_count = trace_result.get("redirect_count", 0)

        # 1. Saltos múltiples excesivos (> 2 saltos)
        if redirect_count >= 2:
            findings.append({
                "rule_id": "REDIRECT-CHAIN-EXCESSIVE",
                "name": f"Cadena de Redirección Compleja ({redirect_count} saltos)",
                "severity": "ALTA",
                "penalty": 20,
                "standard": "OWASP ASVS v4.0 V5.1 / CWE-601",
                "description": (
                    f"La petición atravesó {redirect_count} saltos HTTP intermediarios. Los atacantes "
                    f"utilizan cadenas de saltos para evadir pasarelas de correo y filtros de red."
                ),
            })

        # 2. Salto entre dominios cruzados no relacionados (Cross-Domain Pivot)
        if initial_host and target_host and initial_host != target_host and redirect_count > 0:
            init_base = extract_base_domain(initial_host)
            target_base = extract_base_domain(target_host)
            if init_base != target_base:
                findings.append({
                    "rule_id": "REDIRECT-CROSS-DOMAIN-PIVOT",
                    "name": "Pivoteo Entre Dominios No Relacionados (Cross-Domain)",
                    "severity": "ALTA",
                    "penalty": 25,
                    "standard": "OWASP ASVS v4.0 V5.1 / CWE-601",
                    "description": (
                        f"El enlace inicial inició en '{init_base}' pero fue redirigido al dominio "
                        f"completamente diferente '{target_base}'. Patrón habitual de Open Redirects."
                    ),
                })

        # 3. Detección de bucle infinito de redirección
        if trace_result.get("loop_detected", False):
            findings.append({
                "rule_id": "REDIRECT-LOOP-DETECTED",
                "name": "Bucle Cíclico de Redirección Detectado",
                "severity": "MEDIA",
                "penalty": 15,
                "standard": "OWASP ASVS v4.0 V5.1",
                "description": "El servidor generó una redirección cíclica que vuelve sobre sí misma.",
            })

        return findings
