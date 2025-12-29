const mongoose = require('mongoose');
const { Schema } = mongoose;

const reservaSchema = new Schema({
    idReservaSql: { type: String, required: true }, // ID de la reserva en MySQL
    idCliente: { type: String, required: true },    // ID del cliente en MySQL
    idServicio: { type: String, required: true },   // ID del servicio en MySQL

    // Campos adicionales específicos
    estado: {                                       // Estado de la reserva
        type: String,
        enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
        default: 'pendiente'
    },
    comentariosCliente: { type: String },           // Comentarios del cliente al hacer la reserva
    confirmacionCliente: { type: Boolean, default: false }, // Si el cliente confirmó la reserva
    motivoCancelacion: { type: String },            // Si se canceló, el motivo
    atendidoPor: { type: String },                  // Nombre del personal que atendió
    calificacionPosterior: {                        // Evaluación luego de completar la reserva
        type: Number,
        min: 1,
        max: 5
    }

}, { timestamps: true });

const Reserva = mongoose.model('Reserva', reservaSchema);
module.exports = Reserva;
