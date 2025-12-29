    const configuracionServicio = (sequelize, type) => {
        return sequelize.define('configuracionesServicios', {
            idConfiguracionServicio: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idServicio: type.INTEGER,
            clave: type.STRING,
            valor: type.STRING,
            createConfiguracionServicio: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Configuraciones de Servicio'
        });
    }
    module.exports = configuracionServicio;
    