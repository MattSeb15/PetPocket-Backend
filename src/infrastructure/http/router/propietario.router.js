const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarPropietarios, 
    crearPropietario, 
    actualizarPropietario,
    eliminarPropietario
} = require('../controller/propietario.controller');

// Middleware de autenticación (opcional)
// const isLoggedIn = require('../lib/auth');

// Validaciones para crear propietario
const validacionCrearPropietario = [
    body('nombrePropietario')
        .notEmpty()
        .withMessage('El nombre del propietario es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    
    body('cedulaPropietario')
        .notEmpty()
        .withMessage('La cédula del propietario es obligatoria')
        .isLength({ min: 8, max: 15 })
        .withMessage('La cédula debe tener entre 8 y 15 caracteres')
        .matches(/^[0-9]+$/)
        .withMessage('La cédula solo puede contener números'),
    
    body('emailPropietario')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    // Validaciones para campos de MongoDB
    body('direccionDomicilio')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres'),
    
    body('telefonoAlternativo')
        .optional()
        .isMobilePhone()
        .withMessage('Debe ser un número de teléfono válido'),
    
    body('preferenciasContacto')
        .optional()
        .isIn(['llamada', 'whatsapp', 'email'])
        .withMessage('Preferencia de contacto debe ser: llamada, whatsapp o email'),
    
    body('aceptaNotificaciones')
        .optional()
        .isBoolean()
        .withMessage('Acepta notificaciones debe ser verdadero o falso'),
    
    body('notasInternas')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas internas no pueden exceder 500 caracteres'),
    
    body('referencias')
        .optional()
        .isArray()
        .withMessage('Las referencias deben ser un array')
];

// Validaciones para actualizar propietario
const validacionActualizarPropietario = [
    param('idPropietario')
        .isInt({ min: 1 })
        .withMessage('El ID del propietario debe ser un número entero positivo'),
    
    ...validacionCrearPropietario
];

// Validación para eliminar propietario
const validacionEliminarPropietario = [
    param('idPropietario')
        .isInt({ min: 1 })
        .withMessage('El ID del propietario debe ser un número entero positivo')
];

// Validación para buscar propietario
const validacionBuscarPropietario = [
    body('termino')
        .notEmpty()
        .withMessage('El término de búsqueda es obligatorio')
        .isLength({ min: 2 })
        .withMessage('El término debe tener al menos 2 caracteres')
];

// ================ RUTAS DE PROPIETARIOS ================

// Obtener todos los propietarios
router.get('/lista', mostrarPropietarios);

// Obtener propietario por ID
router.get('/obtener/:idPropietario', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener propietario por ID' });
});

// Buscar propietarios por nombre, cédula o email
router.post('/buscar', validacionBuscarPropietario, (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para buscar propietarios' });
});

// Obtener propietarios con más mascotas
router.get('/top-propietarios', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener propietarios con más mascotas' });
});

// Obtener historial de un propietario
router.get('/historial/:idPropietario', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener historial del propietario' });
});

// Obtener mascotas de un propietario
router.get('/:idPropietario/mascotas', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener mascotas del propietario' });
});

// Obtener citas de un propietario
router.get('/:idPropietario/citas', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener citas del propietario' });
});

// Verificar si existe propietario por cédula
router.get('/verificar-cedula/:cedula', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para verificar existencia por cédula' });
});

// Estadísticas de propietarios
router.get('/estadisticas', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener estadísticas de propietarios' });
});

// Crear nuevo propietario
router.post('/crear', validacionCrearPropietario, crearPropietario);

// Actualizar propietario existente
router.put('/actualizar/:idPropietario', validacionActualizarPropietario, actualizarPropietario);

// Cambiar preferencias de notificación
router.put('/preferencias-notificacion/:idPropietario', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para cambiar preferencias de notificación' });
});

// Agregar nota interna
router.put('/agregar-nota/:idPropietario', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para agregar nota interna' });
});

// Eliminar (desactivar) propietario
router.delete('/eliminar/:idPropietario', validacionEliminarPropietario, eliminarPropietario);

// Cambiar estado de propietario
router.put('/cambiar-estado/:idPropietario', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para cambiar estado de propietario' });
});

module.exports = router;