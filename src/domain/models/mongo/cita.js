const mongoose = require('mongoose');
const { Schema } = mongoose;

const citaSchema = new Schema({
    idCitaSql: { type: String, required: true },   // ID referenciado desde MySQL
    idCliente: { type: String, required: true },   // ID de cliente (MySQL)
    idMascota: { type: String, required: true },   // ID de mascota (MySQL)

    // Campos adicionales específicos
    motivo: { type: String },                      // Motivo de la cita
    sintomas: { type: String },                    // Descripción de síntomas
    diagnosticoPrevio: { type: String },           // Diagnóstico previo si aplica
    tratamientosAnteriores: [{ type: String }],    // Historial de tratamientos
    estado: {                                       // Estado actual de la cita
        type: String,
        enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
        default: 'pendiente'
    },
    notasAdicionales: { type: String },            // Notas del veterinario o recepcionista
    asistio: { type: Boolean, default: false },    // Confirmación de asistencia
    fechaReal: { type: Date },                     // Fecha y hora real de atención (si difiere)

}, { timestamps: true });

const Cita = mongoose.model('Cita', citaSchema);
module.exports = Cita;
