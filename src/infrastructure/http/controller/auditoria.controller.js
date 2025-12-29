const auditoriaCtl = {};
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

// Mostrar todas las auditorías
auditoriaCtl.mostrarAuditorias = async (req, res) => {
    try {
        const { page = 1, limit = 50, accion, usuario } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        if (accion) {
            whereClause += ' AND a.accion LIKE ?';
            params.push(`%${accion}%`);
        }

        if (usuario) {
            whereClause += ' AND u.nameUsers LIKE ?';
            params.push(`%${usuario}%`);
        }

        const [listaAuditorias] = await sql.promise().query(`
            SELECT a.*, u.nameUsers, u.emailUser
            FROM auditorias a
            LEFT JOIN users u ON a.idUsuario = u.idUser
            WHERE 1=1 ${whereClause}
            ORDER BY a.fecha DESC, a.createAuditoria DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        // Contar total de registros
        const [totalCount] = await sql.promise().query(`
            SELECT COUNT(*) as total
            FROM auditorias a
            LEFT JOIN users u ON a.idUsuario = u.idUser
            WHERE 1=1 ${whereClause}
        `, params);

        const auditoriasCompletas = listaAuditorias.map(auditoria => ({
            ...auditoria,
            nameUsers: auditoria.nameUsers ? descifrarSeguro(auditoria.nameUsers) : 'Usuario eliminado',
            emailUser: auditoria.emailUser ? descifrarSeguro(auditoria.emailUser) : ''
        }));

        return res.json({
            auditorias: auditoriasCompletas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error al mostrar auditorías:', error);
        return res.status(500).json({ message: 'Error al obtener las auditorías', error: error.message });
    }
};

// Registrar nueva auditoría
auditoriaCtl.registrarAuditoria = async (idUsuario, accion, detalles = '') => {
    try {
        await orm.auditoria.create({
            idUsuario: idUsuario || null,
            accion: accion,
            detalles: detalles,
            fecha: new Date(),
            createAuditoria: new Date().toLocaleString(),
        });
    } catch (error) {
        console.error('Error al registrar auditoría:', error);
    }
};

// Crear nueva auditoría (endpoint manual)
auditoriaCtl.crearAuditoria = async (req, res) => {
    try {
        const { idUsuario, accion, detalles } = req.body;

        if (!accion) {
            return res.status(400).json({ message: 'La acción es obligatoria' });
        }

        const nuevaAuditoria = await orm.auditoria.create({
            idUsuario: idUsuario || null,
            accion: accion,
            detalles: detalles || '',
            fecha: new Date(),
            createAuditoria: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Auditoría registrada exitosamente',
            idAuditoria: nuevaAuditoria.idAuditoria
        });

    } catch (error) {
        console.error('Error al crear auditoría:', error);
        return res.status(500).json({ 
            message: 'Error al registrar la auditoría', 
            error: error.message 
        });
    }
};

// Obtener auditorías por usuario
auditoriaCtl.obtenerAuditoriasPorUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [auditoriasUsuario] = await sql.promise().query(`
            SELECT a.*, u.nameUsers, u.emailUser
            FROM auditorias a
            JOIN users u ON a.idUsuario = u.idUser
            WHERE a.idUsuario = ?
            ORDER BY a.fecha DESC, a.createAuditoria DESC
            LIMIT ? OFFSET ?
        `, [idUsuario, parseInt(limit), parseInt(offset)]);

        const [totalCount] = await sql.promise().query(
            'SELECT COUNT(*) as total FROM auditorias WHERE idUsuario = ?',
            [idUsuario]
        );

        const auditoriasCompletas = auditoriasUsuario.map(auditoria => ({
            ...auditoria,
            nameUsers: descifrarSeguro(auditoria.nameUsers),
            emailUser: descifrarSeguro(auditoria.emailUser)
        }));

        return res.json({
            auditorias: auditoriasCompletas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener auditorías por usuario:', error);
        return res.status(500).json({ message: 'Error al obtener auditorías', error: error.message });
    }
};

// Obtener auditorías por rango de fechas
auditoriaCtl.obtenerAuditoriasPorFecha = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'Fecha de inicio y fin son obligatorias' });
        }

        const [auditoriasPorFecha] = await sql.promise().query(`
            SELECT a.*, u.nameUsers, u.emailUser
            FROM auditorias a
            LEFT JOIN users u ON a.idUsuario = u.idUser
            WHERE a.fecha BETWEEN ? AND ?
            ORDER BY a.fecha DESC
        `, [fechaInicio, fechaFin]);

        const auditoriasCompletas = auditoriasPorFecha.map(auditoria => ({
            ...auditoria,
            nameUsers: auditoria.nameUsers ? descifrarSeguro(auditoria.nameUsers) : 'Usuario eliminado',
            emailUser: auditoria.emailUser ? descifrarSeguro(auditoria.emailUser) : ''
        }));

        return res.json(auditoriasCompletas);
    } catch (error) {
        console.error('Error al obtener auditorías por fecha:', error);
        return res.status(500).json({ message: 'Error al obtener auditorías', error: error.message });
    }
};

// Obtener estadísticas de auditoría
auditoriaCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalAuditorias,
                COUNT(DISTINCT idUsuario) as usuariosActivos,
                COUNT(DISTINCT accion) as tiposAcciones
            FROM auditorias
        `);

        // Acciones más frecuentes
        const [accionesFrecuentes] = await sql.promise().query(`
            SELECT accion, COUNT(*) as cantidad
            FROM auditorias
            GROUP BY accion
            ORDER BY cantidad DESC
            LIMIT 10
        `);

        // Actividad por día (últimos 7 días)
        const [actividadPorDia] = await sql.promise().query(`
            SELECT 
                DATE(fecha) as fecha,
                COUNT(*) as cantidad
            FROM auditorias
            WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(fecha)
            ORDER BY fecha DESC
        `);

        return res.json({
            estadisticas: estadisticas[0],
            accionesFrecuentes,
            actividadPorDia
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Limpiar auditorías antiguas
auditoriaCtl.limpiarAuditoriasAntiguas = async (req, res) => {
    try {
        const { dias = 90 } = req.body;

        const resultado = await sql.promise().query(
            'DELETE FROM auditorias WHERE fecha < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [dias]
        );

        return res.json({ 
            message: `Se eliminaron ${resultado[0].affectedRows} registros de auditoría anteriores a ${dias} días`
        });

    } catch (error) {
        console.error('Error al limpiar auditorías:', error);
        return res.status(500).json({ message: 'Error al limpiar auditorías', error: error.message });
    }
};

// Middleware para registrar auditorías automáticamente
auditoriaCtl.middlewareAuditoria = (accion) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Solo registrar si la operación fue exitosa
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const idUsuario = req.user ? req.user.idUser : null;
                const detalles = `${req.method} ${req.originalUrl} - ${res.statusCode}`;
                
                auditoriaCtl.registrarAuditoria(idUsuario, accion, detalles);
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = auditoriaCtl;