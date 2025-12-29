    const tipoMascota = (sequelize, type) => {
        return sequelize.define('tiposMascotas', {
            idTipoMascota: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            nombreTipo: type.STRING,
            createTipoMascota: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Tipos de Mascotas'
        });
    }
    module.exports = tipoMascota;
    