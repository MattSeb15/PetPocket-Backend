const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarServicios, 
    crearServicio, 
    actualizarServicio,
    eliminarServicio
} = require('../controller/servicio.controller');

// Middleware de autenticación (opcional)
// const isLoggedIn = require('../lib/auth');

// Validaciones para crear servicio
const validacionCrearServicio = [
    body('nombreServicio')
        .notEmpty()
        .withMessage('El nombre del servicio es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcionServicio')
        .notEmpty()
        .withMessage('La descripción del servicio es obligatoria')
        .isLength({ min: 10, max: 255 })
        .withMessage('La descripción debe tener entre 10 y 255 caracteres'),
    
    body('precioServicio')
        .isFloat({ min: 0.01 })
        .withMessage('El precio debe ser un número mayor a 0'),
    
    // Validaciones para campos de MongoDB
    body('descripcionExtendida')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('La descripción extendida no puede exceder 1000 caracteres'),
    
    body('requisitos')
        .optional()
        .isArray()
        .withMessage('Los requisitos deben ser un array'),
    
    body('duracionMinutos')
        .optional()
        .isInt({ min: 5, max: 480 })
        .withMessage('La duración debe ser entre 5 y 480 minutos'),
    
    body('equipoNecesario')
        .optional()
        .isArray()
        .withMessage('El equipo necesario debe ser un array'),
    
    body('instruccionesPrevias')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las instrucciones previas no pueden exceder 500 caracteres'),
    
    body('instruccionesPosteriores')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las instrucciones posteriores no pueden exceder 500 caracteres'),
    
    body('etiquetas')
        .optional()
        .isArray()
        .withMessage('Las etiquetas deben ser un array'),
    
    body('destacado')
        .optional()
        .isBoolean()
        .withMessage('Destacado debe ser verdadero o falso'),
    
    body('imagenUrl')
        .optional()
        .isURL()
        .withMessage('La imagen debe ser una URL válida')
];

// Validaciones para actualizar servicio
const validacionActualizarServicio = [
    param('idServicio')
        .isInt({ min: 1 })
        .withMessage('El ID del servicio debe ser un número entero positivo'),
    
    ...validacionCrearServicio
];

// Validación para eliminar servicio
const validacionEliminarServicio = [
    param('idServicio')
        .isInt({ min: 1 })
        .withMessage('El ID del servicio debe ser un número entero positivo')
];

// ================ RUTAS DE SERVICIOS ================

// Obtener todos los servicios
router.get('/lista', mostrarServicios);

// Obtener servicios destacados
router.get('/destacados', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener servicios destacados' });
});

// Obtener servicios por categoría/etiqueta
router.get('/categoria/:categoria', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener servicios por categoría' });
});

// Obtener servicio por ID
router.get('/obtener/:idServicio', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener servicio por ID' });
});

// Buscar servicios
router.get('/buscar', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para buscar servicios' });
});

// Crear nuevo servicio
router.post('/crear', validacionCrearServicio, crearServicio);

// Actualizar servicio existente
router.put('/actualizar/:idServicio', validacionActualizarServicio, actualizarServicio);

// Eliminar (desactivar) servicio
router.delete('/eliminar/:idServicio', validacionEliminarServicio, eliminarServicio);

// Cambiar estado de servicio
router.put('/cambiar-estado/:idServicio', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para cambiar estado de servicio' });
});

module.exports = router;