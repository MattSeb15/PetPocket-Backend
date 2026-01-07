const sql = require('./src/infrastructure/Database/dataBase.sql.js')

async function verificarUsers() {
	try {
		const [users] = await sql.promise().query('SELECT * FROM users')
		console.log('\n📋 Usuarios en la base de datos:')
		console.table(users)

		if (users.length === 0) {
			console.log('\n⚠️ No hay usuarios en la tabla users')
			console.log(
				'Necesitas crear al menos un veterinario antes de agendar citas.'
			)
		}

		process.exit(0)
	} catch (error) {
		console.error('❌ Error:', error.message)
		process.exit(1)
	}
}

verificarUsers()
