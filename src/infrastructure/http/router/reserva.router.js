const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarReservas,
    crearReserva,
    actualizarReserva,
    confirmarReserva,
    cancelarReserva,
    completarReserva,
    calificarReserva,
    obtenerReservasPorCliente,
    obtenerReservasPorEstado,
    obtenerReservasPorFecha,
    obtenerEstadisticas,
    eliminarReserva
} = require('../controller/reserva.controller');

// Validaciones para crear reserva
const validacionCrearReserva = [
    body('idCliente')
        .isInt({ min: 1 })
        .withMessage('El ID del cliente debe ser un número entero positivo'),
    
    body('idServicio')
        .isInt({ min: 1 })
        .withMessage('El ID del servicio debe ser un número entero positivo'),
    
    body('fechaReserva')
        .isISO8601()
        .withMessage('La fecha de reserva debe ser válida (formato ISO 8601)')
        .custom((value) => {
            const fecha = new Date(value);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (fecha < hoy) {
                throw new Error('La fecha de reserva no puede ser anterior a hoy');
            }
            return true;
        }),
    
    body('comentariosCliente')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Los comentarios no pueden exceder 500 caracteres')
];

// Validaciones para actualizar reserva
const validacionActualizarReserva = [
    param('idReserva')
        .isInt({ min: 1 })
        .withMessage('El ID de la reserva debe ser un número entero positivo'),
    
    body('fechaReserva')
        .isISO8601()
        .withMessage('La fecha de reserva debe ser válida (formato ISO 8601)')
        .custom((value) => {
            const fecha = new Date(value);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (fecha < hoy) {
                throw new Error('La fecha de reserva no puede ser anterior a hoy');
            }
            return true;
        }),
    
    body('comentariosCliente')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Los comentarios no pueden exceder 500 caracteres'),
    
    body('estado')
        .optional()
        .isIn(['pendiente', 'confirmada', 'cancelada', 'completada'])
        .withMessage('Estado debe ser: pendiente, confirmada, cancelada o completada'),
    
    body('atendidoPor')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Atendido por no puede exceder 100 caracteres')
];

// Validaciones para cancelar reserva
const validacionCancelarReserva = [
    param('idReserva')
        .isInt({ min: 1 })
        .withMessage('El ID de la reserva debe ser un número entero positivo'),
    
    body('motivoCancelacion')
        .optional()
        .isLength({ max: 300 })
        .withMessage('El motivo de cancelación no puede exceder 300 caracteres')
];

// Validaciones para completar reserva
const validacionCompletarReserva = [
    param('idReserva')
        .isInt({ min: 1 })
        .withMessage('El ID de la reserva debe ser un número entero positivo'),
    
    body('atendidoPor')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Atendido por no puede exceder 100 caracteres'),
    
    body('observaciones')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las observaciones no pueden exceder 500 caracteres')
];

// Validaciones para calificar reserva
const validacionCalificarReserva = [
    param('idReserva')
        .isInt({ min: 1 })
        .withMessage('El ID de la reserva debe ser un número entero positivo'),
    
    body('calificacion')
        .isInt({ min: 1, max: 5 })
        .withMessage('La calificación debe ser un número entre 1 y 5'),
    
    body('comentarioCalificacion')
        .optional()
        .isLength({ max: 300 })
        .withMessage('El comentario de calificación no puede exceder 300 caracteres')
];

// Validaciones para parámetros
const validacionParametroCliente = [
    param('idCliente')
        .isInt({ min: 1 })
        .withMessage('El ID del cliente debe ser un número entero positivo')
];

const validacionParametroEstado = [
    param('estado')
        .isIn(['pendiente', 'confirmada', 'cancelada', 'completada'])
        .withMessage('Estado debe ser: pendiente, confirmada, cancelada o completada')
];

const validacionParametroFecha = [
    param('fecha')
        .isISO8601()
        .withMessage('La fecha debe ser válida (formato YYYY-MM-DD)')
];

const validacionParametroReserva = [
    param('idReserva')
        .isInt({ min: 1 })
        .withMessage('El ID de la reserva debe ser un número entero positivo')
];

// ================ RUTAS DE RESERVAS ================

// Obtener todas las reservas
router.get('/lista', mostrarReservas);

// Obtener estadísticas de reservas
router.get('/estadisticas', obtenerEstadisticas);

// Obtener reservas por cliente
router.get('/cliente/:idCliente', validacionParametroCliente, obtenerReservasPorCliente);

// Obtener reservas por estado
router.get('/estado/:estado', validacionParametroEstado, obtenerReservasPorEstado);

// Obtener reservas por fecha
router.get('/fecha/:fecha', validacionParametroFecha, obtenerReservasPorFecha);

// Obtener reservas del día
router.get('/hoy', (req, res) => {
    req.params.fecha = new Date().toISOString().split('T')[0];
    obtenerReservasPorFecha(req, res);
});

// Obtener reservas de la semana
router.get('/semana', (req, res) => {
    res.json({ message: 'Endpoint para obtener reservas de la semana - Por implementar' });
});

// Crear nueva reserva
router.post('/crear', validacionCrearReserva, crearReserva);

// Actualizar reserva existente
router.put('/actualizar/:idReserva', validacionActualizarReserva, actualizarReserva);

// Confirmar reserva
router.put('/confirmar/:idReserva', validacionParametroReserva, confirmarReserva);

// Cancelar reserva
router.put('/cancelar/:idReserva', validacionCancelarReserva, cancelarReserva);

// Completar reserva
router.put('/completar/:idReserva', validacionCompletarReserva, completarReserva);

// Calificar reserva
router.put('/calificar/:idReserva', validacionCalificarReserva, calificarReserva);

// Eliminar reserva
router.delete('/eliminar/:idReserva', validacionParametroReserva, eliminarReserva);

module.exports = router;