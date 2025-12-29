   const servicio = (sequelize, type) => {
       return sequelize.define('servicios', {
           idServicio: {
               type: type.INTEGER,
               autoIncrement: true,
               primaryKey: true,
           },
           nombreServicio: type.STRING,
           descripcionServicio: type.STRING,
           precioServicio: type.FLOAT,
           estadoServicio: type.STRING,
           createServicio: type.STRING,
           updateServicio: type.STRING,
       }, {
           timestamps: false,
           comment: 'Tabla de Servicios'
       });
   }
   module.exports = servicio;
   