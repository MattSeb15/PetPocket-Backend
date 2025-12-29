   const producto = (sequelize, type) => {
       return sequelize.define('productos', {
           idProducto: {
               type: type.INTEGER,
               autoIncrement: true,
               primaryKey: true,
           },
           nombreProducto: type.STRING,
           descripcionProducto: type.STRING,
           precioProducto: type.FLOAT,
           stock: type.INTEGER,
           categoria: type.STRING,
           estadoProducto: type.STRING,
           createProducto: type.STRING,
           updateProducto: type.STRING,
       }, {
           timestamps: false,
           comment: 'Tabla de Productos'
       });
   }
   module.exports = producto;
   