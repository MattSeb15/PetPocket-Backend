const mongoose = require('mongoose');
const { Schema } = mongoose;

const productoSchema = new Schema({
    idProductoSql: { type: String, required: true }, // ID del producto en MySQL

    // Campos específicos adicionales
    descripcionLarga: { type: String },               // Descripción más detallada del producto
    usoRecomendado: { type: String },                 // Instrucciones o recomendaciones de uso
    efectosSecundarios: [{ type: String }],           // Lista de posibles efectos secundarios (medicamentos)
    ingredientes: [{ type: String }],                 // Ingredientes (si aplica)
    modoAplicacion: { type: String },                 // Modo de aplicación (oral, tópico, inyectable)
    precauciones: { type: String },                   // Advertencias o precauciones
    imagenes: [{ type: String }],                     // URLs de imágenes del producto
    destacado: { type: Boolean, default: false },     // Para marcar como producto destacado
    stockCritico: { type: Number },                   // Límite de stock mínimo para alerta

}, { timestamps: true });

const Producto = mongoose.model('Producto', productoSchema);
module.exports = Producto;
