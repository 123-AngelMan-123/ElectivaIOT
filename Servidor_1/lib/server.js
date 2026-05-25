const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { dbConnection } = require('../database/config');
const mqttClient = require('./mqtt-client');

/**
 * Clase que representa el servidor de la aplicación.
 * Configura los middlewares, las rutas y el puerto de escucha.
 */
class Server {

    constructor() {
        /**
         * Aplicación de Express.
         * @type {express.Application}
         */
        this.app  = express();

        /**
         * Servidor HTTP
         * @type {http.Server}
         */
        this.httpServer = http.createServer(this.app);

        /**
         * Socket.io para comunicación en tiempo real
         * @type {socketIO.Server}
         */
        this.io = socketIO(this.httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

    /**
     * Puerto en el que correrá el servidor. Usa fallback 3000 si no está definida.
     * @type {string|number}
     */
    this.port = process.env.PORT || 3000;

    // Conectar a la base de datos (si la hay)
    this.conectarDB();

    // Inicializar el cliente MQTT
    this.conectarMQTT();

        /**
         * Ruta base para las APIs relacionadas con dispositivos.
         * @type {string}
         */
        this.dispositivosPath = '/api/dispositivos';
        this.datosPath        = '/api/datos';
        this.chatPath         = '/api/chat';

        // Middlewares: Funciones que añaden funcionalidad al web server
        this.middlewares();

        // Rutas de mi aplicación
        this.routes();

        // Configurar Socket.io
        this.configurarSocketIO();
    }

    /**
     * Inicializa la conexión a la base de datos.
     */
    async conectarDB() {
        await dbConnection();
    }

    /**
     * Inicializa el cliente MQTT para recibir datos del ESP32.
     */
    conectarMQTT() {
        mqttClient.connect();
    }

    /**
     * Define y configura los middlewares globales de la aplicación.
     */
    middlewares() {

        // CORS: Habilita el Intercambio de Recursos de Origen Cruzado
        this.app.use( cors() );

        // Lectura y parseo del body: Permite leer JSON en las peticiones
        this.app.use( express.json() );

        // Directorio Público: Define la carpeta para archivos estáticos
        this.app.use( express.static('public') );

    }

    /**
     * Define las rutas de la aplicación vinculando los endpoints con sus archivos de rutas.
     */
    routes() {
        this.app.use( this.dispositivosPath, require('../routes/dispositivos'));
        this.app.use( this.datosPath,        require('../routes/datos'));
        this.app.use( this.chatPath,         require('../routes/chat'));
    }

    /**
     * Inicia el servidor y lo pone a escuchar en el puerto especificado.
     */
    listen() {
        this.httpServer.listen( this.port, '0.0.0.0', () => {
            console.log('Servidor corriendo en puerto', this.port );
            console.log('Accede a: http://localhost:' + this.port);
        });
    }

    /**
     * Configura Socket.io para escuchar conexiones
     */
    configurarSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('Cliente conectado:', socket.id);
            
            socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
            });
        });

        // Pasar la instancia de io al cliente MQTT para emitir datos
        mqttClient.setSocketIO(this.io);
    }

}

module.exports = Server;
