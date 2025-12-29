const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarFeedbacks,
    crearFeedback,
    responderFeedback,
    obtenerFeedbacksPorCliente,
    obtenerFeedbacksPorCalificacion,
    obtenerEstadisticas,
    obtenerFeedbacksPendientes
} = require('../controller/feedback.controller');

// Validaciones para crear feedback
const validacionCrearFeedback = [
    body('idCliente')
        .isInt({ min: 1 })
        .withMessage('El ID del cliente debe ser un número entero positivo'),
    
    body('comentario')
        .notEmpty()
        .withMessage('El comentario es obligatorio')
        .isLength({ min: 10, max: 1000 })
        .withMessage('El comentario debe tener entre 10 y 1000 caracteres'),
    
    body('calificacion')
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificación debe ser un número entre 1 y 5'),
    
    body('tipo')
        .optional()
        .isIn(['servicio', 'producto', 'atencion', 'otro'])
        .withMessage('Tipo debe ser: servicio, producto, atencion u otro'),
    
    body('anonimo')
        .optional()
        .isBoolean()
        .withMessage('Anónimo debe ser verdadero o falso')
];

// Validaciones para responder feedback
const validacionResponderFeedback = [
    param('idFeedback')
        .isInt({ min: 1 })
        .withMessage('El ID del feedback debe ser un número entero positivo'),
    
    body('respuesta')
        .notEmpty()
        .withMessage('La respuesta es obligatoria')
        .isLength({ min: 10, max: 500 })
        .withMessage('La respuesta debe tener entre 10 y 500 caracteres')
];

// Validaciones para parámetros
const validacionParametroCliente = [
    param('idCliente')
        .isInt({ min: 1 })
        .withMessage('El ID del cliente debe ser un número entero positivo')
];

const validacionParametroCalificacion = [
    param('calificacion')
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificación debe ser un número entre 1 y 5')
];

// ================ RUTAS DE FEEDBACK ================

// Obtener todos los feedbacks
router.get('/lista', mostrarFeedbacks);

// Obtener estadísticas de feedback
router.get('/estadisticas', obtenerEstadisticas);

// Obtener feedbacks pendientes de responder
router.get('/pendientes', obtenerFeedbacksPendientes);

// Obtener feedbacks por cliente
router.get('/cliente/:idCliente', validacionParametroCliente, obtenerFeedbacksPorCliente);

// Obtener feedbacks por calificación
router.get('/calificacion/:calificacion', validacionParametroCalificacion, obtenerFeedbacksPorCalificacion);

// Obtener feedbacks por tipo
router.get('/tipo/:tipo', (req, res) => {
    res.json({ message: 'Endpoint para obtener feedbacks por tipo - Por implementar' });
});

// Obtener feedbacks anónimos
router.get('/anonimos', (req, res) => {
    res.json({ message: 'Endpoint para obtener feedbacks anónimos - Por implementar' });
});

// Crear nuevo feedback
router.post('/crear', validacionCrearFeedback, crearFeedback);

// Responder a un feedback
router.put('/responder/:idFeedback', validacionResponderFeedback, responderFeedback);

module.exports = router;