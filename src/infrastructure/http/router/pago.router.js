const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarPagos, 
    crearPago, 
    actualizarPago,
    obtenerPagosPorCliente,
    obtenerEstadisticas
} = require('../controller/pago.controller');

// Validaciones para crear pago
const validacionCrearPago = [
    body('idCita')
        .isInt({ min: 1 })
        .withMessage('El ID de la cita debe ser un número entero positivo'),
    
    body('monto')
        .isFloat({ min: 0.01 })
        .withMessage('El monto debe ser un número mayor a 0'),
    
    body('metodoPago')
        .isIn(['efectivo', 'tarjeta', 'transferencia', 'otro'])
        .withMessage('Método de pago debe ser: efectivo, tarjeta, transferencia u otro')
];

// Validaciones para actualizar pago
const validacionActualizarPago = [
    param('idPago')
        .isInt({ min: 1 })
        .withMessage('El ID del pago debe ser un número entero positivo'),
    
    body('monto')
        .isFloat({ min: 0.01 })
        .withMessage('El monto debe ser un número mayor a 0'),
    
    body('metodoPago')
        .isIn(['efectivo', 'tarjeta', 'transferencia', 'otro'])
        .withMessage('Método de pago debe ser: efectivo, tarjeta, transferencia u otro'),
    
    body('estadoPago')
        .isIn(['pendiente', 'completado', 'cancelado', 'reembolsado'])
        .withMessage('Estado debe ser: pendiente, completado, cancelado o reembolsado')
];

// Validación para obtener pagos por cliente
const validacionPagosPorCliente = [
    param('idCliente')
        .isInt({ min: 1 })
        .withMessage('El ID del cliente debe ser un número entero positivo')
];

// ================ RUTAS DE PAGOS ================

// Obtener todos los pagos
router.get('/lista', mostrarPagos);

// Obtener estadísticas de pagos
router.get('/estadisticas', obtenerEstadisticas);

// Obtener pagos por cliente
router.get('/cliente/:idCliente', validacionPagosPorCliente, obtenerPagosPorCliente);

// Obtener pagos por método de pago
router.get('/metodo/:metodoPago', (req, res) => {
    res.json({ message: 'Endpoint para obtener pagos por método - Por implementar' });
});

// Obtener pagos por estado
router.get('/estado/:estadoPago', (req, res) => {
    res.json({ message: 'Endpoint para obtener pagos por estado - Por implementar' });
});

// Crear nuevo pago
router.post('/crear', validacionCrearPago, crearPago);

// Actualizar pago existente
router.put('/actualizar/:idPago', validacionActualizarPago, actualizarPago);

module.exports = router;