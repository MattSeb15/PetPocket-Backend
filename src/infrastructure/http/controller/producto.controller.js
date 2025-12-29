const productoCtl = {};
const orm = require('../../Database/dataBase.orm.js');
const sql = require('../../Database/dataBase.sql.js');
const mongo = require('../../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../../../application/controller/encrypDates.js');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar:', error);
        return '';
    }
};
// Mostrar todos los productos activos
productoCtl.mostrarProductos = async (req, res) => {
    try {
        const [listaProductos] = await sql.promise().query(`
            SELECT * FROM productos 
            WHERE estadoProducto = 'activo'
            ORDER BY createProducto DESC
        `);

        const productosCompletos = await Promise.all(
            listaProductos.map(async (producto) => {
                const productoMongo = await mongo.productoModel.findOne({ 
                    idProductoSql: producto.idProducto.toString()
                });

                return {
                    ...producto,
                    nombreProducto: descifrarSeguro(producto.nombreProducto),
                    descripcionProducto: descifrarSeguro(producto.descripcionProducto),
                    categoria: descifrarSeguro(producto.categoria),
                    detallesMongo: productoMongo ? {
                        descripcionLarga: productoMongo.descripcionLarga,
                        usoRecomendado: productoMongo.usoRecomendado,
                        efectosSecundarios: productoMongo.efectosSecundarios,
                        ingredientes: productoMongo.ingredientes,
                        modoAplicacion: productoMongo.modoAplicacion,
                        precauciones: productoMongo.precauciones,
                        imagenes: productoMongo.imagenes,
                        destacado: productoMongo.destacado,
                        stockCritico: productoMongo.stockCritico
                    } : null
                };
            })
        );

        return res.json(productosCompletos);
    } catch (error) {
        console.error('Error al mostrar productos:', error);
        return res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
    }
};

// Crear nuevo producto
productoCtl.crearProducto = async (req, res) => {
    try {
        const { 
            nombreProducto, descripcionProducto, precioProducto, stock, categoria,
            descripcionLarga, usoRecomendado, efectosSecundarios, ingredientes,
            modoAplicacion, precauciones, imagenes, destacado, stockCritico
        } = req.body;

        if (!nombreProducto || !descripcionProducto || precioProducto === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Nombre, descripción, precio y stock son obligatorios' });
        }

        const nuevoProducto = await orm.producto.create({
            nombreProducto: cifrarDatos(nombreProducto),
            descripcionProducto: cifrarDatos(descripcionProducto),
            precioProducto: precioProducto,
            stock: stock,
            categoria: cifrarDatos(categoria || ''),
            estadoProducto: 'activo',
            createProducto: new Date().toLocaleString(),
        });

        await mongo.productoModel.create({
            idProductoSql: nuevoProducto.idProducto.toString(),
            descripcionLarga: descripcionLarga || '',
            usoRecomendado: usoRecomendado || '',
            efectosSecundarios: efectosSecundarios || [],
            ingredientes: ingredientes || [],
            modoAplicacion: modoAplicacion || '',
            precauciones: precauciones || '',
            imagenes: imagenes || [],
            destacado: destacado || false,
            stockCritico: stockCritico || 10
        });

        return res.status(201).json({ 
            message: 'Producto creado exitosamente',
            idProducto: nuevoProducto.idProducto
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ 
            message: 'Error al crear el producto', 
            error: error.message 
        });
    }
};

// Actualizar stock de producto
productoCtl.actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoStock, operacion } = req.body; // operacion: 'suma', 'resta', 'set'

        if (operacion === 'set') {
            await sql.promise().query(
                'UPDATE productos SET stock = ?, updateProducto = ? WHERE idProducto = ?',
                [nuevoStock, new Date().toLocaleString(), id]
            );
        } else if (operacion === 'suma') {
            await sql.promise().query(
                'UPDATE productos SET stock = stock + ?, updateProducto = ? WHERE idProducto = ?',
                [nuevoStock, new Date().toLocaleString(), id]
            );
        } else if (operacion === 'resta') {
            await sql.promise().query(
                'UPDATE productos SET stock = stock - ?, updateProducto = ? WHERE idProducto = ?',
                [nuevoStock, new Date().toLocaleString(), id]
            );
        }

        return res.json({ message: 'Stock actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar stock:', error);
        return res.status(500).json({ message: 'Error al actualizar stock', error: error.message });
    }
};

// Actualizar producto
productoCtl.actualizarProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;
        const {
            nombreProducto, descripcionProducto, precioProducto, stock, categoria,
            descripcionLarga, usoRecomendado, efectosSecundarios, ingredientes,
            modoAplicacion, precauciones, imagenes, destacado, stockCritico
        } = req.body;

        if (!nombreProducto || !descripcionProducto || precioProducto === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Nombre, descripción, precio y stock son obligatorios' });
        }

        // Actualizar en la base de datos SQL
        await orm.producto.update({
            nombreProducto: cifrarDatos(nombreProducto),
            descripcionProducto: cifrarDatos(descripcionProducto),
            precioProducto: precioProducto,
            stock: stock,
            categoria: cifrarDatos(categoria || ''),
            estadoProducto: 'activo',
            updateProducto: new Date().toLocaleString(),
        }, {
            where: { idProducto }
        });

        // Actualizar en la base de datos MongoDB
        await mongo.productoModel.updateOne(
            { idProductoSql: idProducto },
            {
                descripcionLarga: descripcionLarga || '',
                usoRecomendado: usoRecomendado || '',
                efectosSecundarios: efectosSecundarios || [],
                ingredientes: ingredientes || [],
                modoAplicacion: modoAplicacion || '',
                precauciones: precauciones || '',
                imagenes: imagenes || [],
                destacado: destacado || false,
                stockCritico: stockCritico || 10
            }
        );

        return res.json({ message: 'Producto actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({
            message: 'Error al actualizar el producto',
            error: error.message
        });
    }
};
// Eliminar producto (marcar como inactivo)
productoCtl.eliminarProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;

        // Marcar como inactivo en SQL
        await orm.producto.update({
            estadoProducto: 'inactivo',
            updateProducto: new Date().toLocaleString(),
        }, {
            where: { idProducto }
        });

        // Marcar como inactivo en MongoDB
        await mongo.productoModel.updateOne(
            { idProductoSql: idProducto },
            { estado: 'inactivo' }
        );

        return res.json({ message: 'Producto eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return res.status(500).json({
            message: 'Error al eliminar el producto',
            error: error.message
        });
    }
}; 

module.exports = productoCtl;