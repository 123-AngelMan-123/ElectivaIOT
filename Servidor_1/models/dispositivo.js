const { Schema, model } = require('mongoose');
const crypto = require('crypto');

const DispositivoSchema = Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    serie: {
        type: String,
        required: [true, 'La serie/MAC es obligatoria'],
        unique: true
    },
    uuid: {
        type: String,
        required: [true, 'El UUID es obligatorio'],
        unique: true,
        default: () => crypto.randomUUID()
    },
    fecha_agregacion: {
        type: Date,
        default: Date.now
    }
});

// Limpiar la respuesta JSON para no mostrar la versión __v
DispositivoSchema.methods.toJSON = function() {
    const { __v, _id, ...dispositivo } = this.toObject();
    return dispositivo;
}

module.exports = model('Dispositivo', DispositivoSchema);
