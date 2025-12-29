const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { 
    mostrarAuditorias,
    crearAuditoria,
    obtenerAuditoriasPorUsuario,
    obtenerAuditoriasPorFecha,
    obtenerEstadisticas,
    limpiarAuditoriasAntiguas
} = require('../controller/auditoria.controller');

// Validaciones para crear auditoría
const validacionCrearAuditoria = [
    body('accion')
        .notEmpty()
        .withMessage('La acción es obligatoria')
        .isLength({ min: 1, max: 255 })
        .withMessage('La acción debe tener entre 1 y 255 caracteres'),
    
    body('idUsuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El ID del usuario debe ser un número entero positivo'),
    
    body('detalles')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Los detalles no pueden exceder 1000 caracteres')
];

// Validaciones para parámetros
const validacionParametroUsuario = [
    param('idUsuario')
        .isInt({ min: 1 })
        .withMessage('El ID del usuario debe ser un número entero positivo')
];

// Validaciones para consulta por fechas
const validacionConsultaFechas = [
    query('fechaInicio')
        .isISO8601()
        .withMessage('Fecha de inicio debe ser una fecha válida (ISO 8601)'),
    
    query('fechaFin')
        .isISO8601()
        .withMessage('Fecha de fin debe ser una fecha válida (ISO 8601)')
        .custom((fechaFin, { req }) => {
            if (new Date(fechaFin) < new Date(req.query.fechaInicio)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
            return true;
        })
];

// Validaciones para limpiar auditorías
const validacionLimpiarAuditorias = [
    body('dias')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Los días deben ser un número entre 1 y 365')
];

// Validaciones para paginación
const validacionPaginacion = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
];

// ================ RUTAS DE AUDITORÍA ================

// Obtener todas las auditorías con paginación y filtros
router.get('/lista', validacionPaginacion, mostrarAuditorias);

// Obtener estadísticas de auditoría
router.get('/estadisticas', obtenerEstadisticas);

// Obtener auditorías por usuario
router.get('/usuario/:idUsuario', validacionParametroUsuario, validacionPaginacion, obtenerAuditoriasPorUsuario);

// Obtener auditorías por rango de fechas
router.get('/por-fecha', validacionConsultaFechas, obtenerAuditoriasPorFecha);

// Obtener auditorías por acción específica
router.get('/accion/:accion', (req, res) => {
    res.json({ message: 'Endpoint para obtener auditorías por acción - Por implementar' });
});

// Crear nueva auditoría manualmente
router.post('/crear', validacionCrearAuditoria, crearAuditoria);

// Limpiar auditorías antiguas
router.delete('/limpiar', validacionLimpiarAuditorias, limpiarAuditoriasAntiguas);

module.exports = router;