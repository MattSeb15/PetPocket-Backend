    const historialCita = (sequelize, type) => {
        return sequelize.define('historialCitas', {
            idHistorial: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idCita: type.INTEGER,
            observaciones: type.STRING,
            createHistorial: type.STRING,
            updateHistorial: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Historial de Citas'
        });
    }
    module.exports = historialCita;
    