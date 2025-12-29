const promocionCtl = {};
const orm = require('../../Database/dataBase.orm.js');
const sql = require('../../Database/dataBase.sql.js');
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

// Mostrar todas las promociones
promocionCtl.mostrarPromociones = async (req, res) => {
    try {
        const [listaPromociones] = await sql.promise().query(`
            SELECT * FROM promociones 
            ORDER BY createPromocion DESC
        `);

        const promocionesCompletas = listaPromociones.map(promocion => ({
            ...promocion,
            descripcion: descifrarSeguro(promocion.descripcion)
        }));

        return res.json(promocionesCompletas);
    } catch (error) {
        console.error('Error al mostrar promociones:', error);
        return res.status(500).json({ message: 'Error al obtener las promociones', error: error.message });
    }
};

// Crear nueva promoción
promocionCtl.crearPromocion = async (req, res) => {
    try {
        const { descripcion, fechaInicio, fechaFin, descuento, tipoDescuento, codigoPromocion } = req.body;

        if (!descripcion || !fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'Descripción, fecha de inicio y fecha de fin son obligatorios' });
        }

        // Validar que la fecha de fin sea posterior a la de inicio
        if (new Date(fechaFin) <= new Date(fechaInicio)) {
            return res.status(400).json({ message: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }

        const nuevaPromocion = await orm.promocion.create({
            descripcion: cifrarDatos(descripcion),
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            descuento: descuento || 0,
            tipoDescuento: tipoDescuento || 'porcentaje',
            codigoPromocion: codigoPromocion || null,
            estadoPromocion: 'activa',
            createPromocion: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Promoción creada exitosamente',
            idPromocion: nuevaPromocion.idPromocion
        });

    } catch (error) {
        console.error('Error al crear promoción:', error);
        return res.status(500).json({ 
            message: 'Error al crear la promoción', 
            error: error.message 
        });
    }
};

// Actualizar promoción
promocionCtl.actualizarPromocion = async (req, res) => {
    try {
        const { idPromocion } = req.params;
        const { descripcion, fechaInicio, fechaFin, descuento, tipoDescuento, codigoPromocion, estadoPromocion } = req.body;

        if (!descripcion || !fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'Descripción, fecha de inicio y fecha de fin son obligatorios' });
        }

        // Validar que la fecha de fin sea posterior a la de inicio
        if (new Date(fechaFin) <= new Date(fechaInicio)) {
            return res.status(400).json({ message: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }

        await sql.promise().query(
            `UPDATE promociones SET 
                descripcion = ?, 
                fechaInicio = ?, 
                fechaFin = ?,
                descuento = ?,
                tipoDescuento = ?,
                codigoPromocion = ?,
                estadoPromocion = ?,
                updatePromocion = ? 
             WHERE idPromocion = ?`,
            [
                cifrarDatos(descripcion),
                fechaInicio,
                fechaFin,
                descuento || 0,
                tipoDescuento || 'porcentaje',
                codigoPromocion || null,
                estadoPromocion || 'activa',
                new Date().toLocaleString(),
                idPromocion
            ]
        );

        return res.json({ message: 'Promoción actualizada exitosamente' });

    } catch (error) {
        console.error('Error al actualizar promoción:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar promoción
promocionCtl.eliminarPromocion = async (req, res) => {
    try {
        const { idPromocion } = req.params;

        await sql.promise().query(
            `UPDATE promociones SET 
                estadoPromocion = 'inactiva',
                updatePromocion = ? 
             WHERE idPromocion = ?`,
            [new Date().toLocaleString(), idPromocion]
        );

        return res.json({ message: 'Promoción eliminada exitosamente' });

    } catch (error) {
        console.error('Error al eliminar promoción:', error);
        return res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

// Obtener promociones activas
promocionCtl.obtenerPromocionesActivas = async (req, res) => {
    try {
        const [promocionesActivas] = await sql.promise().query(`
            SELECT * FROM promociones 
            WHERE estadoPromocion = 'activa' 
            AND fechaInicio <= NOW() 
            AND fechaFin >= NOW()
            ORDER BY createPromocion DESC
        `);

        const promocionesCompletas = promocionesActivas.map(promocion => ({
            ...promocion,
            descripcion: descifrarSeguro(promocion.descripcion)
        }));

        return res.json(promocionesCompletas);
    } catch (error) {
        console.error('Error al obtener promociones activas:', error);
        return res.status(500).json({ message: 'Error al obtener promociones activas', error: error.message });
    }
};

// Obtener promociones por código
promocionCtl.obtenerPromocionPorCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;

        const [promocion] = await sql.promise().query(`
            SELECT * FROM promociones 
            WHERE codigoPromocion = ? 
            AND estadoPromocion = 'activa'
            AND fechaInicio <= NOW() 
            AND fechaFin >= NOW()
        `, [codigo]);

        if (promocion.length === 0) {
            return res.status(404).json({ message: 'Código de promoción no válido o expirado' });
        }

        const promocionCompleta = {
            ...promocion[0],
            descripcion: descifrarSeguro(promocion[0].descripcion)
        };

        return res.json(promocionCompleta);
    } catch (error) {
        console.error('Error al obtener promoción por código:', error);
        return res.status(500).json({ message: 'Error al obtener promoción', error: error.message });
    }
};

// Validar código de promoción
promocionCtl.validarCodigoPromocion = async (req, res) => {
    try {
        const { codigo } = req.params;

        const [promocion] = await sql.promise().query(`
            SELECT * FROM promociones 
            WHERE codigoPromocion = ? 
            AND estadoPromocion = 'activa'
            AND fechaInicio <= NOW() 
            AND fechaFin >= NOW()
        `, [codigo]);

        if (promocion.length === 0) {
            return res.json({ 
                valido: false, 
                mensaje: 'Código de promoción no válido o expirado' 
            });
        }

        return res.json({
            valido: true,
            promocion: {
                ...promocion[0],
                descripcion: descifrarSeguro(promocion[0].descripcion)
            },
            mensaje: 'Código de promoción válido'
        });
    } catch (error) {
        console.error('Error al validar código:', error);
        return res.status(500).json({ message: 'Error al validar código', error: error.message });
    }
};

// Obtener promociones próximas a expirar
promocionCtl.obtenerPromocionesProximasAExpirar = async (req, res) => {
    try {
        const { dias = 7 } = req.query;

        const [promocionesProximas] = await sql.promise().query(`
            SELECT * FROM promociones 
            WHERE estadoPromocion = 'activa' 
            AND fechaFin >= NOW() 
            AND fechaFin <= DATE_ADD(NOW(), INTERVAL ? DAY)
            ORDER BY fechaFin ASC
        `, [dias]);

        const promocionesCompletas = promocionesProximas.map(promocion => ({
            ...promocion,
            descripcion: descifrarSeguro(promocion.descripcion)
        }));

        return res.json(promocionesCompletas);
    } catch (error) {
        console.error('Error al obtener promociones próximas a expirar:', error);
        return res.status(500).json({ message: 'Error al obtener promociones', error: error.message });
    }
};

// Cambiar estado de promoción
promocionCtl.cambiarEstadoPromocion = async (req, res) => {
    try {
        const { idPromocion } = req.params;
        const { estado } = req.body;

        if (!['activa', 'inactiva', 'pausada', 'expirada'].includes(estado)) {
            return res.status(400).json({ message: 'Estado debe ser: activa, inactiva, pausada o expirada' });
        }

        await sql.promise().query(
            `UPDATE promociones SET 
                estadoPromocion = ?,
                updatePromocion = ? 
             WHERE idPromocion = ?`,
            [estado, new Date().toLocaleString(), idPromocion]
        );

        return res.json({ message: `Estado de promoción cambiado a ${estado} exitosamente` });

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        return res.status(500).json({ message: 'Error al cambiar estado', error: error.message });
    }
};

// Obtener estadísticas de promociones
promocionCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalPromociones,
                COUNT(CASE WHEN estadoPromocion = 'activa' THEN 1 END) as promocionesActivas,
                COUNT(CASE WHEN estadoPromocion = 'inactiva' THEN 1 END) as promocionesInactivas,
                COUNT(CASE WHEN estadoPromocion = 'expirada' THEN 1 END) as promocionesExpiradas,
                COUNT(CASE WHEN fechaFin >= NOW() AND estadoPromocion = 'activa' THEN 1 END) as promocionesVigentes,
                AVG(descuento) as descuentoPromedio
            FROM promociones
        `);

        // Promociones por mes (últimos 6 meses)
        const [promocionesPorMes] = await sql.promise().query(`
            SELECT 
                DATE_FORMAT(STR_TO_DATE(createPromocion, '%d/%m/%Y %H:%i:%s'), '%Y-%m') as mes,
                COUNT(*) as cantidad
            FROM promociones
            WHERE STR_TO_DATE(createPromocion, '%d/%m/%Y %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(STR_TO_DATE(createPromocion, '%d/%m/%Y %H:%i:%s'), '%Y-%m')
            ORDER BY mes DESC
        `);

        return res.json({
            estadisticas: estadisticas[0],
            promocionesPorMes: promocionesPorMes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Actualizar promociones expiradas automáticamente
promocionCtl.actualizarPromocionesExpiradas = async () => {
    try {
        await sql.promise().query(`
            UPDATE promociones SET 
                estadoPromocion = 'expirada',
                updatePromocion = ?
            WHERE fechaFin < NOW() 
            AND estadoPromocion = 'activa'
        `, [new Date().toLocaleString()]);

        console.log('Promociones expiradas actualizadas automáticamente');
    } catch (error) {
        console.error('Error al actualizar promociones expiradas:', error);
    }
};

module.exports = promocionCtl;