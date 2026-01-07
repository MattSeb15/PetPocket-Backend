// Test directo con Sequelize ORM
const orm = require('./src/infrastructure/Database/dataBase.orm')

async function testSequelizeCita() {
	console.log('🧪 Probando creación de cita con Sequelize ORM...\n')

	try {
		const citaPrueba = {
			idCliente: 1,
			idMascota: 5,
			idServicio: 1,
			fecha: '2026-01-10',
			hora: '10:00',
			estadoCita: 'programada',
			userIdUser: null, // NULL explícito
			createCita: new Date().toLocaleString(),
		}

		console.log('📝 Datos a crear:', citaPrueba)
		console.log(
			'userIdUser:',
			citaPrueba.userIdUser,
			'tipo:',
			typeof citaPrueba.userIdUser
		)

		const nuevaCita = await orm.cita.create(citaPrueba)

		console.log('\n✅ ¡Cita creada con Sequelize!')
		console.log('ID:', nuevaCita.idCita)
		console.log('userIdUser guardado:', nuevaCita.userIdUser)

		// Eliminar cita de prueba
		await orm.cita.destroy({ where: { idCita: nuevaCita.idCita } })
		console.log('\n🧹 Cita de prueba eliminada')

		console.log('\n✅ SEQUELIZE FUNCIONA CORRECTAMENTE\n')
		process.exit(0)
	} catch (error) {
		console.error('\n❌ ERROR con Sequelize:')
		console.error('Mensaje:', error.message)
		console.error('Nombre:', error.name)
		if (error.parent) {
			console.error('Error SQL:', error.parent.message)
			console.error('SQL State:', error.parent.sqlState)
			console.error('Errno:', error.parent.errno)
		}
		console.error('\n⚠️  Sequelize NO puede crear cita con userIdUser NULL\n')
		process.exit(1)
	}
}

// Esperar a que Sequelize se conecte
setTimeout(() => {
	testSequelizeCita()
}, 2000)
