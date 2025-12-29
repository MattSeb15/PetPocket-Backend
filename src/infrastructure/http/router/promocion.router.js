const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { 
    mostrarPromociones,
    crearPromocion,
    actualizarPromocion,
    eliminarPromocion,
    obtenerPromocionesActivas,
    obtenerPromocionPorCodigo,
    validarCodigoPromocion,
    obtenerPromocionesProximasAExpirar,
    cambiarEstadoPromocion,
    obtenerEstadisticas
} = require('../controller/promocion.controller');

// Validaciones para crear promoción
const validacionCrearPromocion = [
    body('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria')
        .isLength({ min: 10, max: 500 })
        .withMessage('La descripción debe tener entre 10 y 500 caracteres'),
    
    body('fechaInicio')
        .isISO8601()
        .withMessage('Fecha de inicio debe ser una fecha válida (ISO 8601)'),
    
    body('fechaFin')
        .isISO8601()
        .withMessage('Fecha de fin debe ser una fecha válida (ISO 8601)')
        .custom((fechaFin, { req }) => {
            if (new Date(fechaFin) <= new Date(req.body.fechaInicio)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
            return true;
        }),
    
    body('descuento')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('El descuento debe ser un número entre 0 y 100'),
    
    body('tipoDescuento')
        .optional()
        .isIn(['porcentaje', 'monto_fijo'])
        .withMessage('Tipo de descuento debe ser: porcentaje o monto_fijo'),
    
    body('codigoPromocion')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('El código de promoción debe tener entre 3 y 20 caracteres')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('El código de promoción solo puede contener letras mayúsculas y números')
];

// Validaciones para actualizar promoción
const validacionActualizarPromocion = [
    param('idPromocion')
        .isInt({ min: 1 })
        .withMessage('El ID de la promoción debe ser un número entero positivo'),
    
    ...validacionCrearPromocion,
    
    body('estadoPromocion')
        .optional()
        .isIn(['activa', 'inactiva', 'pausada', 'expirada'])
        .withMessage('Estado debe ser: activa, inactiva, pausada o expirada')
];

// Validaciones para cambiar estado
const validacionCambiarEstado = [
    param('idPromocion')
        .isInt({ min: 1 })
        .withMessage('El ID de la promoción debe ser un número entero positivo'),
    
    body('estado')
        .isIn(['activa', 'inactiva', 'pausada', 'expirada'])
        .withMessage('Estado debe ser: activa, inactiva, pausada o expirada')
];

// Validaciones para código de promoción
const validacionCodigoPromocion = [
    param('codigo')
        .notEmpty()
        .withMessage('El código de promoción es obligatorio')
        .isLength({ min: 3, max: 20 })
        .withMessage('El código debe tener entre 3 y 20 caracteres')
];

// Validaciones para días de expiración
const validacionDiasExpiracion = [
    query('dias')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Los días deben ser un número entre 1 y 365')
];

// Validación para eliminar promoción
const validacionEliminarPromocion = [
    param('idPromocion')
        .isInt({ min: 1 })
        .withMessage('El ID de la promoción debe ser un número entero positivo')
];

// ================ RUTAS DE PROMOCIONES ================

// Obtener todas las promociones
router.get('/lista', mostrarPromociones);

// Obtener estadísticas de promociones
router.get('/estadisticas', obtenerEstadisticas);

// Obtener promociones activas
router.get('/activas', obtenerPromocionesActivas);

// Obtener promociones próximas a expirar
router.get('/proximas-expirar', validacionDiasExpiracion, obtenerPromocionesProximasAExpirar);

// Obtener promoción por código
router.get('/codigo/:codigo', validacionCodigoPromocion, obtenerPromocionPorCodigo);

// Validar código de promoción
router.get('/validar/:codigo', validacionCodigoPromocion, validarCodigoPromocion);

// Obtener promociones por estado
router.get('/estado/:estado', (req, res) => {
    res.json({ message: 'Endpoint para obtener promociones por estado - Por implementar' });
});

// Crear nueva promoción
router.post('/crear', validacionCrearPromocion, crearPromocion);

// Actualizar promoción existente
router.put('/actualizar/:idPromocion', validacionActualizarPromocion, actualizarPromocion);

// Cambiar estado de promoción
router.put('/cambiar-estado/:idPromocion', validacionCambiarEstado, cambiarEstadoPromocion);

// Eliminar (desactivar) promoción
router.delete('/eliminar/:idPromocion', validacionEliminarPromocion, eliminarPromocion);

module.exports = router;