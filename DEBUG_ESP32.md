# Guía de Debugging - ESP32 MQTT ADC

## Pasos para verificar que todo funciona

### 1. **Cargar el código actualizado a la ESP32**
```bash
cd Esp32
pio run -t upload
```

### 2. **Abrir el Monitor Serie**
```bash
pio device monitor -b 115200
```

### 3. **Qué buscar en los logs**

Deberías ver algo como esto cada 2 segundos:

```
[ DEBUG ] ADC32: 1023 | ADC33: 2048 | ADC34: 3072 | ADC35: 4095
[ DEBUG ] JSON: {"dispositivo_uuid":"3b9e2706-54be-43bb-90cd-88d70c455223","valor1":1023,"valor2":2048,"valor3":3072,"valor4":4095}
[ INFO ] Publicando en tópico: Plc/Esp32
[ INFO ] Mensaje: {"dispositivo_uuid":"3b9e2706-54be-43bb-90cd-88d70c455223","valor1":1023,"valor2":2048,"valor3":3072,"valor4":4095}
[ INFO ] ✓ Mensaje publicado exitosamente
```

## Si ves valores siempre iguales

Significa que los pines ADC no tienen entrada. Asegúrate de:

1. **Conectar señales a los pines:**
   - GPIO32 (ADC)
   - GPIO33 (ADC)
   - GPIO34 (ADC)
   - GPIO35 (ADC)

2. **Conectar GND** desde la fuente de señal a GND de la ESP32

3. **Rango de voltaje**: 0-3.3V (si usas 5V, usa divisor de voltaje)

## Si no ves los logs de ADC

Posibles problemas:

1. **mqtt_time_send no está habilitado**
   - Revisa en el monitor serie si dice `mqtt_time_send: 0`
   - Si es así, la ESP32 no va a publicar

2. **mqtt_cloud_enable está deshabilitado**
   - Verifica que diga `mqtt_cloud_enable: 1`

3. **MQTT no conecta**
   - Busca `[ INFO ] Conectado al Broker MQTT` en los logs
   - Si no aparece, hay problema de red/broker

4. **El broker MQTT no está corriendo**
   - Verifica que el broker está corriendo en `192.168.18.102:1883`
   - Intenta:
   ```bash
   mosquitto_sub -h 127.0.0.1 -t "Plc/Esp32"
   ```
   - Si no recibe nada, el broker no está corriendo

## Test Manual desde Terminal

Para probar que todo funciona sin la ESP32:

```bash
mosquitto_pub -h 127.0.0.1 -t "Plc/Esp32" -m "{\"dispositivo_uuid\":\"3b9e2706-54be-43bb-90cd-88d70c455223\",\"valor1\":100,\"valor2\":200,\"valor3\":300,\"valor4\":400}"
```

Y verás aparecer una fila en la tabla web.

## Verificar WiFi

Si la ESP32 está conectada a WiFi:

```
[ INFO ] MAC: AA:BB:CC:DD:EE:FF
[ INFO ] IP: 192.168.18.XXX
[ INFO ] Conectado a SSID: FLIA PAZO
```

Si no ves esto, la ESP32 no tiene WiFi y no puede conectar al broker MQTT.
