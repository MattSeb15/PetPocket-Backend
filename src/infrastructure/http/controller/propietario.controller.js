const propietarioCtl = {};
const orm = require('../../Database/dataBase.orm.js');
const sql = require('../../Database/dataBase.sql.js');
const mongo = require('../../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../../../application/controller/encrypDates.js');

// Función para descifrar de forma segura
const descifrarSeguro = (dato) => {
  try {
    return dato ? descifrarDatos(dato) : '';
  } catch (error) {
    console.error('Error al descifrar:', error);
    return '';
  }
};

// Mostrar todos los propietarios con sus mascotas
propietarioCtl.mostrarPropietarios = async (req, res) => {
    try {
        const [listaPropietarios] = await sql.promise().query(`
            SELECT p.*, COUNT(m.idMascota) as cantidadMascotas
            FROM propietarios p
            LEFT JOIN mascotas m ON p.idPropietario = m.idPropietario
            WHERE p.estadoPropietario = 'activo'
            GROUP BY p.idPropietario
            ORDER BY p.createPropietario DESC
        `);

        const propietariosCompletos = await Promise.all(
            listaPropietarios.map(async (propietario) => {
                const propietarioMongo = await mongo.propietarioModel.findOne({ 
                    idPropietarioSql: propietario.idPropietario.toString()
                });

                return {
                    ...propietario,
                    nombrePropietario: descifrarSeguro(propietario.nombrePropietario),
                    cedulaPropietario: descifrarSeguro(propietario.cedulaPropietario),
                    emailPropietario: descifrarSeguro(propietario.emailPropietario),
                    detallesMongo: propietarioMongo ? {
                        direccionDomicilio: propietarioMongo.direccionDomicilio,
                        telefonoAlternativo: propietarioMongo.telefonoAlternativo,
                        preferenciasContacto: propietarioMongo.preferenciasContacto,
                        aceptaNotificaciones: propietarioMongo.aceptaNotificaciones,
                        notasInternas: propietarioMongo.notasInternas,
                        referencias: propietarioMongo.referencias
                    } : null
                };
            })
        );

        return res.json(propietariosCompletos);
    } catch (error) {
        console.error('Error al mostrar propietarios:', error);
        return res.status(500).json({ message: 'Error al obtener los propietarios', error: error.message });
    }
};

// Crear nuevo propietario
propietarioCtl.crearPropietario = async (req, res) => {
    try {
        const { 
            nombrePropietario, cedulaPropietario, emailPropietario,
            direccionDomicilio, telefonoAlternativo, preferenciasContacto, aceptaNotificaciones 
        } = req.body;

        if (!nombrePropietario || !cedulaPropietario || !emailPropietario) {
            return res.status(400).json({ message: 'Nombre, cédula y email son obligatorios' });
        }

        const nuevoPropietario = await orm.propietario.create({
            nombrePropietario: cifrarDatos(nombrePropietario),
            cedulaPropietario: cifrarDatos(cedulaPropietario),
            emailPropietario: cifrarDatos(emailPropietario),
            estadoPropietario: 'activo',
            createPropietario: new Date().toLocaleString(),
        });

        await mongo.propietarioModel.create({
            idPropietarioSql: nuevoPropietario.idPropietario.toString(),
            direccionDomicilio: direccionDomicilio || '',
            telefonoAlternativo: telefonoAlternativo || '',
            preferenciasContacto: preferenciasContacto || 'llamada',
            aceptaNotificaciones: aceptaNotificaciones !== false,
            notasInternas: '',
            referencias: []
        });

        return res.status(201).json({ 
            message: 'Propietario creado exitosamente',
            idPropietario: nuevoPropietario.idPropietario
        });

    } catch (error) {
        console.error('Error al crear propietario:', error);
        return res.status(500).json({ 
            message: 'Error al crear el propietario', 
            error: error.message 
        });
    }
};

// Actualizar propietario
propietarioCtl.actualizarPropietario = async (req, res) => {
    try {
        const { idPropietario } = req.params; // Suponiendo que el ID se pasa como parámetro en la URL
        const { 
            nombrePropietario, cedulaPropietario, emailPropietario,
            direccionDomicilio, telefonoAlternativo, preferenciasContacto, aceptaNotificaciones 
        } = req.body;

        if (!nombrePropietario || !cedulaPropietario || !emailPropietario) {
            return res.status(400).json({ message: 'Nombre, cédula y email son obligatorios' });
        }

        // Actualizar en la base de datos SQL
        await orm.propietario.update({
            nombrePropietario: cifrarDatos(nombrePropietario),
            cedulaPropietario: cifrarDatos(cedulaPropietario),
            emailPropietario: cifrarDatos(emailPropietario),
        }, {
            where: { idPropietario }
        });

        // Actualizar en la base de datos MongoDB
        await mongo.propietarioModel.updateOne(
            { idPropietarioSql: idPropietario },
            {
                direccionDomicilio: direccionDomicilio || '',
                telefonoAlternativo: telefonoAlternativo || '',
                preferenciasContacto: preferenciasContacto || 'llamada',
                aceptaNotificaciones: aceptaNotificaciones !== false,
            }
        );

        return res.json({ message: 'Propietario actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar propietario:', error);
        return res.status(500).json({ 
            message: 'Error al actualizar el propietario', 
            error: error.message 
        });
    }
};

// Eliminar propietario (marcar como inactivo)
propietarioCtl.eliminarPropietario = async (req, res) => {
    try {
        const { idPropietario } = req.params; // Suponiendo que el ID se pasa como parámetro en la URL

        // Marcar como inactivo en SQL
        await orm.propietario.update({
            estadoPropietario: 'inactivo',
            updatePropietario: new Date().toLocaleString(),
        }, {
            where: { idPropietario }
        });

        // Marcar como inactivo en MongoDB
        await mongo.propietarioModel.updateOne(
            { idPropietarioSql: idPropietario },
            { estadoPropietario: 'inactivo' }
        );

        return res.json({ message: 'Propietario eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar propietario:', error);
        return res.status(500).json({ 
            message: 'Error al eliminar el propietario', 
            error: error.message 
        });
    }
}

module.exports = propietarioCtl;


