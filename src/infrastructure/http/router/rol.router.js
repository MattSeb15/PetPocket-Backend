const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarRoles,
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerRol,
    buscarRoles,
    cambiarEstado,
    obtenerEstadisticas,
    crearRolesPorDefecto
} = require('../controller/rol.controller');

// Middleware de autenticación (opcional, descomenta si lo necesitas)
// const isLoggedIn = require('../lib/auth');

// Validaciones para crear/actualizar rol
const validacionRol = [
    body('nameRol')
        .notEmpty()
        .withMessage('El nombre del rol es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre del rol debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre del rol solo puede contener letras y espacios'),
    
    body('descriptionRol')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La descripción no puede exceder 255 caracteres')
];

// Validación para parámetros de ID
const validacionId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];

// Validación para cambiar estado
const validacionEstado = [
    body('estado')
        .isIn(['activo', 'inactivo'])
        .withMessage('Estado debe ser: activo o inactivo')
];

// Validación para búsqueda
const validacionBusqueda = [
    param('q')
        .optional()
        .isLength({ min: 2 })
        .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
];

// ================ RUTAS DE ROLES ================

// Obtener todos los roles
router.get('/lista', mostrarRoles);

// Obtener un rol específico por ID
router.get('/obtener/:id', validacionId, obtenerRol);

// Buscar roles por nombre
router.get('/buscar', buscarRoles);

// Obtener estadísticas de roles
router.get('/estadisticas', obtenerEstadisticas);

// Crear nuevo rol
router.post('/crear', validacionRol, crearRol);

// Crear roles por defecto del sistema
router.post('/crear-por-defecto', crearRolesPorDefecto);

// Actualizar rol existente
router.put('/actualizar/:id', validacionId, validacionRol, actualizarRol);

// Cambiar estado de rol
router.put('/cambiar-estado/:id', validacionId, validacionEstado, cambiarEstado);

// Eliminar (desactivar) rol
router.delete('/eliminar/:id', validacionId, eliminarRol);

module.exports = router;