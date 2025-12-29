    const historialPago = (sequelize, type) => {
        return sequelize.define('historialPagos', {
            idHistorialPago: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idPago: type.INTEGER,
            fechaPago: type.DATE,
            monto: type.FLOAT,
            createHistorialPago: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Historial de Pagos'
        });
    }
    module.exports = historialPago;
    