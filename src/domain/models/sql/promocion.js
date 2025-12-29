    const promocion = (sequelize, type) => {
        return sequelize.define('promociones', {
            idPromocion: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            descripcion: type.STRING,
            fechaInicio: type.DATE,
            fechaFin: type.DATE,
            estadoPromocion: type.STRING,
            createPromocion: type.STRING,
            updatePromocion: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Promociones'
        });
    }
    module.exports = promocion;
    