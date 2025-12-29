const sql = require('./src/infrastructure/Database/dataBase.sql.js');
const { cifrarDatos } = require('./src/application/controller/encrypDates.js');

console.log('🚀 Iniciando población de base de datos...\n');

const poblarDB = async () => {
    try {
        // 1. INSERTAR CLIENTES
        console.log('📝 Insertando clientes...');
        await sql.promise().query(`
            INSERT INTO clientes (cedulaCliente, nombreCliente, usernameCliente, passwordCliente, stadoCliente, createCliente) VALUES
            (?, ?, ?, ?, 'activo', NOW()),
            (?, ?, ?, ?, 'activo', NOW()),
            (?, ?, ?, ?, 'activo', NOW())
        `, [
            cifrarDatos('1234567890'), cifrarDatos('Juan Pérez'), cifrarDatos('juan.perez'), cifrarDatos('password123'),
            cifrarDatos('0987654321'), cifrarDatos('María González'), cifrarDatos('maria.gonzalez'), cifrarDatos('password123'),
            cifrarDatos('1122334455'), cifrarDatos('Carlos Rodríguez'), cifrarDatos('carlos.rodriguez'), cifrarDatos('password123')
        ]);
        console.log('✅ Clientes insertados\n');

        // 2. INSERTAR MASCOTAS
        console.log('📝 Insertando mascotas...');
        await sql.promise().query(`
            INSERT INTO mascotas (nombreMascota, especie, raza, edad, sexo, createMascota) VALUES
            (?, ?, ?, 3, 'M', NOW()),
            (?, ?, ?, 5, 'H', NOW()),
            (?, ?, ?, 2, 'M', NOW()),
            (?, ?, ?, 4, 'H', NOW()),
            (?, ?, ?, 1, 'M', NOW())
        `, [
            cifrarDatos('Max'), cifrarDatos('Perro'), cifrarDatos('Labrador'),
            cifrarDatos('Luna'), cifrarDatos('Gato'), cifrarDatos('Siamés'),
            cifrarDatos('Rocky'), cifrarDatos('Perro'), cifrarDatos('Pastor Alemán'),
            cifrarDatos('Michi'), cifrarDatos('Gato'), cifrarDatos('Persa'),
            cifrarDatos('Zeus'), cifrarDatos('Perro'), cifrarDatos('Golden Retriever')
        ]);
        console.log('✅ Mascotas insertadas\n');

        // 3. INSERTAR SERVICIOS
        console.log('📝 Insertando servicios...');
        await sql.promise().query(`
            INSERT INTO servicios (nombreServicio, descripcionServicio, precioServicio, estadoServicio, createServicio) VALUES
            (?, 'Vacunación completa para mascotas', 50.00, 'activo', NOW()),
            (?, 'Consulta médica general', 35.00, 'activo', NOW()),
            (?, 'Baño y peluquería', 25.00, 'activo', NOW()),
            (?, 'Desparasitación interna y externa', 30.00, 'activo', NOW()),
            (?, 'Cirugía menor', 150.00, 'activo', NOW())
        `, [
            cifrarDatos('Vacunación'),
            cifrarDatos('Consulta Veterinaria'),
            cifrarDatos('Grooming'),
            cifrarDatos('Desparasitación'),
            cifrarDatos('Cirugía')
        ]);
        console.log('✅ Servicios insertados\n');

        // 4. INSERTAR USUARIOS (VETERINARIOS)
        console.log('📝 Insertando usuarios/veterinarios...');
        await sql.promise().query(`
            INSERT INTO users (nameUsers, userName, emailUser, passwordUser, stateUser, createUser) VALUES
            (?, 'dr.martinez', 'martinez@petpocket.com', ?, 'activo', NOW()),
            (?, 'dra.lopez', 'lopez@petpocket.com', ?, 'activo', NOW()),
            (?, 'dr.sanchez', 'sanchez@petpocket.com', ?, 'activo', NOW())
        `, [
            cifrarDatos('Dr. Roberto Martínez'), cifrarDatos('vet123'),
            cifrarDatos('Dra. Ana López'), cifrarDatos('vet123'),
            cifrarDatos('Dr. Pedro Sánchez'), cifrarDatos('vet123')
        ]);
        console.log('✅ Usuarios insertados\n');

        // 5. OBTENER LOS IDs GENERADOS
        const [clientes] = await sql.promise().query('SELECT idClientes FROM clientes ORDER BY idClientes DESC LIMIT 3');
        const [mascotas] = await sql.promise().query('SELECT idMascota FROM mascotas ORDER BY idMascota DESC LIMIT 5');
        const [servicios] = await sql.promise().query('SELECT idServicio FROM servicios ORDER BY idServicio DESC LIMIT 5');
        const [usuarios] = await sql.promise().query('SELECT idUser FROM users ORDER BY idUser DESC LIMIT 3');

        console.log('📊 IDs obtenidos:');
        console.log('   Clientes:', clientes.map(c => c.idClientes));
        console.log('   Mascotas:', mascotas.map(m => m.idMascota));
        console.log('   Servicios:', servicios.map(s => s.idServicio));
        console.log('   Usuarios:', usuarios.map(u => u.idUser));
        console.log('');

        // 6. ELIMINAR CITAS ANTIGUAS CON REFERENCIAS INVÁLIDAS
        console.log('🗑️  Eliminando citas con referencias inválidas...');
        await sql.promise().query('DELETE FROM citas WHERE idCliente NOT IN (SELECT idClientes FROM clientes)');
        console.log('✅ Citas inválidas eliminadas\n');

        // 7. INSERTAR NUEVAS CITAS
        console.log('📝 Insertando nuevas citas...');
        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        const pasadoManana = new Date(hoy);
        pasadoManana.setDate(pasadoManana.getDate() + 2);

        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        await sql.promise().query(`
            INSERT INTO citas (idCliente, idMascota, idServicio, fecha, hora, estadoCita, userIdUser, createCita) VALUES
            (?, ?, ?, ?, '09:00', 'programada', ?, NOW()),
            (?, ?, ?, ?, '10:30', 'programada', ?, NOW()),
            (?, ?, ?, ?, '14:00', 'programada', ?, NOW()),
            (?, ?, ?, ?, '15:30', 'confirmada', ?, NOW()),
            (?, ?, ?, ?, '11:00', 'programada', ?, NOW())
        `, [
            clientes[0].idClientes, mascotas[0].idMascota, servicios[0].idServicio, formatDate(manana), usuarios[0].idUser,
            clientes[0].idClientes, mascotas[1].idMascota, servicios[1].idServicio, formatDate(manana), usuarios[1].idUser,
            clientes[1].idClientes, mascotas[2].idMascota, servicios[2].idServicio, formatDate(pasadoManana), usuarios[0].idUser,
            clientes[1].idClientes, mascotas[3].idMascota, servicios[3].idServicio, formatDate(pasadoManana), usuarios[2].idUser,
            clientes[2].idClientes, mascotas[4].idMascota, servicios[4].idServicio, formatDate(manana), usuarios[1].idUser
        ]);
        console.log('✅ Citas insertadas\n');

        // 8. VERIFICAR RESULTADOS
        const [totalCitas] = await sql.promise().query('SELECT COUNT(*) as total FROM citas');
        const [citasConJoin] = await sql.promise().query(`
            SELECT COUNT(*) as total FROM citas c
            JOIN clientes cl ON c.idCliente = cl.idClientes
            JOIN mascotas m ON c.idMascota = m.idMascota
            JOIN servicios s ON c.idServicio = s.idServicio
            LEFT JOIN users u ON c.userIdUser = u.idUser
        `);

        console.log('📊 RESUMEN FINAL:');
        console.log('   ✅ Total de citas en DB:', totalCitas[0].total);
        console.log('   ✅ Citas con relaciones válidas:', citasConJoin[0].total);
        console.log('');
        console.log('🎉 ¡Base de datos poblada exitosamente!\n');
        console.log('Ahora puedes probar el endpoint: GET http://localhost:3000/cita/lista\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error al poblar la base de datos:', error.message);
        console.error(error);
        process.exit(1);
    }
};

poblarDB();
