const notificacionCtl = {};
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

// Mostrar todas las notificaciones
notificacionCtl.mostrarNotificaciones = async (req, res) => {
    try {
        const [listaNotificaciones] = await sql.promise().query(`
            SELECT n.*, u.nameUsers, u.emailUser
            FROM notificaciones n
            JOIN users u ON n.idUsuario = u.idUser
            ORDER BY n.createNotificacion DESC
        `);

        const notificacionesCompletas = listaNotificaciones.map(notificacion => ({
            ...notificacion,
            nameUsers: descifrarSeguro(notificacion.nameUsers),
            emailUser: descifrarSeguro(notificacion.emailUser)
        }));

        return res.json(notificacionesCompletas);
    } catch (error) {
        console.error('Error al mostrar notificaciones:', error);
        return res.status(500).json({ message: 'Error al obtener las notificaciones', error: error.message });
    }
};

// Crear nueva notificación
notificacionCtl.crearNotificacion = async (req, res) => {
    try {
        const { idUsuario, mensaje, tipo } = req.body;

        if (!idUsuario || !mensaje) {
            return res.status(400).json({ message: 'Usuario y mensaje son obligatorios' });
        }

        // Verificar que el usuario existe
        const [usuarioExiste] = await sql.promise().query(
            'SELECT idUser FROM users WHERE idUser = ? AND stateUser = "active"',
            [idUsuario]
        );

        if (usuarioExiste.length === 0) {
            return res.status(404).json({ message: 'El usuario no existe' });
        }

        const nuevaNotificacion = await orm.notificacion.create({
            idUsuario: idUsuario,
            mensaje: mensaje,
            tipo: tipo || 'general',
            estadoNotificacion: 'pendiente',
            createNotificacion: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Notificación creada exitosamente',
            idNotificacion: nuevaNotificacion.idNotificacion
        });

    } catch (error) {
        console.error('Error al crear notificación:', error);
        return res.status(500).json({ 
            message: 'Error al crear la notificación', 
            error: error.message 
        });
    }
};

// Obtener notificaciones por usuario
notificacionCtl.obtenerNotificacionesPorUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const { estado } = req.query;

        let query = `
            SELECT n.*, u.nameUsers
            FROM notificaciones n
            JOIN users u ON n.idUsuario = u.idUser
            WHERE n.idUsuario = ?
        `;
        
        let params = [idUsuario];

        if (estado) {
            query += ' AND n.estadoNotificacion = ?';
            params.push(estado);
        }

        query += ' ORDER BY n.createNotificacion DESC';

        const [notificacionesUsuario] = await sql.promise().query(query, params);

        const notificacionesCompletas = notificacionesUsuario.map(notificacion => ({
            ...notificacion,
            nameUsers: descifrarSeguro(notificacion.nameUsers)
        }));

        return res.json(notificacionesCompletas);
    } catch (error) {
        console.error('Error al obtener notificaciones por usuario:', error);
        return res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
    }
};

// Marcar notificación como leída
notificacionCtl.marcarComoLeida = async (req, res) => {
    try {
        const { idNotificacion } = req.params;

        await sql.promise().query(
            `UPDATE notificaciones SET 
                estadoNotificacion = 'leida',
                updateNotificacion = ? 
             WHERE idNotificacion = ?`,
            [new Date().toLocaleString(), idNotificacion]
        );

        return res.json({ message: 'Notificación marcada como leída' });

    } catch (error) {
        console.error('Error al marcar como leída:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Marcar todas las notificaciones de un usuario como leídas
notificacionCtl.marcarTodasComoLeidas = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        await sql.promise().query(
            `UPDATE notificaciones SET 
                estadoNotificacion = 'leida',
                updateNotificacion = ? 
             WHERE idUsuario = ? AND estadoNotificacion = 'pendiente'`,
            [new Date().toLocaleString(), idUsuario]
        );

        return res.json({ message: 'Todas las notificaciones marcadas como leídas' });

    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar notificación
notificacionCtl.eliminarNotificacion = async (req, res) => {
    try {
        const { idNotificacion } = req.params;

        await sql.promise().query(
            'DELETE FROM notificaciones WHERE idNotificacion = ?',
            [idNotificacion]
        );

        return res.json({ message: 'Notificación eliminada exitosamente' });

    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        return res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

// Crear notificaciones masivas
notificacionCtl.crearNotificacionMasiva = async (req, res) => {
    try {
        const { mensaje, tipo, usuarios } = req.body;

        if (!mensaje || !usuarios || !Array.isArray(usuarios)) {
            return res.status(400).json({ message: 'Mensaje y array de usuarios son obligatorios' });
        }

        let notificacionesCreadas = 0;

        for (const idUsuario of usuarios) {
            try {
                await orm.notificacion.create({
                    idUsuario: idUsuario,
                    mensaje: mensaje,
                    tipo: tipo || 'general',
                    estadoNotificacion: 'pendiente',
                    createNotificacion: new Date().toLocaleString(),
                });
                notificacionesCreadas++;
            } catch (error) {
                console.error(`Error al crear notificación para usuario ${idUsuario}:`, error);
            }
        }

        return res.status(201).json({ 
            message: `${notificacionesCreadas} notificaciones creadas exitosamente`
        });

    } catch (error) {
        console.error('Error al crear notificaciones masivas:', error);
        return res.status(500).json({ 
            message: 'Error al crear las notificaciones', 
            error: error.message 
        });
    }
};

// Obtener estadísticas de notificaciones
notificacionCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalNotificaciones,
                COUNT(CASE WHEN estadoNotificacion = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estadoNotificacion = 'leida' THEN 1 END) as leidas,
                COUNT(DISTINCT idUsuario) as usuariosConNotificaciones
            FROM notificaciones
        `);

        return res.json(estadisticas[0]);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

module.exports = notificacionCtl;