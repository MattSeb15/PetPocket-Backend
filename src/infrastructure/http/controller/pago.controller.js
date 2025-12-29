const pagoCtl = {};
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

// Mostrar todos los pagos con información completa
pagoCtl.mostrarPagos = async (req, res) => {
    try {
        const [listaPagos] = await sql.promise().query(`
            SELECT p.*, 
                   c.fecha as fechaCita,
                   c.hora as horaCita,
                   cl.nombreCliente,
                   s.nombreServicio,
                   s.precioServicio
            FROM pagos p
            JOIN citas c ON p.idCita = c.idCita
            JOIN clientes cl ON c.idCliente = cl.idClientes
            JOIN servicios s ON c.idServicio = s.idServicio
            ORDER BY p.createPago DESC
        `);

        const pagosCompletos = listaPagos.map(pago => ({
            ...pago,
            nombreCliente: descifrarSeguro(pago.nombreCliente),
            nombreServicio: descifrarSeguro(pago.nombreServicio)
        }));

        return res.json(pagosCompletos);
    } catch (error) {
        console.error('Error al mostrar pagos:', error);
        return res.status(500).json({ message: 'Error al obtener los pagos', error: error.message });
    }
};

// Crear nuevo pago
pagoCtl.crearPago = async (req, res) => {
    try {
        const { idCita, monto, metodoPago } = req.body;

        if (!idCita || !monto || !metodoPago) {
            return res.status(400).json({ message: 'Cita, monto y método de pago son obligatorios' });
        }

        // Verificar que la cita existe
        const [citaExiste] = await sql.promise().query(
            'SELECT idCita FROM citas WHERE idCita = ?',
            [idCita]
        );

        if (citaExiste.length === 0) {
            return res.status(404).json({ message: 'La cita no existe' });
        }

        const nuevoPago = await orm.pago.create({
            idCita: idCita,
            monto: monto,
            metodoPago: metodoPago,
            estadoPago: 'completado',
            createPago: new Date().toLocaleString(),
        });

        return res.status(201).json({ 
            message: 'Pago creado exitosamente',
            idPago: nuevoPago.idPago
        });

    } catch (error) {
        console.error('Error al crear pago:', error);
        return res.status(500).json({ 
            message: 'Error al crear el pago', 
            error: error.message 
        });
    }
};

// Actualizar pago
pagoCtl.actualizarPago = async (req, res) => {
    try {
        const { idPago } = req.params;
        const { monto, metodoPago, estadoPago } = req.body;

        if (!monto || !metodoPago || !estadoPago) {
            return res.status(400).json({ message: 'Monto, método de pago y estado son obligatorios' });
        }

        await sql.promise().query(
            `UPDATE pagos SET 
                monto = ?, 
                metodoPago = ?, 
                estadoPago = ?,
                updatePago = ? 
             WHERE idPago = ?`,
            [monto, metodoPago, estadoPago, new Date().toLocaleString(), idPago]
        );

        return res.json({ message: 'Pago actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar pago:', error);
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Obtener pagos por cliente
pagoCtl.obtenerPagosPorCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;

        const [pagosPorCliente] = await sql.promise().query(`
            SELECT p.*, 
                   c.fecha as fechaCita,
                   c.hora as horaCita,
                   s.nombreServicio
            FROM pagos p
            JOIN citas c ON p.idCita = c.idCita
            JOIN servicios s ON c.idServicio = s.idServicio
            WHERE c.idCliente = ?
            ORDER BY p.createPago DESC
        `, [idCliente]);

        const pagosCompletos = pagosPorCliente.map(pago => ({
            ...pago,
            nombreServicio: descifrarSeguro(pago.nombreServicio)
        }));

        return res.json(pagosCompletos);
    } catch (error) {
        console.error('Error al obtener pagos por cliente:', error);
        return res.status(500).json({ message: 'Error al obtener pagos', error: error.message });
    }
};

// Obtener estadísticas de pagos
pagoCtl.obtenerEstadisticas = async (req, res) => {
    try {
        const [estadisticas] = await sql.promise().query(`
            SELECT 
                COUNT(*) as totalPagos,
                SUM(monto) as montoTotal,
                AVG(monto) as montoPromedio,
                COUNT(CASE WHEN estadoPago = 'completado' THEN 1 END) as pagosCompletados,
                COUNT(CASE WHEN estadoPago = 'pendiente' THEN 1 END) as pagosPendientes,
                COUNT(CASE WHEN metodoPago = 'efectivo' THEN 1 END) as pagosEfectivo,
                COUNT(CASE WHEN metodoPago = 'tarjeta' THEN 1 END) as pagosTarjeta,
                COUNT(CASE WHEN metodoPago = 'transferencia' THEN 1 END) as pagosTransferencia
            FROM pagos
        `);

        // Pagos por mes (últimos 6 meses)
        const [pagosPorMes] = await sql.promise().query(`
            SELECT 
                DATE_FORMAT(STR_TO_DATE(createPago, '%d/%m/%Y %H:%i:%s'), '%Y-%m') as mes,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM pagos
            WHERE STR_TO_DATE(createPago, '%d/%m/%Y %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(STR_TO_DATE(createPago, '%d/%m/%Y %H:%i:%s'), '%Y-%m')
            ORDER BY mes DESC
        `);

        return res.json({
            estadisticas: estadisticas[0],
            pagosPorMes: pagosPorMes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

module.exports = pagoCtl;