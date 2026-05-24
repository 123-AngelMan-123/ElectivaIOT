# Configuración WebSocket en Tiempo Real

## Problema Original
La ESP32 no enviaba los valores con la frecuencia esperada y la interfaz requería refrescar manualmente para ver nuevos datos.

## Solución Implementada
Se implementó un sistema de comunicación en **tiempo real con WebSocket** que permite actualizaciones automáticas cada 2 segundos sin necesidad de refrescar la página.

---

## Cambios Realizados

### 1. **ESP32 (Esp32/include/iot32_settings.hpp)**
- **Cambio**: `mqtt_time_interval` de **5000ms** a **2000ms**
- **Efecto**: La ESP32 ahora envía datos cada 2 segundos por MQTT
- **Ubicaciones modificadas**:
  - `settingsRead()` - línea ~55
  - `settingsReset()` - línea ~85

### 2. **Servidor (Servidor_1/package.json)**
- **Agregada dependencia**: `socket.io@^4.7.2`
- Permite comunicación WebSocket bidireccional entre servidor y cliente

### 3. **Servidor (Servidor_1/lib/server.js)**
- **Agregados**:
  - `const http = require('http')` - Para crear servidor HTTP/WebSocket
  - `const socketIO = require('socket.io')` - Para WebSocket
  - `this.httpServer` - Servidor HTTP que envuelve Express
  - `this.io` - Instancia de Socket.io
  - Método `configurarSocketIO()` - Configura listeners de WebSocket

- **Cambio principal en `listen()`**:
  ```javascript
  // Antes: this.app.listen(this.port, ...)
  // Ahora: this.httpServer.listen(this.port, ...)
  ```
  Esto permite que Socket.io funcione en el mismo puerto que Express.

### 4. **Cliente MQTT (Servidor_1/lib/mqtt-client.js)**
- **Agregados**:
  - `this.io` - Variable para almacenar instancia de Socket.io
  - Método `setSocketIO(io)` - Recibe la instancia desde server.js
  
- **Modificación en `processMessage()`**:
  - Después de guardar datos en la API, ahora emite evento:
  ```javascript
  if (this.io) {
      this.io.emit('nuevoDato', {
          dispositivo_uuid: ...,
          valor1, valor2, valor3, valor4,
          fecha_insercion: new Date().toISOString()
      });
  }
  ```
  - Este evento se envía a **todos los clientes WebSocket conectados**

### 5. **Frontend (Servidor_1/public/index.html)**
- **Completamente rediseñado**:
  - Agregada librería `socket.io-client@4.7.2`
  - Conexión automática al servidor por WebSocket
  - Escucha evento `'nuevoDato'` para actualizaciones en tiempo real
  - Interfaz mejorada con:
    - Indicador de estado de conexión (verde/rojo)
    - Animación de destacado para nuevos datos
    - Botón para cargar historial
    - Botón para limpiar tabla
    - Marca de última actualización
    - Estilos modernos y responsivos

---

## Flujo de Datos

```
ESP32 (cada 2 segundos)
    ↓ MQTT "Plc/Esp32"
Broker MQTT
    ↓
Servidor (mqtt-client.js)
    ↓ Procesa y guarda en BD
API
    ↓ Emite por WebSocket
Socket.io
    ↓
Frontend (navegador)
    ↓ Recibe evento 'nuevoDato'
Tabla actualiza en tiempo real (sin refrescar)
```

---

## Cómo Usar

### 1. **Iniciar el servidor**
```bash
cd Servidor_1
npm install  # Si es la primera vez
npm start
```

### 2. **Acceder a la interfaz**
```
http://localhost:3000
```

### 3. **Verificar conexión**
- Deberías ver el estado: **"🟢 Conectado en tiempo real"**
- Los datos se actualizarán automáticamente cada 2 segundos
- La tabla mostrará las filas más recientes primero

---

## Verificación de Funcionamiento

### En la consola del servidor esperas ver:
```
MQTT: Mensaje recibido en [Plc/Esp32]: {"dispositivo_uuid":"3b9e2706-54be-43bb-90cd-88d70c455223","valor1":1023,"valor2":2048,"valor3":3072,"valor4":4095}
WebSocket: Evento "nuevoDato" emitido a todos los clientes
```

### En la consola del navegador (DevTools):
```
Nuevo dato recibido: {dispositivo_uuid: '...', valor1: 1023, ...}
```

### En la página:
- Última actualización se cambia constantemente
- Nueva fila aparece con animación amarilla
- Las 4 columnas de valores muestran números del ADC

---

## Notas Importantes

1. **La ESP32 debe estar enviando datos por MQTT** al broker en `192.168.18.102:1883`
2. **El servidor debe estar conectado al mismo broker MQTT**
3. **Socket.io mantiene conexión persistente**, por lo que:
   - Los datos llegan en tiempo real
   - No hay retraso de espera
   - Múltiples clientes pueden conectarse simultáneamente
4. **Se mantienen los últimos 50 registros** en la tabla para evitar sobrecarga
5. **El historial se carga con el botón "Cargar Historial"** y trae los últimos 20 registros de la BD

---

## Troubleshooting

### Los datos no aparecen:
1. Verifica que la ESP32 está enviando MQTT
2. Revisa que el broker MQTT está corriendo
3. Abre DevTools (F12) en el navegador y revisa la consola

### El status dice "Desconectado":
1. Verifica que el servidor está corriendo en el puerto correcto
2. Revisa que no hay firewall bloqueando WebSocket
3. Abre la consola del navegador para más detalles de error

### Los valores son siempre iguales:
1. Verifica que los pines ADC (32, 33, 34, 35) están conectados correctamente
2. Revisa el JSON que se envía desde la ESP32
3. Verifica que `mqtt_time_send = true` en settings.json
