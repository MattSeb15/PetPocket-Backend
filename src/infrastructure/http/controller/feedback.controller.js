const feedbackCtl = {};
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

// Mostrar todos los feedbacks
feedbackCtl.mostrarFeedbacks = async (req, res) => {
    try {
        const [listaFeedbacks] = await sql.promise().query(`
            SELECT f.*, c.nombreCliente, c.cedulaCliente
            FROM feedback f
            JOIN clientes c ON f.idCliente = c.idClientes
            ORDER BY f.createFeedback DESC
        `);

        const feedbacksCompletos = await Promise.all(
            listaFeedbacks.map(async (feedback) => {
                const feedbackMongo = await mongo.feedBackModel.findOne({ 
                    idFeedbackSql: feedback.idFeedback.toString()
                });

                return {
                    ...feedback,
                    nombreCliente: descifrarSeguro(feedback.nombreCliente),
                    cedulaCliente: descifrarSeguro(feedback.cedulaCliente),
                    detallesMongo: feedbackMongo ? {
                        calificacion: feedbackMongo.calificacion,
                        tipo: feedbackMongo.tipo,
                        anonimo: feedbackMongo.anonimo,
                        respondido: feedbackMongo.respondido,
                        respuesta: feedbackMongo.respuesta
                    } : null
                };
            })
        );

        return res.json(feedbacksCompletos);
    } catch (error) {
        console.error('Error al mostrar feedbacks:', error);
        return res.status(500).json({ message: 'Error al obtener los feedbacks', error: error.message });
    }
};

// Crear nuevo feedback
feedbackCtl.crearFeedback = async (req, res) => {
    try {
        const { 
            idCliente, comentario, calificacion, tipo, anonimo 
        } = req.body;

        if (!idCliente || !comentario || !calificacion) {
            return res.status(400).json({ message: 'Cliente, comentario y calificación son obligatorios' });
        }

        // Verificar que el cliente existe
        const [clienteExiste] = await sql.promise().query(
            'SELECT idClientes FROM clientes WHERE idClientes = ? AND stadoCliente = "activo"',
            [idCliente]
        );

        if (clienteExiste.length === 0) {
            return res.status(404).json({ message: 'El cliente no existe' });
        }

        // Crear en SQL
        const nuevoFeedback = await orm.feedback.create({
            idCliente: idCliente,
            comentario: comentario,
            createFeedback: new Date().toLocaleString(),
        });

        // Crear en MongoDB con detalles adicionales
        await mongo.feedBackModel.create({
            idFeedbackSql: nuevoFeedback.idFeedback.toString(),
            idCliente: idCliente.toString(),
            calificacion: calificacion,
            tipo: tipo || 'servicio',
            anonimo: anonimo || false,
            respondido: false,
            respuesta: ''
        });

        return res.status(201).json({ 
            message: 'Feedback creado exitosamente',
            idFeedback: nuevoFeedback.idFeedback
        });

    } catch (error) {
        console.error('Error al crear feedback:', error);
        return res.status(500).json({ 
            message: 'Error al crear el feedback', 
            error: error.message 
        });
    }
};

// Responder a un feedback
feedbackCtl.responderFeedback = async (req, res) => {
    try {
        const { idFeedback } = req.params;
        const { respuesta } = req.body;

        if (!respuesta) {
            return res.status(400).json({ message: 'La respuesta es obligatoria' });
        }

        // Actualizar en MongoDB
        const resultado = await mongo.feedBackModel.updateOne(
            { idFeedbackSql: idFeedback },
            {
                $set: {
                    respondido: true,
                    respuesta: respuesta,
                    fechaRespuesta: new Date()
                }
            }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ message: 'Feedback no encontrado' });
        }

        return res.json({ message: 'Respuesta guardada exitosamente' });

    } catch (error) {
        console.error('Error al responder feedback:', error);
        return res.status(500).json({ message: 'Error al responder', error: error.message });
    }
};

// Obtener feedbacks por cliente
feedbackCtl.obtenerFeedbacksPorCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;

        const [feedbacksCliente] = await sql.promise().query(`
            SELECT f.*, c.nombreCliente
            FROM feedback f
            JOIN clientes c ON f.idCliente = c.idClientes
            WHERE f.idCliente = ?
            ORDER BY f.createFeedback DESC
        `, [idCliente]);

        const feedbacksCompletos = await Promise.all(
            feedbacksCliente.map(async (feedback) => {
                const feedbackMongo = await mongo.feedBackModel.findOne({ 
                    idFeedbackSql: feedback.idFeedback.toString()
                });

                return {
                    ...feedback,
                    nombreCliente: descifrarSeguro(feedback.nombreCliente),
                    detallesMongo: feedbackMongo ? {
                        calificacion: feedbackMongo.calificacion,
                        tipo: feedbackMongo.tipo,
                        anonimo: feedbackMongo.anonimo,
                        respondido: feedbackMongo.respondido,
                        respuesta: feedbackMongo.respuesta
                    } : null
                };
            })
        );

        return res.json(feedbacksCompletos);
    } catch (error) {
        console.error('Error al obtener feedbacks por cliente:', error);
        return res.status(500).json({ message: 'Error al obtener feedbacks', error: error.message });
    }
};

// Obtener feedbacks por calificación
feedbackCtl.obtenerFeedbacksPorCalificacion = async (req, res) => {
    try {
        const { calificacion } = req.params;

        // Buscar en MongoDB primero
        const feedbacksMongo = await mongo.feedBackModel.find({ 
            calificacion: parseInt(calificacion)
        });

        const idsSQL = feedbacksMongo.map(f => f.idFeedbackSql);

        if (idsSQL.length === 0) {
            return res.json([]);
        }

        const placeholders = idsSQL.map(() => '?').join(',');
        const [feedbacksSQL] = await sql.promise().query(`
            SELECT f.*, c.nombreCliente, c.cedulaCliente
            FROM feedback f
            JOIN clientes c ON f.idCliente = c.idClientes
            WHERE f.idFeedback IN (${placeholders})
            ORDER BY f.createFeedback DESC
        `, idsSQL);

        const feedbacksCompletos = feedbacksSQL.map(feedback => {
            const mongoData = feedbacksMongo.find(m => m.idFeedbackSql === feedback.idFeedback.toString());
            
            return {
                ...feedback,
                nombreCliente: descifrarSeguro(feedback.nombreCliente),
                cedulaCliente: descifrarSeguro(feedback.cedulaCliente),
                detallesMongo: mongoData ? {
                    calificacion: mongoData.calificacion,
                    tipo: mongoData.tipo,
                    anonimo: mongoData.anonimo,
                    respondido: mongoData.respondido,
                    respuesta: mongoData.respuesta
                } : null
            };
        });

        return res.json(feedbacksCompletos);
    } catch (error) {
        console.error('Error al obtener feedbacks por calificación:', error);
        return res.status(500).json({ message: 'Error al obtener feedbacks', error: error.message });
    }
};

// Obtener estadísticas de feedback
feedbackCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticasSQL] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalFeedbacks,
                COUNT(DISTINCT idCliente) as clientesConFeedback
            FROM feedback
        `);

        // Estadísticas de MongoDB
        const estadisticasMongo = await mongo.feedBackModel.aggregate([
            {
                $group: {
                    _id: null,
                    calificacionPromedio: { $avg: '$calificacion' },
                    respondidos: { $sum: { $cond: ['$respondido', 1, 0] } },
                    noRespondidos: { $sum: { $cond: ['$respondido', 0, 1] } },
                    anonimos: { $sum: { $cond: ['$anonimo', 1, 0] } }
                }
            }
        ]);

        // Distribución por calificación
        const distribucionCalificacion = await mongo.feedBackModel.aggregate([
            {
                $group: {
                    _id: '$calificacion',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Distribución por tipo
        const distribucionTipo = await mongo.feedBackModel.aggregate([
            {
                $group: {
                    _id: '$tipo',
                    cantidad: { $sum: 1 }
                }
            }
        ]);

        return res.json({
            estadisticasGenerales: {
                ...estadisticasSQL[0],
                ...(estadisticasMongo[0] || {})
            },
            distribucionCalificacion,
            distribucionTipo
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// Obtener feedbacks pendientes de responder
feedbackCtl.obtenerFeedbacksPendientes = async (req, res) => {
    try {
        // Buscar en MongoDB los no respondidos
        const feedbacksPendientes = await mongo.feedBackModel.find({ 
            respondido: false
        });

        const idsSQL = feedbacksPendientes.map(f => f.idFeedbackSql);

        if (idsSQL.length === 0) {
            return res.json([]);
        }

        const placeholders = idsSQL.map(() => '?').join(',');
        const [feedbacksSQL] = await sql.promise().query(`
            SELECT f.*, c.nombreCliente, c.cedulaCliente
            FROM feedback f
            JOIN clientes c ON f.idCliente = c.idClientes
            WHERE f.idFeedback IN (${placeholders})
            ORDER BY f.createFeedback ASC
        `, idsSQL);

        const feedbacksCompletos = feedbacksSQL.map(feedback => {
            const mongoData = feedbacksPendientes.find(m => m.idFeedbackSql === feedback.idFeedback.toString());
            
            return {
                ...feedback,
                nombreCliente: descifrarSeguro(feedback.nombreCliente),
                cedulaCliente: descifrarSeguro(feedback.cedulaCliente),
                detallesMongo: mongoData ? {
                    calificacion: mongoData.calificacion,
                    tipo: mongoData.tipo,
                    anonimo: mongoData.anonimo,
                    respondido: mongoData.respondido
                } : null
            };
        });

        return res.json(feedbacksCompletos);
    } catch (error) {
        console.error('Error al obtener feedbacks pendientes:', error);
        return res.status(500).json({ message: 'Error al obtener feedbacks pendientes', error: error.message });
    }
};

module.exports = feedbackCtl;