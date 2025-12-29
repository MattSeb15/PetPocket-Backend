const mongoose = require('mongoose');
const { Schema } = mongoose;

const mascotaSchema = new Schema({
    idMascotaSql: { type: String, required: true },  // ID referenciado desde MySQL
    idPropietario: { type: String, required: true }, // ID del dueño (SQL)

    observaciones: { type: String },  // Comentarios libres

    // Campos específicos
    vacunas: [{ type: String }],      // Lista de vacunas
    pesoKg: { type: Number },         // Peso de la mascota
    color: { type: String },          // Color del pelaje
    raza: { type: String },           // Raza específica     // Edad en años
    esterilizado: { type: Boolean },  // Estado de esterilización
    alergias: [{ type: String }],     // Lista de alergias
    chipIdentificacion: { type: String }, // Código de chip (si tiene)
    ultimaVisita: { type: Date },     // Fecha de última atención veterinaria

}, { timestamps: true });             // createdAt y updatedAt automáticos

const Mascota = mongoose.model('Mascota', mascotaSchema);
module.exports = Mascota;
