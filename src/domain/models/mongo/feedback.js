const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema({
    idFeedbackSql: { type: String, required: true }, // ID del feedback en MySQL
    idCliente: { type: String, required: true },     // ID del cliente (MySQL)

    // Campos específicos adicionales
    calificacion: {                                  // Calificación del servicio o experiencia
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    tipo: {                                           // Contexto del feedback
        type: String,
        enum: ['servicio', 'producto', 'atencion', 'otro'],
        default: 'servicio'
    },
    anonimo: { type: Boolean, default: false },      // Si el cliente quiso que su comentario sea anónimo
    respondido: { type: Boolean, default: false },   // Si el personal ya respondió al feedback
    respuesta: { type: String },                     // Respuesta del negocio (si existe)

}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
