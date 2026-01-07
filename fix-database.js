const mysql = require('mysql2/promise')
const {
	MYSQLHOST,
	MYSQLUSER,
	MYSQLPASSWORD,
	MYSQLDATABASE,
	MYSQLPORT,
} = require('./src/config/keys')

async function fixDatabase() {
	console.log('🔧 Conectando a la base de datos...')

	const connection = await mysql.createConnection({
		host: MYSQLHOST,
		user: MYSQLUSER,
		password: MYSQLPASSWORD,
		database: MYSQLDATABASE,
		port: MYSQLPORT,
	})

	try {
		console.log('✅ Conectado exitosamente\n')

		// 1. Verificar estructura actual
		console.log('📋 Estructura actual de la columna userIdUser:')
		const [columns] = await connection.query(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${MYSQLDATABASE}'
            AND TABLE_NAME = 'citas'
            AND COLUMN_NAME = 'userIdUser'
        `)
		console.table(columns)

		// 2. Modificar columna
		console.log('\n🔨 Modificando columna para permitir NULL...')
		await connection.query(`
            ALTER TABLE citas MODIFY COLUMN userIdUser INT NULL
        `)
		console.log('✅ Columna modificada exitosamente\n')

		// 3. Verificar cambio
		console.log('📋 Nueva estructura de la columna userIdUser:')
		const [newColumns] = await connection.query(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${MYSQLDATABASE}'
            AND TABLE_NAME = 'citas'
            AND COLUMN_NAME = 'userIdUser'
        `)
		console.table(newColumns)

		console.log('\n✅ ¡Base de datos actualizada correctamente!')
		console.log('🚀 Ahora reinicia el backend con: npm run dev\n')
	} catch (error) {
		console.error('❌ Error:', error.message)
	} finally {
		await connection.end()
	}
}

fixDatabase()
