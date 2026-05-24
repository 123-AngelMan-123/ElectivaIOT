#pragma once
#include <Arduino.h>
// -------------------------------------------------------------------
// Definiciones
// -------------------------------------------------------------------
#define WIFILED 12 // GPIO12 LED WIFI
#define MQTTLED 13 // GPIO13 LED MQTT
#define APLED 2    // GPIO2 LED AP
// -------------------------------------------------------------------
// CALCULAR LA CAPACIDAD DEL JSON
// Asistente ArduinoJson: https://arduinojson.org/v6/assistant/
// Documentación: https://arduinojson.org/v6/api/json/deserializejson/
// -------------------------------------------------------------------
const size_t capacitySettings = 2500;
// -------------------------------------------------------------------
// Versión de Firmware desde las variables de entorno platformio.ini
// -------------------------------------------------------------------
#define TEXTIFY(A) #A
#define ESCAPEQUOTE(A) TEXTIFY(A)
String device_fw_version = ESCAPEQUOTE(BUILD_TAG);
// -------------------------------------------------------------------
// Version de Hardware y Fabricante
// -------------------------------------------------------------------
#define device_hw_version "IOTMETREX v1 00000000" // Versión del hardware
#define device_manufacturer "IOTTS"               // Fabricante
// -------------------------------------------------------------------
// Zona configuración Dispositivo
// -------------------------------------------------------------------
boolean device_config_file;    // Identificador para archivo de configuración
char device_config_serial[30]; // Numero de serie de cada Archivo configuración
                               // unico
char device_id[30];            // ID del dispositivo
int device_restart;            // Número de reinicios
// -------------------------------------------------------------------
// Zona configuración WIFI modo Cliente
// -------------------------------------------------------------------
boolean wifi_ip_static;      // Uso de IP Estática DHCP
char wifi_ssid[30];          // Nombre de la red WiFi
char wifi_password[30];      // Contraseña de la Red WiFi
char wifi_ipv4[15];          // Dir IPv4 Estático
char wifi_gateway[15];       // Dir IPv4 Gateway
char wifi_subnet[15];        // Dir IPv4 Subred
char wifi_dns_primary[15];   // Dir IPv4 DNS primario
char wifi_dns_secondary[15]; // Dir IPv4 DNS secundario
// -------------------------------------------------------------------
// Zona configuración WIFI modo AP
// -------------------------------------------------------------------
boolean ap_mode;      // Uso de Modo AP
char ap_ssid[31];     // Nombre del SSID AP
char ap_password[63]; // Contraseña del AP
int ap_chanel;        // Canal AP
int ap_visibility;    // Es visible o no el AP  (0 - Visible  1 - Oculto)
int ap_connect;       // Número de conexiones en el AP máx 8 conexiones ESP32
// -------------------------------------------------------------------
// Zona configuración MQTT
// -------------------------------------------------------------------
boolean mqtt_cloud_enable;      // Habilitar MQTT Broker
char mqtt_cloud_id[50];         // Cliente ID MQTT Broker
char mqtt_user[30];             // Usuario MQTT Broker
char mqtt_password[39];         // Contraseña del MQTT Broker
char mqtt_server[39];           // Servidor del MQTT Broker
int mqtt_port;                  // Puerto servidor MQTT Broker
boolean mqtt_retain;            // Habilitar mensajes retenidos
int mqtt_qos;                   // Calidad del servicio
boolean mqtt_time_send;         // Habilitar en envio de datos
int mqtt_time_interval;         // Tiempo de envio por MQTT en milisegundos
int mqtt_time_unit;             // Unidad de Tiempo (1s, 60m, 3600h)
boolean mqtt_status_send;       // Habilitar en envio de estados
char mqtt_topic_publish[150];   // Topic para publicar
char mqtt_topic_subscribe[150]; // Topic para suscribirse
char mqtt_custom_message[512];  // Mensaje JSON personalizado a publicar
// -------------------------------------------------------------------
// Zona Firmware Update
// -------------------------------------------------------------------
size_t content_len;
#define U_PART U_SPIFFS
// -------------------------------------------------------------------
// Zona EEPROM para contador de reinicios
// -------------------------------------------------------------------
#define Start_Address 0
#define Restart_Address Start_Address + sizeof(int)