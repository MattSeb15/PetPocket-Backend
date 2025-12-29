    const feedback = (sequelize, type) => {
        return sequelize.define('feedback', {
            idFeedback: {
                type: type.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            idCliente: type.INTEGER,
            comentario: type.STRING,
            createFeedback: type.STRING,
        }, {
            timestamps: false,
            comment: 'Tabla de Feedback'
        });
    }
    module.exports = feedback;
    