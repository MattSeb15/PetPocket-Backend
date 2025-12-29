const paginaCtl = {};
const orm = require('../../Database/dataBase.orm.js');
const sql = require('../../Database/dataBase.sql.js');
const mongo = require('../../Database/dataBaseMongose');
const { cifrarDatos, descifrarDatos } = require('../../../application/controller/encrypDates.js');

// Función para descifrar datos de forma segura
function safeDecrypt(data) {
    try {
        return descifrarDatos(data);
    } catch (error) {
        console.error('Error al descifrar datos:', error.message);
        return ''; // Devolver una cadena vacía si ocurre un error
    }
}

// Mostrar página
paginaCtl.mostrarPagina = async (req, res) => {
    try {
        const [listaPagina] = await sql.promise().query('SELECT * FROM pages');
        
        if (listaPagina.length === 0) {
            return res.status(404).json({ message: 'No se encontraron páginas' });
        }

        const pagina = await mongo.pageModel.findOne({ idPageSql: listaPagina[0].idPage });
        const data = {
            paginas: listaPagina[0],
            pagina
        };

        return res.json(data);
    } catch (error) {
        console.error('Error al mostrar la página:', error);
        return res.status(500).json({ message: 'Error al mostrar la página', error: error.message });
    }
};

// Mandar página
paginaCtl.mandarPagina = async (req, res) => {
    try {
        const { namePage, description, statePage, visionPage, misionPage, celularPage, correoPagina } = req.body;

        // Validar datos de entrada
        if (!namePage || !description || !statePage) {
            return res.status(400).json({ message: 'Los campos namePage, description y statePage son obligatorios' });
        }

        const envioSQL = {
            namePage,
            description,
            statePage,
            createPage: new Date().toLocaleString(),
        };

        const envioPage = await orm.page.create(envioSQL);
        const idPagina = envioPage.insertId;

        const envioMongo = {
            visionPage,
            misionPage,
            celularPage,
            correoPagina,
            idPageSql: idPagina,
            createPageMongo: new Date().toLocaleString(),
        };

        await mongo.pageModel.create(envioMongo);
        req.flash('success', 'Éxito al guardar');
        return res.status(201).json({ message: 'Éxito al guardar' });

    } catch (error) {
        console.error('Error al enviar la página:', error);
        return res.status(500).json({ message: 'Error al enviar la página', error: error.message });
    }
};

module.exports = paginaCtl;
