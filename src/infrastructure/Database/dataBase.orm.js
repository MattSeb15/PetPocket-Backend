const { Sequelize } = require('sequelize')
const {
	MYSQLHOST,
	MYSQLUSER,
	MYSQLPASSWORD,
	MYSQLDATABASE,
	MYSQLPORT,
	MYSQL_URI,
} = require('../../config/keys')

let sequelize

// Usar URI de conexión si está disponible
if (MYSQL_URI) {
	sequelize = new Sequelize(MYSQL_URI, {
		dialect: 'mysql',
		dialectOptions: {
			charset: 'utf8mb4',
			connectTimeout: 60000, // 60 segundos para conectar
		},
		pool: {
			max: 10, // Reducir máximo de conexiones
			min: 0, // Sin conexiones mínimas
			acquire: 60000, // 60 segundos para obtener conexión
			idle: 20000, // 20 segundos inactiva antes de cerrar
			evict: 30000, // Revisar conexiones inactivas cada 30 seg
		},
		retry: {
			max: 3, // Reintentar 3 veces
		},
		logging: false,
	})
} else {
	// Configuración para parámetros individuales
	sequelize = new Sequelize(MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, {
		host: MYSQLHOST,
		port: MYSQLPORT,
		dialect: 'mysql',
		dialectOptions: {
			charset: 'utf8mb4',
			connectTimeout: 60000, // 60 segundos para conectar
		},
		pool: {
			max: 10, // Reducir máximo de conexiones
			min: 0, // Sin conexiones mínimas
			acquire: 60000, // 60 segundos para obtener conexión
			idle: 20000, // 20 segundos inactiva antes de cerrar
			evict: 30000, // Revisar conexiones inactivas cada 30 seg
		},
		retry: {
			max: 3, // Reintentar 3 veces
		},
		logging: false,
	})
}

// Autenticar y sincronizar
sequelize
	.authenticate()
	.then(() => {
		console.log('Conexión establecida con la base de datos')
	})
	.catch(err => {
		console.error('No se pudo conectar a la base de datos:', err.message)
	})

// Verificar conexión antes de operaciones críticas
const verificarConexion = async () => {
	try {
		await sequelize.authenticate()
		return true
	} catch (error) {
		console.error('❌ Conexión perdida, intentando reconectar...')
		try {
			// Cerrar pool actual
			await sequelize.connectionManager.close()
			// Reinicializar pools
			await sequelize.connectionManager.initPools()
			// Verificar nueva conexión
			await sequelize.authenticate()
			console.log('✅ Reconexión exitosa')
			return true
		} catch (reconnectError) {
			console.error('❌ Fallo al reconectar:', reconnectError.message)
			return false
		}
	}
}

// Sincronización de la base de datos
const syncOptions =
	process.env.NODE_ENV === 'development' ? { force: true } : { alter: true }

sequelize
	.sync(syncOptions)
	.then(() => {
		console.log('Base de Datos sincronizadas')
	})
	.catch(error => {
		console.error('Error al sincronizar la Base de Datos:', error)
	})

// Extracción de Modelos
const usuarioModel = require('../../domain/models/sql/usuario')
const rolModel = require('../../domain/models/sql/rol')
const detalleRolModel = require('../../domain/models/sql/detalleRol')
const clienteModel = require('../../domain/models/sql/cliente')
const mascotaModel = require('../../domain/models/sql/mascota')
const servicioModel = require('../../domain/models/sql/servicio')
const citaModel = require('../../domain/models/sql/cita')
const propietarioModel = require('../../domain/models/sql/propietario')
const productoModel = require('../../domain/models/sql/producto')
const pagoModel = require('../../domain/models/sql/pago')
const notificacionModel = require('../../domain/models/sql/notificacion')
const auditoriaModel = require('../../domain/models/sql/auditoria')
const feedbackModel = require('../../domain/models/sql/feedback')
const promocionModel = require('../../domain/models/sql/promocion')
const reservaModel = require('../../domain/models/sql/reserva')

// Nuevos modelos agregados
const configuracionModel = require('../../domain/models/sql/configuracion')
const configuracionServicioModel = require('../../domain/models/sql/configuracionServicio')
const historialCitaModel = require('../../domain/models/sql/historialCita')
const historialPagoModel = require('../../domain/models/sql/historialPago')
const logModel = require('../../domain/models/sql/log')
const pageModel = require('../../domain/models/sql/page')
const tipoMascotaModel = require('../../domain/models/sql/tipoMascota')
const tipoServicioModel = require('../../domain/models/sql/tipoServicio')

// Inicializar los modelos a sincronizar
const usuario = usuarioModel(sequelize, Sequelize)
const rol = rolModel(sequelize, Sequelize)
const detalleRol = detalleRolModel(sequelize, Sequelize)
const cliente = clienteModel(sequelize, Sequelize)
const mascota = mascotaModel(sequelize, Sequelize)
const servicio = servicioModel(sequelize, Sequelize)
const cita = citaModel(sequelize, Sequelize)
const propietario = propietarioModel(sequelize, Sequelize)
const producto = productoModel(sequelize, Sequelize)
const pago = pagoModel(sequelize, Sequelize)
const notificacion = notificacionModel(sequelize, Sequelize)
const auditoria = auditoriaModel(sequelize, Sequelize)
const feedback = feedbackModel(sequelize, Sequelize)
const promocion = promocionModel(sequelize, Sequelize)
const reserva = reservaModel(sequelize, Sequelize)

// Nuevos modelos inicializados
const configuracion = configuracionModel(sequelize, Sequelize)
const configuracionServicio = configuracionServicioModel(sequelize, Sequelize)
const historialCita = historialCitaModel(sequelize, Sequelize)
const historialPago = historialPagoModel(sequelize, Sequelize)
const log = logModel(sequelize, Sequelize)
const page = pageModel(sequelize, Sequelize)
const tipoMascota = tipoMascotaModel(sequelize, Sequelize)
const tipoServicio = tipoServicioModel(sequelize, Sequelize)

// Definir relaciones o claves foráneas

// Relaciones entre Usuario y DetalleRol
usuario.hasMany(detalleRol)
detalleRol.belongsTo(usuario)

// Relaciones entre Rol y DetalleRol
rol.hasMany(detalleRol)
detalleRol.belongsTo(rol)

// Relaciones entre Usuario y Citas
usuario.hasMany(cita)
cita.belongsTo(usuario)

// Relaciones entre Cliente y Mascotas
cliente.hasMany(mascota)
mascota.belongsTo(cliente)

// Relaciones entre Cliente y Citas
cliente.hasMany(cita)
cita.belongsTo(cliente)

// Relaciones entre Mascota y Citas
mascota.hasMany(cita)
cita.belongsTo(mascota)

// Relaciones entre Servicio y Citas
servicio.hasMany(cita)
cita.belongsTo(servicio)

// Relaciones entre Propietario y Mascotas
propietario.hasMany(mascota)
mascota.belongsTo(propietario)

// Relaciones entre Citas y Pagos
cita.hasMany(pago)
pago.belongsTo(cita)

// Exportar todos los modelos
module.exports = {
	usuario,
	rol,
	detalleRol,
	cliente,
	mascota,
	servicio,
	cita,
	propietario,
	producto,
	pago,
	notificacion,
	auditoria,
	feedback,
	promocion,
	reserva,
	configuracion,
	configuracionServicio,
	historialCita,
	historialPago,
	log,
	page,
	tipoMascota,
	tipoServicio,
	sequelize, // Exportar instancia de Sequelize
	verificarConexion, // Exportar función de verificación
}
