#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <WiFi.h>

const byte DNSSERVER_PORT = 53;
DNSServer dnsServer;

IPAddress ap_IPv4(192, 168, 4, 1);
IPAddress ap_subnet(255, 255, 255, 0);

// WiFi.mode(WIFI_STA)      - station mode: the ESP32 connects to an access
// point WiFi.mode(WIFI_AP)       - access point mode: stations can connect to
// the ESP32 WiFi.mode(WIFI_AP_STA)   - access point and a station connected to
// another access point

int wifi_mode = WIFI_STA;
bool wifi_change = false;

unsigned long previousMillisWIFI = 0;
unsigned long previousMillisAP = 0;
unsigned long intervalWIFI = 30000; // 30 Segundos

// http://adminesp32.local
const char *esp_hostname = device_id;

// -------------------------------------------------------------------
// Iniciar WIFI Modo AP
// -------------------------------------------------------------------
void startAP() {
  log("[ INFO ] Iniciando Punto de Acceso (AP)");
  WiFi.softAPConfig(ap_IPv4, ap_IPv4, ap_subnet);
  WiFi.hostname(esp_hostname);
  WiFi.softAP(ap_ssid, ap_password, ap_chanel, ap_visibility, ap_connect);
  log("[ INFO ] WiFi AP " + String(ap_ssid) + " - IP " +
      ipStr(WiFi.softAPIP()));
  dnsServer.setErrorReplyCode(DNSReplyCode::ServerFailure);
  dnsServer.start(DNSSERVER_PORT, "*", ap_IPv4);
  setOnSingle(APLED); // Encender LED de AP
  wifi_mode = WIFI_AP;
}
// -------------------------------------------------------------------
// Iniciar WIFI Modo Estación
// -------------------------------------------------------------------
void startClient() {
  log("\n\n[ ===== INICIANDO CONEXION WiFi ===== ]");
  log("[ INFO ] Conectando a la red WiFi (STA)...");
  log("[ INFO ] SSID: " + String(wifi_ssid));
  log("[ INFO ] Password: " + String(wifi_password));
  
  // Nos aseguramos de que el modo sea AP+STA
  WiFi.mode(WIFI_STA);
  // startAP(); // Iniciamos el AP siempre
  if (wifi_ip_static) {
    if (!WiFi.config(CharToIP(wifi_ipv4), CharToIP(wifi_gateway),
                     CharToIP(wifi_subnet), CharToIP(wifi_dns_primary),
                     CharToIP(wifi_dns_secondary))) {
      log("[ ERROR ] Falló la configuración en Modo Estación");
    }
  }
  WiFi.hostname(esp_hostname);
  WiFi.begin(wifi_ssid, wifi_password);
  log("[ INFO ] Iniciando búsqueda de redes...");
  
  byte b = 0;
  while (WiFi.status() != WL_CONNECTED && b < 60) {
    b++;
    Serial.print(".");
    vTaskDelay(500);
    if (b % 10 == 0) {
      log("[ WARNING ] Intento " + String(b) + "/60 - Estado: " + String(WiFi.status()));
    }
    blinkSingle(100, WIFILED);
  }
  
  log("");
  if (WiFi.status() == WL_CONNECTED) {
    log("[ ===== SUCCESS ===== ]");
    log("[ INFO ] WiFi CONECTADO!");
    log("[ INFO ] SSID: " + String(WiFi.SSID()));
    log("[ INFO ] Señal (RSSI): " + String(WiFi.RSSI()) + " dBm");
    log("[ INFO ] IPv4: " + ipStr(WiFi.localIP()));
    log("[ INFO ] Gateway: " + ipStr(WiFi.gatewayIP()));
    log("[ INFO ] Subnet: " + ipStr(WiFi.subnetMask()));
    blinkRandomSingle(10, 100, WIFILED);
    wifi_mode = WIFI_STA;
    wifi_change = true;
  } else {
    log("[ ===== CONEXION FALLIDA ===== ]");
    log("[ ERROR ] No se pudo conectar al SSID " + String(wifi_ssid));
    log("[ ERROR ] Estado WiFi: " + String(WiFi.status()));
    log("[ ERROR ] Iniciando Punto de Acceso (AP) como alternativa...");
    blinkRandomSingle(10, 100, WIFILED);
    wifi_change = true;
    startAP();
  }
  log("[ ===== FIN CONEXION WiFi ===== ]\n");
}
// -------------------------------------------------------------------
// Setup
// -------------------------------------------------------------------
void wifi_setup() {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  // Siempre intentamos conectar como cliente si hay un SSID
  if (wifi_ssid[0] != '\0') {
    startClient();
    if (WiFi.status() == WL_CONNECTED) {
      log("[ INFO ] WiFI Modo Estación Conectado");
      // Iniciar sincronización de tiempo NTP
      configTime(-18000, 0, "pool.ntp.org", "time.nist.gov");
      log("[ INFO ] Sincronizando hora con NTP...");
    }
  } else {
    // Si no hay SSID, iniciamos solo el AP (aunque el modo sea AP_STA)
    // startAP();
    log("[ INFO ] WiFi en Modo Estación (Sin SSID de cliente)");
  }
  // Iniciar hostname broadcast en modo STA o AP
  if (wifi_mode == WIFI_STA || wifi_mode == WIFI_AP) {
    if (MDNS.begin(esp_hostname)) {
      MDNS.addService("http", "tcp", 80);
    }
  }
}
// -------------------------------------------------------------------
// Loop Modo Estación
// -------------------------------------------------------------------
byte w = 0;
void wifiLoop() {
  unsigned long currentMillis = millis();
  if (WiFi.status() != WL_CONNECTED &&
      (currentMillis - previousMillisWIFI >= intervalWIFI)) {
    w++;
    blinkSingle(100, WIFILED);
    WiFi.disconnect(true);
    WiFi.reconnect();
    previousMillisWIFI = currentMillis;
    // 2 = 1 minuto
    if (w == 2) {
      log("[ INFO ] Cambiando a Modo AP");
      wifi_change = true;
      w = 0;
      startAP();
    } else {
      log("[ WARNING ] SSID " + String(wifi_ssid) + " desconectado ");
    }
  } else {
    blinkSingleAsy(10, 500, WIFILED);
  }
}
// -------------------------------------------------------------------
// Loop Modo AP
// -------------------------------------------------------------------
byte a = 0;
void wifiAPLoop() {
  blinkSingleAsy(5, 100, WIFILED);
  dnsServer.processNextRequest(); // Portal captivo DNS
  unsigned long currentMillis = millis();
  if ((currentMillis - previousMillisAP >= intervalWIFI) && wifi_change) {
    a++;
    previousMillisAP = currentMillis;
    // 20 es igual a 10 minuto
    if (a == 20) {
      log("[ INFO ] Cambiando a Modo Estación");
      wifi_change = false;
      a = 0;
      startClient();
    }
  }
}
