# Guía de Puesta en Marcha - Electiva Sistema de Monitoreo

## Resumen del Sistema
- **ESP32**: Lee 4 entradas analógicas (GPIO32, 33, 34, 35) y publica datos por MQTT.
- **Mosquitto Broker**: En `192.168.18.102:1883`.
- **Servidor_1 (Node.js)**: Recibe datos MQTT, los reenvía a MongoDB y sirve un frontend.
- **MongoDB**: Base de datos para almacenar las lecturas.
- **Frontend**: Tabla HTML en `http://localhost:8080` para visualizar datos en tiempo real.

---

## Paso 1: Verificar Mosquitto Broker

Asegúrate de que Mosquitto está corriendo en `192.168.18.102` puerto `1883`.

Desde PowerShell, verifica conectividad:
```powershell
# Instala mosquitto-clients si no lo tienes (opcional, solo si quieres probar manualmente)
# choco install mosquitto-clients   (si usas Chocolatey)
# o descárgalo desde: https://mosquitto.org/download/

# Prueba conexión (requiere mosquitto_sub instalado):
mosquitto_sub -h 192.168.18.102 -t "Plc/Esp32" -v
```

---

## Paso 2: Compilación del ESP32 (ya completada ✓)

El firmware fue compilado exitosamente. El archivo binario está en:
```
Esp32\.pio\build\esp32dev\firmware.bin
```

---

## Paso 3: Flashear el ESP32

### Opción A: Usar PlatformIO CLI (recomendado)

1. Conecta el ESP32 a tu PC vía USB.
2. Identifica el puerto COM (ej: COM3, COM4, etc.). En Windows Device Manager busca "CH340" o "USB-SERIAL".
3. Flashea el firmware:

```powershell
cd 'c:\Users\angel\Desktop\Electiva-main\Esp32'
pio run -t upload --upload-port COM3
```

Reemplaza `COM3` con tu puerto real.

4. Una vez flasqueado, abre el monitor serie para ver logs:

```powershell
pio device monitor -p COM3 -b 115200
```

Deberías ver algo como:
```
[ INFO ] MAC: XX:XX:XX:XX:XX:XX
[ INFO ] Conectando a la red WiFi (STA)...
[ INFO ] WiFi conectado (...) dBm IPv4 192.168.x.x
[ INFO ] Intentando conexión al Broker MQTT...
[ INFO ] Conectado al Broker MQTT
```

---

## Paso 4: Montar MongoDB (si no está levantado)

MongoDB debe estar accesible. Por defecto, el servidor intenta conectar a:
```
mongodb://localhost:27017/electiva
```

Si tienes MongoDB corriendo localmente, ya está listo. Si está en otra máquina, actualiza `Servidor_1/.env`:
```env
MONGODB_CNN=mongodb://192.168.18.xxx:27017/electiva
```

---

## Paso 5: Lanzar Servidor_1 (Node.js)

1. Abre PowerShell en la carpeta `Servidor_1`:

```powershell
cd 'c:\Users\angel\Desktop\Electiva-main\Servidor_1'
```

2. Si no instalaste dependencias aún:

```powershell
npm install
```

3. Arranca el servidor:

```powershell
npm start
```

O en modo desarrollo (con recarga automática):

```powershell
npm run dev
```

Verás logs como:
```
[ INFO ] Iniciando Setup
[ INFO ] Setup completado
Servidor corriendo en puerto 8080
MQTT: Conectando al broker MQTT: mqtt://192.168.18.102:1883...
MQTT: Conectado con éxito
MQTT: Suscrito al tópico: Plc/Esp32
```

---

## Paso 6: Acceder al Frontend

Abre tu navegador y ve a:
```
http://localhost:8080
```

Deberías ver una tabla con las columnas:
- `dispositivo_uuid`
- `valor1`, `valor2`, `valor3`, `valor4`
- `fecha`

Haz clic en "Refrescar" para actualizar los datos.

---

## Flujo de Datos

1. **ESP32** publica cada 5 segundos (por defecto `mqtt_time_interval = 5000 ms`):
   ```json
   {
     "dispositivo_uuid": "3b9e2706-54be-43bb-90cd-88d70c455223",
     "valor1": 2048,
     "valor2": 1500,
     "valor3": 3000,
     "valor4": 1024
   }
   ```

2. **Servidor_1** recibe el mensaje MQTT en el tópico `Plc/Esp32`.

3. **mqtt-client.js** lo reenvía a `http://localhost:8080/api/datos` (POST).

4. **API** (`controllers/datos.js`) valida y guarda en MongoDB.

5. **Frontend** consulta `GET /api/datos?limite=20` y muestra los últimos 20 registros.

---

## Troubleshooting

### El ESP32 no se conecta a WiFi
- Verifica SSID y contraseña en `Esp32/include/iot32_settings.hpp`:
  - `wifi_ssid = "FLIA PAZOS"`
  - `wifi_password = "8245662s"`
- Asegúrate de que está en el mismo rango de red que Mosquitto.

### El servidor no conecta a MQTT
- Verifica `Servidor_1/.env`:
  ```env
  MQTT_BROKER=mqtt://192.168.18.102:1883
  ```
- Prueba conectividad manual:
  ```powershell
  mosquitto_sub -h 192.168.18.102 -t "Plc/Esp32" -v
  ```

### El frontend no muestra datos
- Abre la consola del navegador (F12 > Console) y revisa errores.
- Verifica que `Servidor_1` está corriendo y conectado a MongoDB.
- Publica un test manual:
  ```powershell
  mosquitto_pub -h 192.168.18.102 -t "Plc/Esp32" -m "{\"dispositivo_uuid\":\"3b9e2706-54be-43bb-90cd-88d70c455223\",\"valor1\":100,\"valor2\":200,\"valor3\":300,\"valor4\":400}"
  ```

### MongoDB no almacena datos
- Abre Compass o mongo CLI y verifica colección `datos` en base `electiva`.
- Revisa logs del servidor para errores de conexión a BD.

---

## Configuración de Pines ADC (ESP32)

Pines usados para lectura analógica:
- GPIO32 → `valor1`
- GPIO33 → `valor2`
- GPIO34 → `valor3`
- GPIO35 → `valor4`

Rango de valores: 0–4095 (resolución 12-bit).

Si quieres cambiar los pines, edita `Esp32/include/iot32_mqtt.hpp` función `Json()`:
```cpp
int v1 = analogRead(32);  // Cambia el número de GPIO
```

Luego recompila: `pio run` y flashea de nuevo.

---

## Próximos Pasos (Opcionales)

- Añadir gráficas en tiempo real (Chart.js, Plotly).
- Implementar filtros por rango de fechas.
- Configurar alertas si los valores superan umbrales.
- Agregar más dispositivos con UUIDs diferentes.

---

**Última actualización:** 20 de mayo de 2026
