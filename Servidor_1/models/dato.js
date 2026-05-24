const { Schema, model } = require('mongoose');

const DatoSchema = Schema({
    dispositivo_uuid: {
        type: String,
        required: [true, 'El UUID del dispositivo es obligatorio'],
        ref: 'Dispositivo' // Opcional: permite usar populate si se busca por uuid manualmente
    },
    valor1: {
        type: Number,
        required: [true, 'El valor1 del sensor es obligatorio']
    },
    valor2: {
        type: Number,
        required: [true, 'El valor2 del sensor es obligatorio']
    },
    valor3: {
        type: Number,
        required: [true, 'El valor3 del sensor es obligatorio']
    },
    valor4: {
        type: Number,
        required: [true, 'El valor4 del sensor es obligatorio']
    },
    fecha_insercion: {
        type: Date,
        default: Date.now
    }
});

// Limpiar la respuesta JSON
DatoSchema.methods.toJSON = function() {
    const { __v, _id, ...dato } = this.toObject();
    return dato;
}

module.exports = model('Dato', DatoSchema);
