    const tipoServicio = (sequelize, type) => {
        return sequelize.define('tiposServicios', {
            idTipoServicio: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            nombreTipo: type.STRING,
            createTipoServicio: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Tipos de Servicios'
        });
    }
    module.exports = tipoServicio;
    