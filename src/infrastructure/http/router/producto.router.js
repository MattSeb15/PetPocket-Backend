const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { 
    mostrarProductos, 
    crearProducto, 
    actualizarProducto,
    eliminarProducto,
    actualizarStock
} = require('../controller/producto.controller');

// Middleware de autenticación (opcional)
// const isLoggedIn = require('../lib/auth');

// Validaciones para crear producto
const validacionCrearProducto = [
    body('nombreProducto')
        .notEmpty()
        .withMessage('El nombre del producto es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('descripcionProducto')
        .notEmpty()
        .withMessage('La descripción del producto es obligatoria')
        .isLength({ min: 10, max: 255 })
        .withMessage('La descripción debe tener entre 10 y 255 caracteres'),
    
    body('precioProducto')
        .isFloat({ min: 0.01 })
        .withMessage('El precio debe ser un número mayor a 0'),
    
    body('stock')
        .isInt({ min: 0 })
        .withMessage('El stock debe ser un número entero mayor o igual a 0'),
    
    body('categoria')
        .optional()
        .isLength({ max: 50 })
        .withMessage('La categoría no puede exceder 50 caracteres'),
    
    // Validaciones para campos de MongoDB
    body('descripcionLarga')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('La descripción larga no puede exceder 1000 caracteres'),
    
    body('usoRecomendado')
        .optional()
        .isLength({ max: 500 })
        .withMessage('El uso recomendado no puede exceder 500 caracteres'),
    
    body('efectosSecundarios')
        .optional()
        .isArray()
        .withMessage('Los efectos secundarios deben ser un array'),
    
    body('ingredientes')
        .optional()
        .isArray()
        .withMessage('Los ingredientes deben ser un array'),
    
    body('modoAplicacion')
        .optional()
        .isLength({ max: 300 })
        .withMessage('El modo de aplicación no puede exceder 300 caracteres'),
    
    body('precauciones')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las precauciones no pueden exceder 500 caracteres'),
    
    body('imagenes')
        .optional()
        .isArray()
        .withMessage('Las imágenes deben ser un array'),
    
    body('destacado')
        .optional()
        .isBoolean()
        .withMessage('Destacado debe ser verdadero o falso'),
    
    body('stockCritico')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El stock crítico debe ser un número entero mayor o igual a 0')
];

// Validaciones para actualizar producto
const validacionActualizarProducto = [
    param('idProducto')
        .isInt({ min: 1 })
        .withMessage('El ID del producto debe ser un número entero positivo'),
    
    ...validacionCrearProducto
];

// Validaciones para actualizar stock
const validacionActualizarStock = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID del producto debe ser un número entero positivo'),
    
    body('nuevoStock')
        .isInt({ min: 0 })
        .withMessage('El nuevo stock debe ser un número entero mayor o igual a 0'),
    
    body('operacion')
        .isIn(['suma', 'resta', 'set'])
        .withMessage('La operación debe ser: suma, resta o set')
];

// Validación para eliminar producto
const validacionEliminarProducto = [
    param('idProducto')
        .isInt({ min: 1 })
        .withMessage('El ID del producto debe ser un número entero positivo')
];

// ================ RUTAS DE PRODUCTOS ================

// Obtener todos los productos
router.get('/lista', mostrarProductos);

// Obtener productos destacados
router.get('/destacados', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener productos destacados' });
});

// Obtener productos por categoría
router.get('/categoria/:categoria', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener productos por categoría' });
});

// Obtener productos con stock bajo
router.get('/stock-bajo', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener productos con stock bajo' });
});

// Obtener producto por ID
router.get('/obtener/:idProducto', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para obtener producto por ID' });
});

// Buscar productos
router.get('/buscar', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para buscar productos' });
});

// Crear nuevo producto
router.post('/crear', validacionCrearProducto, crearProducto);

// Actualizar producto existente
router.put('/actualizar/:idProducto', validacionActualizarProducto, actualizarProducto);

// Actualizar stock de producto
router.put('/actualizar-stock/:id', validacionActualizarStock, actualizarStock);

// Eliminar (desactivar) producto
router.delete('/eliminar/:idProducto', validacionEliminarProducto, eliminarProducto);

// Cambiar estado de producto
router.put('/cambiar-estado/:idProducto', (req, res) => {
    // Implementar en el controlador si es necesario
    res.json({ message: 'Endpoint para cambiar estado de producto' });
});

module.exports = router;