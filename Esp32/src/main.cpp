// -------------------------------------------------------------------
// Librerías
// -------------------------------------------------------------------
#include <Arduino.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <SPIFFS.h>
#include <TimeLib.h>
// FreeRTOS (para tareas no bloqueantes)
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

// -------------------------------------------------------------------
// Blink task: BlinkEspS3
// Implementa un parpadeo no bloqueante en GPIO1 cada 500 ms usando
// una tarea FreeRTOS. Evita el uso de `delay()` y no interfiere con
// el `loop()` principal.
// Atención: en muchos módulos ESP32, GPIO1 es el TX (Serial). Confirma
// que cambiar su estado no afecte la depuración por serie.
void BlinkEspS3(void *pvParameters) {
  const int ledPin = 1; // GPIO1
  pinMode(ledPin, OUTPUT);
  bool state = false;
  for (;;) {
    state = !state;
    //digitalWrite(ledPin, state ? HIGH : LOW); //descomentar para activar el parpadeo
    Serial.println(String("[BLINK] LED STATE: ") + (state ? "ON" : "OFF"));
    // Espera 500 ms sin bloquear otras tareas
    vTaskDelay(500 / portTICK_PERIOD_MS);
  }
  vTaskDelete(NULL);
}

// -------------------------------------------------------------------
// Archivos *.hpp - Fragmentar el Código
// -------------------------------------------------------------------
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include "iot32_mqtt.hpp"
#include "iot32_settings.hpp"
#include "iot32_wifi.hpp"

// -------------------------------------------------------------------
// Setup
// -------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000); // Esperar a que el monitor serie se conecte
  Serial.flush();
  setCpuFrequencyMhz(160);
  // Memoria EEPROM init
  EEPROM.begin(256);
  // Leer el valor de la memoria
  EEPROM.get(Restart_Address, device_restart);
  device_restart++;
  // Guardar el valor a la memoria
  EEPROM.put(Restart_Address, device_restart);
  EEPROM.commit();
  EEPROM.end();
  log("\n[ INFO ] Iniciando Setup");
  log("[ INFO ] MAC: " + WiFi.macAddress());
  log("[ INFO ] Reinicios " + String(device_restart));
  log("[ INFO ] Setup corriendo en el Core " + String(xPortGetCoreID()));
  
  // Iniciar el SPIFFS
  log("[ INFO ] Inicializando SPIFFS...");
  if (!SPIFFS.begin(true)) {
    log("[ ERROR ] SPIFFS ERROR - Formateando...");
  } else {
    log("[ INFO ] SPIFFS inicializado correctamente");
  }
  
  // Leer el Archivo settings.json
  log("[ INFO ] Leyendo settings.json...");
  if (!settingsRead()) {
    log("[ INFO ] settings.json no existe, creando nuevo...");
    settingsSave();
  } else {
    log("[ INFO ] settings.json cargado correctamente");
  }
  
  // Configuración de los LEDs
  log("[ INFO ] Configurando pines de LEDs...");
  settingPines();
  log("[ INFO ] LEDs configurados");
  initADS1115(); //iniciar el ADS1115
  // Crear la tarea que parpadea GPIO1 sin usar delay() bloqueante
  // Nota: GPIO1 suele ser TX en algunos módulos; confirmar que está disponible para LED.
  log("[ INFO ] Creando tarea de Blink...");
  /*
  xTaskCreatePinnedToCore(
      BlinkEspS3,     // función de la tarea
      "BlinkEspS3",  // nombre para debugging
      2048,            // tamaño de pila en bytes
      NULL,            // parámetro
      1,               // prioridad
      NULL,            // handle de la tarea
      1);              // core (opcional)
  */
  log("[ INFO ] Tarea de Blink comentada temporalmente para debug");
  
  // Setup WIFI
  log("[ INFO ] Inicializando WiFi...");
  wifi_setup();

  log("[ INFO ] Setup completado");
  logMemory();
}
// -------------------------------------------------------------------
// Loop Principal
// -------------------------------------------------------------------
void loop() {
  // -----------------------------------------------------------------
  // WIFI
  // -----------------------------------------------------------------
  if (wifi_mode == WIFI_STA) {
    wifiLoop();
  } else if (wifi_mode == WIFI_AP) {
    wifiAPLoop();
  }
  // -----------------------------------------------------------------
  // MQTT
  // -----------------------------------------------------------------
  if (mqtt_cloud_enable) {
    if (mqtt_server[0] != '\0') {
      // Función para el Loop principla de MQTT
      mqttLoop();
      if (mqttClient.connected() && mqtt_time_send) {
        // Funcion para enviar JSON por MQTT
        if (millis() - lastMsg > mqtt_time_interval) {
          lastMsg = millis();
          mqtt_publish();
        }
      }
    }
  }
}