    const auditoria = (sequelize, type) => {
        return sequelize.define('auditorias', {
            idAuditoria: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idUsuario: type.INTEGER,
            accion: type.STRING,
            fecha: type.DATE,
            createAuditoria: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Auditorias'
        });
    }
    module.exports = auditoria;
    