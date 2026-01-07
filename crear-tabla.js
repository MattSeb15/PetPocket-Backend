const mysql = require('mysql2/promise')
const {
	MYSQLHOST,
	MYSQLUSER,
	MYSQLPASSWORD,
	MYSQLDATABASE,
	MYSQLPORT,
} = require('./src/config/keys')

async function crearTablaListas() {
	console.log('🔧 Creando tabla listas...\n')

	const connection = await mysql.createConnection({
		host: MYSQLHOST,
		user: MYSQLUSER,
		password: MYSQLPASSWORD,
		database: MYSQLDATABASE,
		port: MYSQLPORT,
	})

	try {
		// Crear tabla
		await connection.query(`
            CREATE TABLE IF NOT EXISTS listas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,
                descripcion TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `)

		console.log('✅ Tabla "listas" creada exitosamente\n')

		// Verificar que existe
		const [tables] = await connection.query(`
            SHOW TABLES LIKE 'listas'
        `)

		if (tables.length > 0) {
			console.log('📋 Estructura de la tabla:')
			const [columns] = await connection.query('DESCRIBE listas')
			console.table(columns)
		}

		console.log('\n✅ ¡Listo! Ahora reinicia el backend\n')
	} catch (error) {
		console.error('❌ Error:', error.message)
	} finally {
		await connection.end()
	}
}

crearTablaListas()
