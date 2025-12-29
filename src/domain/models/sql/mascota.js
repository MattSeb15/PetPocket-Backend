   const mascota = (sequelize, type) => {
       return sequelize.define('mascotas', {
           idMascota: {
               type: type.INTEGER,
               autoIncrement: true,
               primaryKey: true,
           },
           nombreMascota: type.STRING,
           especie: type.STRING,
           raza: type.STRING,
           edad: type.INTEGER,
           sexo: type.STRING,
           idPropietario: type.INTEGER,
           createMascota: type.STRING,
           updateMascota: type.STRING,
       }, {
           timestamps: false,
           comment: 'Tabla de Mascotas'
       });
   }
   module.exports = mascota;
   