const reservaCtl = {};
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

// Mostrar todas las reservas
reservaCtl.mostrarReservas = async (req, res) => {
    try {
        const [listaReservas] = await sql.promise().query(`
            SELECT r.*, 
                   c.nombreCliente, c.cedulaCliente,
                   s.nombreServicio, s.precioServicio
            FROM reservas r
            JOIN clientes c ON r.idCliente = c.idClientes
            JOIN servicios s ON r.idServicio = s.idServicio
            ORDER BY r.fechaReserva DESC, r.createReserva DESC
        `);

        const reservasCompletas = await Promise.all(
            listaReservas.map(async (reserva) => {
                const reservaMongo = await mongo.reservaModel.findOne({ 
                    idReservaSql: reserva.idReserva.toString()
                });

                return {
                    ...reserva,
                    cliente: {
                        nombre: descifrarSeguro(reserva.nombreCliente),
                        cedula: descifrarSeguro(reserva.cedulaCliente)
                    },
                    servicio: {
                        nombre: descifrarSeguro(reserva.nombreServicio),
                        precio: reserva.precioServicio
                    },
                    detallesMongo: reservaMongo ? {
                        estado: reservaMongo.estado,
                        comentariosCliente: reservaMongo.comentariosCliente,
                        confirmacionCliente: reservaMongo.confirmacionCliente,
                        motivoCancelacion: reservaMongo.motivoCancelacion,
                        atendidoPor: reservaMongo.atendidoPor,
                        calificacionPosterior: reservaMongo.calificacionPosterior
                    } : null
                };
            })
        );

        return res.json(reservasCompletas);
    } catch (error) {
        console.error('Error al obtener reservas por estado:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// Obtener reservas por fecha
reservaCtl.obtenerReservasPorFecha = async (req, res) => {
    try {
        const { fecha } = req.params;

        const [reservasPorFecha] = await sql.promise().query(`
            SELECT r.*, 
                   c.nombreCliente, c.cedulaCliente,
                   s.nombreServicio, s.precioServicio
            FROM reservas r
            JOIN clientes c ON r.idCliente = c.idClientes
            JOIN servicios s ON r.idServicio = s.idServicio
            WHERE DATE(r.fechaReserva) = ?
            ORDER BY r.fechaReserva ASC
        `, [fecha]);

        const reservasCompletas = await Promise.all(
            reservasPorFecha.map(async (reserva) => {
                const reservaMongo = await mongo.reservaModel.findOne({ 
                    idReservaSql: reserva.idReserva.toString()
                });

                return {
                    ...reserva,
                    cliente: {
                        nombre: descifrarSeguro(reserva.nombreCliente),
                        cedula: descifrarSeguro(reserva.cedulaCliente)
                    },
                    servicio: {
                        nombre: descifrarSeguro(reserva.nombreServicio),
                        precio: reserva.precioServicio
                    },
                    detallesMongo: reservaMongo ? {
                        estado: reservaMongo.estado,
                        comentariosCliente: reservaMongo.comentariosCliente,
                        confirmacionCliente: reservaMongo.confirmacionCliente,
                        atendidoPor: reservaMongo.atendidoPor,
                        calificacionPosterior: reservaMongo.calificacionPosterior
                    } : null
                };
            })
        );

        return res.json(reservasCompletas);
    } catch (error) {
        console.error('Error al obtener reservas por fecha:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// Obtener estadísticas de reservas
reservaCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticasSQL] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalReservas,
                COUNT(DISTINCT idCliente) as clientesConReservas,
                COUNT(DISTINCT idServicio) as serviciosReservados
            FROM reservas
        `);

        // Estadísticas de MongoDB
        const estadisticasMongo = await mongo.reservaModel.aggregate([
            {
                $group: {
                    _id: null,
                    pendientes: { $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] } },
                    confirmadas: { $sum: { $cond: [{ $eq: ['$estado', 'confirmada'] }, 1, 0] } },
                    canceladas: { $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] } },
                    completadas: { $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] } },
                    calificacionPromedio: { $avg: '$calificacionPosterior' }
                }
            }
        ]);

        // Reservas por mes (últimos 6 meses)
        const [reservasPorMes] = await sql.promise().query(`
            SELECT 
                DATE_FORMAT(STR_TO_DATE(createReserva, '%d/%m/%Y %H:%i:%s'), '%Y-%m') as mes,
                COUNT(*) as cantidad
            FROM reservas
            WHERE STR_TO_DATE(createReserva, '%d/%m/%Y %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(STR_TO_DATE(createReserva, '%d/%m/%Y %H:%i:%s'), '%Y-%m')
            ORDER BY mes DESC
        `);

        return res.json({
            estadisticasGenerales: {
                ...estadisticasSQL[0],
                ...(estadisticasMongo[0] || {})
            },
            reservasPorMes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Eliminar reserva
reservaCtl.eliminarReserva = async (req, res) => {
    try {
        const { idReserva } = req.params;

        // Eliminar de SQL
        await sql.promise().query(
            'DELETE FROM reservas WHERE idReserva = ?',
            [idReserva]
        );

        // Eliminar de MongoDB
        await mongo.reservaModel.deleteOne({ idReservaSql: idReserva });

        return res.json({ message: 'Reserva eliminada exitosamente' });

    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        return res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

// Crear nueva reserva
reservaCtl.crearReserva = async (req, res) => {
    try {
        const { 
            idCliente, idServicio, fechaReserva, comentariosCliente
        } = req.body;

        if (!idCliente || !idServicio || !fechaReserva) {
            return res.status(400).json({ message: 'Cliente, servicio y fecha de reserva son obligatorios' });
        }

        // Verificar que el cliente existe
        const [clienteExiste] = await sql.promise().query(
            'SELECT idClientes FROM clientes WHERE idClientes = ? AND stadoCliente = "activo"',
            [idCliente]
        );

        if (clienteExiste.length === 0) {
            return res.status(404).json({ message: 'El cliente no existe' });
        }

        // Verificar que el servicio existe
        const [servicioExiste] = await sql.promise().query(
            'SELECT idServicio FROM servicios WHERE idServicio = ? AND estadoServicio = "activo"',
            [idServicio]
        );

        if (servicioExiste.length === 0) {
            return res.status(404).json({ message: 'El servicio no existe' });
        }

        // Crear en SQL
        const nuevaReserva = await orm.reserva.create({
            idCliente: idCliente,
            idServicio: idServicio,
            fechaReserva: fechaReserva,
            createReserva: new Date().toLocaleString(),
        });

        // Crear en MongoDB con detalles adicionales
        await mongo.reservaModel.create({
            idReservaSql: nuevaReserva.idReserva.toString(),
            idCliente: idCliente.toString(),
            idServicio: idServicio.toString(),
            estado: 'pendiente',
            comentariosCliente: comentariosCliente || '',
            confirmacionCliente: false,
            motivoCancelacion: '',
            atendidoPor: '',
            calificacionPosterior: null
        });

        return res.status(201).json({ 
            message: 'Reserva creada exitosamente',
            idReserva: nuevaReserva.idReserva
        });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        return res.status(500).json({ 
            message: 'Error al crear la reserva', 
            error: error.message 
        });
    }
};

// Actualizar reserva
reservaCtl.actualizarReserva = async (req, res) => {
    try {
        const { idReserva } = req.params;
        const { 
            fechaReserva, comentariosCliente, estado, atendidoPor
        } = req.body;

        if (!fechaReserva) {
            return res.status(400).json({ message: 'La fecha de reserva es obligatoria' });
        }

        // Actualizar en SQL
        await sql.promise().query(
            `UPDATE reservas SET 
                fechaReserva = ?,
                updateReserva = ? 
             WHERE idReserva = ?`,
            [fechaReserva, new Date().toLocaleString(), idReserva]
        );

        // Actualizar en MongoDB
        const updateData = {};
        if (comentariosCliente !== undefined) updateData.comentariosCliente = comentariosCliente;
        if (estado !== undefined) updateData.estado = estado;
        if (atendidoPor !== undefined) updateData.atendidoPor = atendidoPor;

        if (Object.keys(updateData).length > 0) {
            await mongo.reservaModel.updateOne(
                { idReservaSql: idReserva },
                { $set: updateData }
            );
        }

        return res.json({ message: 'Reserva actualizada exitosamente' });

    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Confirmar reserva
reservaCtl.confirmarReserva = async (req, res) => {
    try {
        const { idReserva } = req.params;

        await mongo.reservaModel.updateOne(
            { idReservaSql: idReserva },
            {
                $set: {
                    estado: 'confirmada',
                    confirmacionCliente: true,
                    fechaConfirmacion: new Date()
                }
            }
        );

        return res.json({ message: 'Reserva confirmada exitosamente' });

    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        return res.status(500).json({ message: 'Error al confirmar', error: error.message });
    }
};

// Cancelar reserva
reservaCtl.cancelarReserva = async (req, res) => {
    try {
        const { idReserva } = req.params;
        const { motivoCancelacion } = req.body;

        await mongo.reservaModel.updateOne(
            { idReservaSql: idReserva },
            {
                $set: {
                    estado: 'cancelada',
                    motivoCancelacion: motivoCancelacion || 'No especificado',
                    fechaCancelacion: new Date()
                }
            }
        );

        return res.json({ message: 'Reserva cancelada exitosamente' });

    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        return res.status(500).json({ message: 'Error al cancelar', error: error.message });
    }
};

// Completar reserva
reservaCtl.completarReserva = async (req, res) => {
    try {
        const { idReserva } = req.params;
        const { atendidoPor, observaciones } = req.body;

        await mongo.reservaModel.updateOne(
            { idReservaSql: idReserva },
            {
                $set: {
                    estado: 'completada',
                    atendidoPor: atendidoPor || '',
                    observaciones: observaciones || '',
                    fechaCompletada: new Date()
                }
            }
        );

        return res.json({ message: 'Reserva completada exitosamente' });

    } catch (error) {
        console.error('Error al completar reserva:', error);
        return res.status(500).json({ message: 'Error al completar', error: error.message });
    }
};

// Calificar reserva
reservaCtl.calificarReserva = async (req, res) => {
    try {
        const { idReserva } = req.params;
        const { calificacion, comentarioCalificacion } = req.body;

        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ message: 'La calificación debe ser un número entre 1 y 5' });
        }

        await mongo.reservaModel.updateOne(
            { idReservaSql: idReserva },
            {
                $set: {
                    calificacionPosterior: calificacion,
                    comentarioCalificacion: comentarioCalificacion || '',
                    fechaCalificacion: new Date()
                }
            }
        );

        return res.json({ message: 'Calificación guardada exitosamente' });

    } catch (error) {
        console.error('Error al calificar reserva:', error);
        return res.status(500).json({ message: 'Error al calificar', error: error.message });
    }
};

// Obtener reservas por cliente
reservaCtl.obtenerReservasPorCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;

        const [reservasCliente] = await sql.promise().query(`
            SELECT r.*, 
                   s.nombreServicio, s.precioServicio
            FROM reservas r
            JOIN servicios s ON r.idServicio = s.idServicio
            WHERE r.idCliente = ?
            ORDER BY r.fechaReserva DESC
        `, [idCliente]);

        const reservasCompletas = await Promise.all(
            reservasCliente.map(async (reserva) => {
                const reservaMongo = await mongo.reservaModel.findOne({ 
                    idReservaSql: reserva.idReserva.toString()
                });

                return {
                    ...reserva,
                    servicio: {
                        nombre: descifrarSeguro(reserva.nombreServicio),
                        precio: reserva.precioServicio
                    },
                    detallesMongo: reservaMongo ? {
                        estado: reservaMongo.estado,
                        comentariosCliente: reservaMongo.comentariosCliente,
                        confirmacionCliente: reservaMongo.confirmacionCliente,
                        atendidoPor: reservaMongo.atendidoPor,
                        calificacionPosterior: reservaMongo.calificacionPosterior
                    } : null
                };
            })
        );

        return res.json(reservasCompletas);
    } catch (error) {
        console.error('Error al obtener reservas por cliente:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// Obtener reservas por estado
reservaCtl.obtenerReservasPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;

        // Buscar en MongoDB primero
        const reservasMongo = await mongo.reservaModel.find({ estado });
        const idsSQL = reservasMongo.map(r => r.idReservaSql);

        if (idsSQL.length === 0) {
            return res.json([]);
        }

        const placeholders = idsSQL.map(() => '?').join(',');
        const [reservasSQL] = await sql.promise().query(`
            SELECT r.*, 
                   c.nombreCliente, c.cedulaCliente,
                   s.nombreServicio, s.precioServicio
            FROM reservas r
            JOIN clientes c ON r.idCliente = c.idClientes
            JOIN servicios s ON r.idServicio = s.idServicio
            WHERE r.idReserva IN (${placeholders})
            ORDER BY r.fechaReserva DESC
        `, idsSQL);

        const reservasCompletas = reservasSQL.map(reserva => {
            const mongoData = reservasMongo.find(m => m.idReservaSql === reserva.idReserva.toString());
            
            return {
                ...reserva,
                cliente: {
                    nombre: descifrarSeguro(reserva.nombreCliente),
                    cedula: descifrarSeguro(reserva.cedulaCliente)
                },
                servicio: {
                    nombre: descifrarSeguro(reserva.nombreServicio),
                    precio: reserva.precioServicio
                },
                detallesMongo: mongoData ? {
                    estado: mongoData.estado,
                    comentariosCliente: mongoData.comentariosCliente,
                    confirmacionCliente: mongoData.confirmacionCliente,
                    atendidoPor: mongoData.atendidoPor,
                    calificacionPosterior: mongoData.calificacionPosterior
                } : null
            };
        });

        return res.json(reservasCompletas);
    } catch (error) {
        console.error('Error al obtener reservas por estado:', error);
        return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

module.exports = reservaCtl;
