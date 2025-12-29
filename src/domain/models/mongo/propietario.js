const mongoose = require('mongoose');
const { Schema } = mongoose;

const propietarioSchema = new Schema({
    idPropietarioSql: { type: String, required: true }, // ID referenciado desde MySQL

    // Campos adicionales específicos
    direccionDomicilio: { type: String },               // Dirección física del propietario
    telefonoAlternativo: { type: String },              // Teléfono adicional
    preferenciasContacto: {                             // Preferencias de contacto
        type: String,
        enum: ['llamada', 'whatsapp', 'email'],
        default: 'llamada'
    },
    aceptaNotificaciones: { type: Boolean, default: true }, // Consentimiento para recibir alertas
    notasInternas: { type: String },                     // Comentarios del personal
    referencias: [{ type: String }],                     // Referencias o contactos adicionales
    historialDeVisitas: [{
        fecha: Date,
        motivo: String
    }]

}, { timestamps: true });

const Propietario = mongoose.model('Propietario', propietarioSchema);
module.exports = Propietario;
