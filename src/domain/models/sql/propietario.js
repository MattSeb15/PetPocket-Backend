   const propietario = (sequelize, type) => {
       return sequelize.define('propietarios', {
           idPropietario: {
               type: type.INTEGER,
               autoIncrement: true,
               primaryKey: true,
           },
           nombrePropietario: type.STRING,
           cedulaPropietario: type.STRING,
           emailPropietario: type.STRING,
           estadoPropietario: type.STRING,
           createPropietario: type.STRING,
           updatePropietario: type.STRING,
       }, {
           timestamps: false,
           comment: 'Tabla de Propietarios'
       });
   }
   module.exports = propietario;
   