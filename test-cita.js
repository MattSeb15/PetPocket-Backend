// Script de prueba simple para crear una cita sin veterinario
const mysql = require('mysql2/promise')
const {
	MYSQLHOST,
	MYSQLUSER,
	MYSQLPASSWORD,
	MYSQLDATABASE,
	MYSQLPORT,
} = require('./src/config/keys')

async function testCrearCita() {
	console.log('🧪 Probando creación de cita sin veterinario...\n')

	const connection = await mysql.createConnection({
		host: MYSQLHOST,
		user: MYSQLUSER,
		password: MYSQLPASSWORD,
		database: MYSQLDATABASE,
		port: MYSQLPORT,
	})

	try {
		// Datos de prueba
		const citaPrueba = {
			idCliente: 1,
			idMascota: 5,
			idServicio: 1,
			fecha: '2026-01-10',
			hora: '10:00',
			estadoCita: 'programada',
			userIdUser: null, // ESTO ES LO IMPORTANTE
			createCita: new Date().toLocaleString(),
		}

		console.log('📝 Datos a insertar:', citaPrueba)

		// Intentar crear cita
		const [result] = await connection.query(
			`INSERT INTO citas (idCliente, idMascota, idServicio, fecha, hora, estadoCita, userIdUser, createCita) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				citaPrueba.idCliente,
				citaPrueba.idMascota,
				citaPrueba.idServicio,
				citaPrueba.fecha,
				citaPrueba.hora,
				citaPrueba.estadoCita,
				citaPrueba.userIdUser,
				citaPrueba.createCita,
			]
		)

		console.log('✅ ¡Cita creada exitosamente!')
		console.log('ID de cita creada:', result.insertId)

		// Verificar que se creó
		const [rows] = await connection.query(
			'SELECT * FROM citas WHERE idCita = ?',
			[result.insertId]
		)

		console.log('\n📋 Cita verificada en BD:')
		console.table(rows)

		// Eliminar cita de prueba
		await connection.query('DELETE FROM citas WHERE idCita = ?', [
			result.insertId,
		])
		console.log('\n🧹 Cita de prueba eliminada\n')

		console.log(
			'✅ PRUEBA EXITOSA - La base de datos acepta NULL en userIdUser'
		)
	} catch (error) {
		console.error('\n❌ ERROR:', error.message)
		console.error('Código:', error.code)
		console.error('\n⚠️  La columna userIdUser NO acepta NULL correctamente')
	} finally {
		await connection.end()
	}
}

testCrearCita()
