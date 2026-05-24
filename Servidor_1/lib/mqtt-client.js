const mqtt = require('mqtt');
const axios = require('axios');

/**
 * Cliente MQTT para recibir datos del ESP32 y enviarlos a la API principal.
 */
class MqttClient {

    constructor() {
        this.broker = process.env.MQTT_BROKER || 'mqtt://192.168.18.102:1883';
        this.topic = process.env.MQTT_TOPIC || 'Plc/Esp32';
        this.apiUrl = process.env.API_URL || 'http://localhost:8080/api/datos';
        this.user = process.env.MQTT_USER;
        this.pass = process.env.MQTT_PASS;
        this.client = null;
        this.io = null; // Socket.io instance
    }

    /**
     * Establece la instancia de Socket.io para emitir eventos a los clientes
     * @param {Object} io - Instancia de Socket.io
     */
    setSocketIO(io) {
        this.io = io;
        console.log('Socket.io configurado en MqttClient');
    }

    /**
     * Inicializa la conexión y suscribe al tópico.
     */
    connect() {
        console.log(`Conectando al broker MQTT: ${this.broker}...`);
        
        const options = {};
        if (this.user) options.username = this.user;
        if (this.pass) options.password = this.pass;

        this.client = mqtt.connect(this.broker, options);

        this.client.on('connect', () => {
            console.log('MQTT: Conectado con éxito');
            this.client.subscribe(this.topic, (err) => {
                if (!err) {
                    console.log(`MQTT: Suscrito al tópico: ${this.topic}`);
                } else {
                    console.error('MQTT: Error al suscribirse:', err);
                }
            });
        });

        this.client.on('message', (topic, message) => {
            // message is Buffer
            const payload = message.toString();
            console.log(`MQTT: Mensaje recibido en [${topic}]: ${payload}`);
            
            this.processMessage(payload);
        });

        this.client.on('error', (err) => {
            console.error('MQTT: Error en la conexión:', err);
        });
    }

    /**
     * Procesa el mensaje recibido y lo envía a la API.
     * @param {string} messagePayload - JSON string recibido del ESP32.
     */
    async processMessage(messagePayload) {
        try {
            console.log('DEBUG: processMessage iniciado con:', messagePayload);
            
            const data = JSON.parse(messagePayload);
            console.log('DEBUG: JSON parseado:', data);
            
            // Validar que el objeto tenga lo necesario (dispositivo_uuid y valores)
            const hasSingleValor = data.valor !== undefined;
            const hasFourValores = data.valor1 !== undefined && data.valor2 !== undefined && data.valor3 !== undefined && data.valor4 !== undefined;

            if (!data.dispositivo_uuid || (!hasSingleValor && !hasFourValores)) {
                console.warn('MQTT: El mensaje recibido no tiene el formato correcto. Se requiere {dispositivo_uuid} y {valor} o {valor1..valor4}');
                return;
            }

            console.log(`MQTT: Reenviando dato a la API: ${this.apiUrl}...`);
            
            // Normalizar: si vienen valor1..valor4, enviar tal cual; si viene valor, enviar como valor1
            let bodyToSend = {};
            
            if (hasFourValores) {
                bodyToSend = {
                    dispositivo_uuid: data.dispositivo_uuid,
                    valor1: data.valor1,
                    valor2: data.valor2,
                    valor3: data.valor3,
                    valor4: data.valor4
                };
            } else {
                bodyToSend = {
                    dispositivo_uuid: data.dispositivo_uuid,
                    valor1: data.valor,
                    valor2: null,
                    valor3: null,
                    valor4: null
                };
            }

            console.log(`MQTT: Enviando a API:`, JSON.stringify(bodyToSend));
            const resp = await axios.post(this.apiUrl, bodyToSend);
            
            console.log('MQTT: Respuesta de la API:', resp.data);

            // Emitir los datos a todos los clientes conectados via WebSocket
            if (this.io) {
                this.io.emit('nuevoDato', {
                    dispositivo_uuid: bodyToSend.dispositivo_uuid,
                    valor1: bodyToSend.valor1,
                    valor2: bodyToSend.valor2,
                    valor3: bodyToSend.valor3,
                    valor4: bodyToSend.valor4,
                    fecha_insercion: new Date().toISOString()
                });
                console.log('WebSocket: Evento "nuevoDato" emitido a todos los clientes');
            }

        } catch (error) {
            console.error('Error al procesar mensaje MQTT o reenviar a API:', error.message);
            console.error('Stack:', error.stack);
            if (error.response) {
                console.error('Detalle del error de la API:', error.response.data);
            }
        }
    }
}

module.exports = new MqttClient();
