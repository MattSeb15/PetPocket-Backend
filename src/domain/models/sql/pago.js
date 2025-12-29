    const pago = (sequelize, type) => {
        return sequelize.define('pagos', {
            idPago: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idCita: type.INTEGER,
            monto: type.FLOAT,
            metodoPago: type.STRING,
            estadoPago: type.STRING,
            createPago: type.STRING,
            updatePago: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Pagos'
        });
    }
    module.exports = pago;
    