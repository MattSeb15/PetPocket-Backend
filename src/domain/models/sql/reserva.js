    const reserva = (sequelize, type) => {
        return sequelize.define('reservas', {
            idReserva: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idCliente: type.INTEGER,
            idServicio: type.INTEGER,
            fechaReserva: type.DATE,
            createReserva: type.STRING,
            updateReserva: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Reservas'
        });
    }
    module.exports = reserva;
    