    const log = (sequelize, type) => {
        return sequelize.define('logs', {
            idLog: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            mensaje: type.STRING,
            nivel: type.STRING,
            createLog: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Logs'
        });
    }
    module.exports = log;
    