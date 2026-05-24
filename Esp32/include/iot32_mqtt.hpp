#pragma once

#include "iot32_functions.hpp"
#include "iot32_header.hpp"

#include <PubSubClient.h>
#include <WiFi.h>

#include <Wire.h>
#include <Adafruit_ADS1015.h>
#include <ArduinoJson.h>

// -------------------------------------------------------------------
// MQTT
// -------------------------------------------------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// -------------------------------------------------------------------
// ADS1115
// -------------------------------------------------------------------
Adafruit_ADS1115 ads;

// Ganancia ±6.144V
adsGain_t gainSetting = GAIN_TWOTHIRDS;

// Resolución ADS1115 en mV
const float LSB_MV = 0.1875F;

// -------------------------------------------------------------------
char topic[150];
String mqtt_data = "";

long lastMqttReconnectAttempt = 0;
long lastMsg = 0;

void callback(char *topic, byte *payload, unsigned int length);
String Json();

char willTopic[150];

bool willQoS = 0;
bool willRetain = false;

String willMessage = "{\"connected\": false}";

bool cleanSession = true;

// -------------------------------------------------------------------
// Inicializar ADS1115
// -------------------------------------------------------------------
void initADS1115() {

  Wire.begin(14, 13);
  Wire.setClock(400000);

  ads.setGain(gainSetting);
  ads.begin();

  log("[ INFO ] ADS1115 inicializado");
}

// -------------------------------------------------------------------
// LECTURA ESTABLE (FIX CROSSTALK ADS1115)
// -------------------------------------------------------------------
int16_t readStable(uint8_t channel) {

  ads.readADC_SingleEnded(channel); // flush canal
  delay(2);
  return ads.readADC_SingleEnded(channel);
}

// -------------------------------------------------------------------
// MQTT Connect
// -------------------------------------------------------------------
boolean mqtt_connect() {

  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callback);

  log("[ INFO ] Intentando conexión al Broker MQTT...");

  String topic_publish = String(mqtt_topic_publish);
  topic_publish.toCharArray(willTopic, 150);

  const char *client_id = mqtt_cloud_id;

  boolean connected = false;

  if (strlen(mqtt_user) > 0) {

    connected = mqttClient.connect(
        client_id,
        mqtt_user,
        mqtt_password,
        willTopic,
        willQoS,
        willRetain,
        willMessage.c_str(),
        cleanSession);

  } else {

    connected = mqttClient.connect(
        client_id,
        NULL,
        NULL,
        willTopic,
        willQoS,
        willRetain,
        willMessage.c_str(),
        cleanSession);
  }

  if (connected) {

    log("[ INFO ] Conectado al Broker MQTT");

    String topic_subscribe = String(mqtt_topic_subscribe);
    topic_subscribe.toCharArray(topic, 150);

    mqttClient.subscribe(topic, mqtt_qos);

    if (mqtt_status_send) {
      mqttClient.publish(willTopic, "{\"connected\": true}", mqtt_retain);
    }

  } else {

    log(String("[ ERROR ] Fallo conexión MQTT, rc= ") +
        String(mqttClient.state()));

    return 0;
  }

  return 1;
}

// -------------------------------------------------------------------
// CALLBACK
// -------------------------------------------------------------------
void callback(char *topic, byte *payload, unsigned int length) {

  String str_topic(topic);
  String mensaje((char *)payload, length);

  mensaje.trim();

  mqttRX();

  log("[ INFO ] Topico --> " + str_topic);
  log("[ INFO ] Mensaje --> " + mensaje);
}

// -------------------------------------------------------------------
// MQTT PUBLISH
// -------------------------------------------------------------------
void mqtt_publish() {

  String topic = String(mqtt_topic_publish);

  if (strlen(mqtt_custom_message) > 0) {
    mqtt_data = String(mqtt_custom_message);
  } else {
    mqtt_data = Json();
  }

  log("[ INFO ] Publicando en tópico: " + topic);
  log("[ INFO ] Mensaje: " + mqtt_data);

  mqttClient.publish(topic.c_str(), mqtt_data.c_str(), mqtt_retain);

  mqtt_data = "";
  mqttTX();
}

// -------------------------------------------------------------------
// JSON ADS1115 (FIX REAL)
// -------------------------------------------------------------------
String Json() {

  String response;
  DynamicJsonDocument jsonDoc(512);

  jsonDoc["dispositivo_uuid"] = String(mqtt_cloud_id);

  // -----------------------------------------------------------------
  // LECTURA ESTABLE ADS1115
  // -----------------------------------------------------------------
  int16_t adc0 = readStable(0);
  int16_t adc1 = readStable(1);
  int16_t adc2 = readStable(2);
  int16_t adc3 = readStable(3);

  // -----------------------------------------------------------------
  // CONVERSIÓN mV
  // -----------------------------------------------------------------
  float v0_ads = adc0 * LSB_MV;
  float v1_ads = adc1 * LSB_MV;
  float v2_ads = adc2 * LSB_MV;
  float v3_ads = adc3 * LSB_MV;

  // -----------------------------------------------------------------
  // DIVISORES
  // -----------------------------------------------------------------
  float v0_real = v0_ads / (20.0 / (47.0 + 20.0));
  float v1_real = v1_ads / (15.0 / (10.0 + 15.0));
  float v2_real = v2_ads;
  float v3_real = v3_ads;

  // -----------------------------------------------------------------
  // CLEAN VALUES
  // -----------------------------------------------------------------
  if (v0_real < 0) v0_real = 0;
  if (v1_real < 0) v1_real = 0;
  if (v2_real < 0) v2_real = 0;
  if (v3_real < 0) v3_real = 0;

  // ENTEROS (como tu sistema original)
  jsonDoc["valor1"] = (int)v0_real;
  jsonDoc["valor2"] = (int)v1_real;
  jsonDoc["valor3"] = (int)v2_real;
  jsonDoc["valor4"] = (int)v3_real;

  serializeJson(jsonDoc, response);

  // DEBUG
  log("[ DEBUG ] A0: " + String((int)v0_real) + " mV");
  log("[ DEBUG ] A1: " + String((int)v1_real) + " mV");
  log("[ DEBUG ] A2: " + String((int)v2_real) + " mV");
  log("[ DEBUG ] A3: " + String((int)v3_real) + " mV");

  log("[ DEBUG ] JSON: " + response);

  return response;
}

// -------------------------------------------------------------------
// LOOP MQTT
// -------------------------------------------------------------------
void mqttLoop() {

  if (mqtt_cloud_enable) {

    if (!mqttClient.connected()) {

      long now = millis();

      if ((now < 10000) ||
          ((now - lastMqttReconnectAttempt) > 10000)) {

        lastMqttReconnectAttempt = now;

        if (mqtt_connect()) {
          lastMqttReconnectAttempt = 0;
        }

        setOnSingle(MQTTLED);
      }

    } else {

      mqttClient.loop();
      setOffSingle(MQTTLED);
    }
  }
}