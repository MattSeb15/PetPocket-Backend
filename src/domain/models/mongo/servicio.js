const mongoose = require('mongoose');
const { Schema } = mongoose;

const servicioSchema = new Schema({
    idServicioSql: { type: String, required: true },  // ID referenciado desde MySQL

    // Campos específicos adicionales
    descripcionExtendida: { type: String },           // Descripción más detallada del servicio
    requisitos: [{ type: String }],                   // Lista de requisitos o condiciones
    duracionMinutos: { type: Number },                // Duración aproximada del servicio
    equipoNecesario: [{ type: String }],              // Equipos o materiales requeridos
    instruccionesPrevias: { type: String },           // Recomendaciones antes del servicio
    instruccionesPosteriores: { type: String },       // Cuidados después del servicio
    etiquetas: [{ type: String }],                    // Tags o categorías (Ej: peluquería, vacunación)
    destacado: { type: Boolean, default: false },     // Para marcar si es un servicio destacado
    imagenUrl: { type: String },                      // URL de imagen promocional del servicio

}, { timestamps: true });                             // createdAt, updatedAt

const Servicio = mongoose.model('Servicio', servicioSchema);
module.exports = Servicio;
