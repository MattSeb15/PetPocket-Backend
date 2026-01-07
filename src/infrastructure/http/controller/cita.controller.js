const citaCtl = {}
const orm = require('../../Database/dataBase.orm.js')
const sql = require('../../Database/dataBase.sql.js')
const mongo = require('../../Database/dataBaseMongose')
const {
	cifrarDatos,
	descifrarDatos,
} = require('../../../application/controller/encrypDates.js')

// Función para descifrar de forma segura
const descifrarSeguro = dato => {
	if (!dato) return ''

	// Si no parece cifrado, devolver el valor tal cual
	const esCifrado = typeof dato === 'string' && dato.startsWith('U2FsdGVk')

	try {
		return esCifrado ? descifrarDatos(dato) : dato
	} catch (error) {
		// Evitar romper el flujo por datos sin cifrar o corruptos
		return dato
	}
}

// Función para ejecutar operaciones con reintentos
const ejecutarConReintentos = async (operacion, intentos = 3, delay = 1000) => {
	for (let i = 0; i < intentos; i++) {
		try {
			return await operacion()
		} catch (error) {
			const esErrorConexion =
				error.name === 'SequelizeDatabaseError' ||
				error.message.includes('ECONNRESET') ||
				error.message.includes('ETIMEDOUT') ||
				error.message.includes('ECONNREFUSED')

			if (esErrorConexion && i < intentos - 1) {
				console.warn(
					`⚠️ Intento ${i + 1}/${intentos} falló, reintentando en ${delay}ms...`
				)
				await new Promise(resolve => setTimeout(resolve, delay))
				continue
			}
			throw error
		}
	}
}

// Función para decodificar campos de URL
const decodificarCampo = campo => {
	try {
		return campo ? decodeURIComponent(campo) : ''
	} catch (error) {
		console.error('Error al decodificar:', error)
		return campo || ''
	}
}

// Mostrar todas las citas con información completa
citaCtl.mostrarCitas = async (req, res) => {
	try {
		const [listaCitas] = await sql.promise().query(`
	     SELECT c.*, 
		     cl.nombreCliente, cl.cedulaCliente,
		     m.nombreMascota, m.especie,
		     s.nombreServicio, s.precioServicio,
		     u.nameUsers as veterinario
	     FROM citas c
	     LEFT JOIN clientes cl ON c.idCliente = cl.idClientes
	     LEFT JOIN mascotas m ON c.idMascota = m.idMascota
	     LEFT JOIN servicios s ON c.idServicio = s.idServicio
	     LEFT JOIN users u ON c.userIdUser = u.idUser
	     ORDER BY c.fecha DESC, c.hora DESC
	 `)

		const citasCompletas = await Promise.all(
			listaCitas.map(async cita => {
				const citaMongo = await mongo.citaModel.findOne({
					idCitaSql: cita.idCita.toString(),
				})

				return {
					...cita,
					cliente: {
						nombre: descifrarSeguro(cita.nombreCliente),
						cedula: descifrarSeguro(cita.cedulaCliente),
					},
					mascota: {
						nombre: descifrarSeguro(cita.nombreMascota),
						especie: descifrarSeguro(cita.especie),
					},
					servicio: {
						nombre: descifrarSeguro(cita.nombreServicio),
						precio: cita.precioServicio,
					},
					veterinario: descifrarSeguro(cita.veterinario),
					detallesMongo: citaMongo
						? {
								motivo: citaMongo.motivo,
								sintomas: citaMongo.sintomas,
								diagnosticoPrevio: citaMongo.diagnosticoPrevio,
								tratamientosAnteriores: citaMongo.tratamientosAnteriores,
								estado: citaMongo.estado,
								notasAdicionales: citaMongo.notasAdicionales,
								asistio: citaMongo.asistio,
								fechaReal: citaMongo.fechaReal,
						  }
						: null,
				}
			})
		)

		return res.json(citasCompletas)
	} catch (error) {
		console.error('Error al mostrar citas:', error)
		return res
			.status(500)
			.json({ message: 'Error al obtener las citas', error: error.message })
	}
}

// DEBUG: Endpoint para ver qué datos llegan
citaCtl.debugCita = async (req, res) => {
	console.log('\n🔍 DEBUG - Body recibido:')
	console.log(JSON.stringify(req.body, null, 2))
	console.log('\n🔍 Tipo de cada campo:')
	Object.keys(req.body).forEach(key => {
		console.log(
			`  ${key}: ${typeof req.body[key]} = ${JSON.stringify(req.body[key])}`
		)
	})
	return res.json({ debug: 'ok', received: req.body })
}

// Crear nueva cita
citaCtl.crearCita = async (req, res) => {
	try {
		// Verificar conexión antes de crear
		if (orm.verificarConexion) {
			const conectado = await orm.verificarConexion()
			if (!conectado) {
				return res.status(503).json({
					message:
						'Error de conexión con la base de datos. Intente nuevamente.',
				})
			}
		}

		const {
			idCliente,
			idMascota,
			idServicio,
			fecha,
			hora,
			userIdUser,
			motivo,
			sintomas,
			diagnosticoPrevio,
			tratamientosAnteriores,
			notasAdicionales,
		} = req.body

		if (!idCliente || !idMascota || !idServicio || !fecha || !hora) {
			return res.status(400).json({
				message: 'Cliente, mascota, servicio, fecha y hora son obligatorios',
			})
		}

		console.log('📥 Datos recibidos:', {
			idCliente,
			idMascota,
			idServicio,
			fecha,
			hora,
			userIdUser,
		})

		// Si userIdUser viene como null, undefined, 0, o string vacío, usar null
		let veterinarioFinal = null
		if (userIdUser && userIdUser !== '' && userIdUser !== 'null') {
			veterinarioFinal = parseInt(userIdUser)
			if (isNaN(veterinarioFinal) || veterinarioFinal <= 0) {
				veterinarioFinal = null
			}
		}

		console.log('✅ userIdUser final para BD:', veterinarioFinal)

		// Crear en SQL primero (con reintentos)
		const nuevaCita = await ejecutarConReintentos(
			async () => {
				return await orm.cita.create({
					idCliente: idCliente,
					idMascota: idMascota,
					idServicio: idServicio,
					fecha: fecha,
					hora: decodificarCampo(hora),
					estadoCita: 'programada',
					userIdUser: veterinarioFinal,
					createCita: new Date().toLocaleString(),
				})
			},
			3,
			2000
		)

		// VERIFICACIÓN 1: Confirmar que se creó en SQL
		if (!nuevaCita || !nuevaCita.idCita) {
			throw new Error('Error al crear cita en base de datos SQL')
		}

		// Crear en MongoDB
		const citaMongo = await mongo.citaModel.create({
			idCitaSql: nuevaCita.idCita.toString(),
			idCliente: idCliente.toString(),
			idMascota: idMascota.toString(),
			motivo: decodificarCampo(motivo) || '',
			sintomas: decodificarCampo(sintomas) || '',
			diagnosticoPrevio: decodificarCampo(diagnosticoPrevio) || '',
			tratamientosAnteriores: tratamientosAnteriores || [],
			estado: 'pendiente',
			notasAdicionales: decodificarCampo(notasAdicionales) || '',
			asistio: false,
		})

		// VERIFICACIÓN 2: Confirmar que se creó en MongoDB
		if (!citaMongo || !citaMongo._id) {
			// Si falla MongoDB, eliminar la cita de SQL para mantener consistencia
			await orm.cita.destroy({ where: { idCita: nuevaCita.idCita } })
			throw new Error('Error al crear cita en MongoDB')
		}

		// VERIFICACIÓN 3: Consultar ambas bases de datos para confirmar
		const citaSQL = await orm.cita.findByPk(nuevaCita.idCita)
		const citaMongoVerificada = await mongo.citaModel.findOne({
			idCitaSql: nuevaCita.idCita.toString(),
		})

		console.log('✅ CITA CREADA EXITOSAMENTE:')
		console.log('  - ID SQL:', nuevaCita.idCita)
		console.log('  - ID MongoDB:', citaMongo._id)
		console.log('  - Fecha:', nuevaCita.fecha)
		console.log('  - Hora:', nuevaCita.hora)
		console.log('  - Cliente ID:', idCliente)
		console.log('  - Mascota ID:', idMascota)
		console.log('  - Verificada en SQL:', !!citaSQL)
		console.log('  - Verificada en MongoDB:', !!citaMongoVerificada)

		// OBTENER LISTA ACTUALIZADA DE CITAS
		const [listaCitas] = await sql.promise().query(`
            SELECT c.*, 
                   cl.nombreCliente, cl.cedulaCliente,
                   m.nombreMascota, m.especie,
                   s.nombreServicio, s.precioServicio,
                   u.nameUsers as veterinario
            FROM citas c
            JOIN clientes cl ON c.idCliente = cl.idClientes
            JOIN mascotas m ON c.idMascota = m.idMascota
            JOIN servicios s ON c.idServicio = s.idServicio
            LEFT JOIN users u ON c.userIdUser = u.idUser
            ORDER BY c.fecha DESC, c.hora DESC
        `)

		const citasCompletas = await Promise.all(
			listaCitas.map(async cita => {
				const citaMongo = await mongo.citaModel.findOne({
					idCitaSql: cita.idCita.toString(),
				})

				return {
					...cita,
					cliente: {
						nombre: descifrarSeguro(cita.nombreCliente),
						cedula: descifrarSeguro(cita.cedulaCliente),
					},
					mascota: {
						nombre: descifrarSeguro(cita.nombreMascota),
						especie: descifrarSeguro(cita.especie),
					},
					servicio: {
						nombre: descifrarSeguro(cita.nombreServicio),
						precio: cita.precioServicio,
					},
					veterinario: descifrarSeguro(cita.veterinario),
					detallesMongo: citaMongo
						? {
								motivo: citaMongo.motivo,
								sintomas: citaMongo.sintomas,
								diagnosticoPrevio: citaMongo.diagnosticoPrevio,
								tratamientosAnteriores: citaMongo.tratamientosAnteriores,
								estado: citaMongo.estado,
								notasAdicionales: citaMongo.notasAdicionales,
								asistio: citaMongo.asistio,
								fechaReal: citaMongo.fechaReal,
						  }
						: null,
				}
			})
		)
		console.log('CITAS COMPLETAS:', citasCompletas)
		// VERIFICACIÓN 4: Respuesta completa con datos de verificación y lista de citas
		return res.status(201).json({
			success: true,
			message: 'Cita creada exitosamente',
			data: {
				idCita: nuevaCita.idCita,
				idMongoDB: citaMongo._id,
				fecha: nuevaCita.fecha,
				hora: nuevaCita.hora,
				estadoCita: nuevaCita.estadoCita,
			},
			verificacion: {
				existeEnSQL: !!citaSQL,
				existeEnMongoDB: !!citaMongoVerificada,
				sincronizado: !!citaSQL && !!citaMongoVerificada,
			},
			listaCitas: citasCompletas,
		})
	} catch (error) {
		console.error('❌ Error al crear cita:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al crear la cita',
			error: error.message,
		})
	}
}

// Actualizar cita
citaCtl.actualizarCita = async (req, res) => {
	try {
		const { idCita } = req.params // Suponiendo que el ID se pasa como parámetro en la URL
		const {
			idCliente,
			idMascota,
			idServicio,
			fecha,
			hora,
			userIdUser,
			motivo,
			sintomas,
			diagnosticoPrevio,
			tratamientosAnteriores,
			notasAdicionales,
		} = req.body

		if (!idCliente || !idMascota || !idServicio || !fecha || !hora) {
			return res.status(400).json({
				message: 'Cliente, mascota, servicio, fecha y hora son obligatorios',
			})
		}

		// Actualizar en la base de datos SQL
		await orm.cita.update(
			{
				idCliente: idCliente,
				idMascota: idMascota,
				idServicio: idServicio,
				fecha: fecha,
				hora: decodificarCampo(hora),
				estadoCita: 'programada',
				userIdUser: userIdUser || null,
			},
			{
				where: { idCita },
			}
		)

		// Actualizar en la base de datos MongoDB
		await mongo.citaModel.updateOne(
			{ idCitaSql: idCita },
			{
				idCliente: idCliente.toString(),
				idMascota: idMascota.toString(),
				motivo: decodificarCampo(motivo) || '',
				sintomas: decodificarCampo(sintomas) || '',
				diagnosticoPrevio: decodificarCampo(diagnosticoPrevio) || '',
				tratamientosAnteriores: tratamientosAnteriores || [],
				notasAdicionales: decodificarCampo(notasAdicionales) || '',
				asistio: false, // Puedes cambiar esto si es necesario
			}
		)

		return res.json({ message: 'Cita actualizada exitosamente' })
	} catch (error) {
		console.error('Error al actualizar cita:', error)
		return res.status(500).json({
			message: 'Error al actualizar la cita',
			error: error.message,
		})
	}
}

// Eliminar cita
citaCtl.eliminarCita = async (req, res) => {
	try {
		const { idCita } = req.params // Suponiendo que el ID se pasa como parámetro en la URL

		// Marcar como inactivo en SQL
		await orm.cita.update(
			{
				estadoCita: 'cancelada',
				updateCita: new Date().toLocaleString(),
			},
			{
				where: { idCita },
			}
		)

		// Marcar como inactivo en MongoDB
		await mongo.citaModel.updateOne(
			{ idCitaSql: idCita },
			{ estado: 'cancelada' }
		)

		return res.json({ message: 'Cita cancelada exitosamente' })
	} catch (error) {
		console.error('Error al eliminar cita:', error)
		return res.status(500).json({
			message: 'Error al cancelar la cita',
			error: error.message,
		})
	}
}

// Obtener una cita específica por ID
citaCtl.obtenerCitaPorId = async (req, res) => {
	try {
		const { idCita } = req.params

		const [citaSQL] = await sql.promise().query(
			`
            SELECT c.*, 
                   cl.nombreCliente, cl.cedulaCliente,
                   m.nombreMascota, m.especie,
                   s.nombreServicio, s.precioServicio,
                   u.nameUsers as veterinario
            FROM citas c
            JOIN clientes cl ON c.idCliente = cl.idClientes
            JOIN mascotas m ON c.idMascota = m.idMascota
            JOIN servicios s ON c.idServicio = s.idServicio
            LEFT JOIN users u ON c.userIdUser = u.idUser
            WHERE c.idCita = ?
        `,
			[idCita]
		)

		if (citaSQL.length === 0) {
			return res.status(404).json({ message: 'Cita no encontrada' })
		}

		const cita = citaSQL[0]
		const citaMongo = await mongo.citaModel.findOne({
			idCitaSql: idCita,
		})

		const citaCompleta = {
			...cita,
			cliente: {
				nombre: descifrarSeguro(cita.nombreCliente),
				cedula: descifrarSeguro(cita.cedulaCliente),
			},
			mascota: {
				nombre: descifrarSeguro(cita.nombreMascota),
				especie: descifrarSeguro(cita.especie),
			},
			servicio: {
				nombre: descifrarSeguro(cita.nombreServicio),
				precio: cita.precioServicio,
				duracion: cita.duracionServicio,
			},
			veterinario: descifrarSeguro(cita.veterinario),
			detallesMongo: citaMongo
				? {
						motivo: citaMongo.motivo,
						sintomas: citaMongo.sintomas,
						diagnosticoPrevio: citaMongo.diagnosticoPrevio,
						tratamientosAnteriores: citaMongo.tratamientosAnteriores,
						estado: citaMongo.estado,
						notasAdicionales: citaMongo.notasAdicionales,
						asistio: citaMongo.asistio,
						fechaReal: citaMongo.fechaReal,
				  }
				: null,
		}

		return res.json(citaCompleta)
	} catch (error) {
		console.error('Error al obtener cita:', error)
		return res.status(500).json({
			message: 'Error al obtener la cita',
			error: error.message,
		})
	}
}

// Obtener citas por cliente (Mis próximas citas)
citaCtl.obtenerCitasPorCliente = async (req, res) => {
	try {
		const { idCliente } = req.params
		const { estado } = req.query // Opcional: filtrar por estado

		let query = `
	     SELECT c.*, 
		     cl.nombreCliente, cl.cedulaCliente,
		     m.nombreMascota, m.especie,
		     s.nombreServicio, s.precioServicio,
		     u.nameUsers as veterinario
	     FROM citas c
	     LEFT JOIN clientes cl ON c.idCliente = cl.idClientes
	     LEFT JOIN mascotas m ON c.idMascota = m.idMascota
	     LEFT JOIN servicios s ON c.idServicio = s.idServicio
	     LEFT JOIN users u ON c.userIdUser = u.idUser
	     WHERE c.idCliente = ?
	 `

		const params = [idCliente]

		if (estado) {
			query += ` AND c.estadoCita = ?`
			params.push(estado)
		}
		// Si no se especifica estado, mostrar TODAS las citas del cliente

		query += ` ORDER BY c.fecha DESC, c.hora DESC`

		console.log('📋 Obteniendo citas para cliente:', idCliente)

		const [listaCitas] = await sql.promise().query(query, params)

		console.log(`✅ Se encontraron ${listaCitas.length} citas`)

		const citasCompletas = await Promise.all(
			listaCitas.map(async cita => {
				const citaMongo = await mongo.citaModel.findOne({
					idCitaSql: cita.idCita.toString(),
				})

				return {
					idCita: cita.idCita,
					idCliente: cita.idCliente,
					idMascota: cita.idMascota,
					idServicio: cita.idServicio,
					fecha: cita.fecha,
					hora: cita.hora,
					estadoCita: cita.estadoCita,
					createCita: cita.createCita,
					updateCita: cita.updateCita,
					userIdUser: cita.userIdUser,
					cliente: {
						nombre: descifrarSeguro(cita.nombreCliente),
						cedula: descifrarSeguro(cita.cedulaCliente),
					},
					mascota: {
						nombre: descifrarSeguro(cita.nombreMascota),
						especie: descifrarSeguro(cita.especie),
					},
					servicio: {
						nombre: descifrarSeguro(cita.nombreServicio),
						precio: cita.precioServicio,
					},
					veterinario: descifrarSeguro(cita.veterinario),
					detallesMongo: citaMongo
						? {
								motivo: citaMongo.motivo,
								sintomas: citaMongo.sintomas,
								estado: citaMongo.estado,
								notasAdicionales: citaMongo.notasAdicionales,
						  }
						: null,
				}
			})
		)

		return res.json(citasCompletas)
	} catch (error) {
		console.error('Error al obtener citas del cliente:', error)
		return res.status(500).json({
			message: 'Error al obtener las citas del cliente',
			error: error.message,
		})
	}
}

// Calendario de citas (para veterinario o administrador)
citaCtl.obtenerCalendarioCitas = async (req, res) => {
	try {
		const { fechaInicio, fechaFin, idVeterinario } = req.query

		let query = `
            SELECT c.idCita, c.fecha, c.hora, c.estadoCita,
                   cl.nombreCliente,
                   m.nombreMascota,
                   s.nombreServicio, s.duracionServicio,
                   u.nameUsers as veterinario
            FROM citas c
            JOIN clientes cl ON c.idCliente = cl.idClientes
            JOIN mascotas m ON c.idMascota = m.idMascota
            JOIN servicios s ON c.idServicio = s.idServicio
            LEFT JOIN users u ON c.userIdUser = u.idUser
            WHERE 1=1
        `

		const params = []

		if (fechaInicio && fechaFin) {
			query += ` AND c.fecha BETWEEN ? AND ?`
			params.push(fechaInicio, fechaFin)
		} else if (fechaInicio) {
			query += ` AND c.fecha >= ?`
			params.push(fechaInicio)
		}

		if (idVeterinario) {
			query += ` AND c.userIdUser = ?`
			params.push(idVeterinario)
		}

		// Filtrar solo citas programadas y confirmadas
		query += ` AND c.estadoCita IN ('programada', 'confirmada')`
		query += ` ORDER BY c.fecha ASC, c.hora ASC`

		const [listaCitas] = await sql.promise().query(query, params)

		const citasCalendario = listaCitas.map(cita => ({
			idCita: cita.idCita,
			titulo: `${descifrarSeguro(cita.nombreMascota)} - ${descifrarSeguro(
				cita.nombreServicio
			)}`,
			fechaHora: `${cita.fecha} ${cita.hora}`,
			fecha: cita.fecha,
			hora: cita.hora,
			duracion: cita.duracionServicio,
			estado: cita.estadoCita,
			cliente: descifrarSeguro(cita.nombreCliente),
			mascota: descifrarSeguro(cita.nombreMascota),
			servicio: descifrarSeguro(cita.nombreServicio),
			veterinario: descifrarSeguro(cita.veterinario),
		}))

		return res.json(citasCalendario)
	} catch (error) {
		console.error('Error al obtener calendario de citas:', error)
		return res.status(500).json({
			message: 'Error al obtener el calendario',
			error: error.message,
		})
	}
}

// Reprogramar cita (cambiar fecha, hora o veterinario)
citaCtl.reprogramarCita = async (req, res) => {
	try {
		const { idCita } = req.params
		const { fecha, hora, userIdUser, motivoReprogramacion } = req.body

		if (!fecha && !hora && !userIdUser) {
			return res.status(400).json({
				message:
					'Debe proporcionar al menos una fecha, hora o veterinario para reprogramar',
			})
		}

		// Obtener cita actual
		const [citaActual] = await sql
			.promise()
			.query('SELECT * FROM citas WHERE idCita = ?', [idCita])

		if (citaActual.length === 0) {
			return res.status(404).json({ message: 'Cita no encontrada' })
		}

		// Preparar datos de actualización
		const datosActualizacion = {
			updateCita: new Date().toLocaleString(),
		}

		if (fecha) datosActualizacion.fecha = fecha
		if (hora) datosActualizacion.hora = decodificarCampo(hora)
		if (userIdUser) datosActualizacion.userIdUser = userIdUser

		// Actualizar en SQL
		await orm.cita.update(datosActualizacion, {
			where: { idCita },
		})

		// Actualizar notas en MongoDB
		if (motivoReprogramacion) {
			await mongo.citaModel.updateOne(
				{ idCitaSql: idCita },
				{
					$set: {
						notasAdicionales: `Reprogramada: ${decodificarCampo(
							motivoReprogramacion
						)}. ${citaActual[0].notasAdicionales || ''}`,
					},
				}
			)
		}

		return res.json({
			message: 'Cita reprogramada exitosamente',
			citaReprogramada: {
				idCita,
				nuevaFecha: fecha || citaActual[0].fecha,
				nuevaHora: hora || citaActual[0].hora,
			},
		})
	} catch (error) {
		console.error('Error al reprogramar cita:', error)
		return res.status(500).json({
			message: 'Error al reprogramar la cita',
			error: error.message,
		})
	}
}

// Cambiar estado de cita
citaCtl.cambiarEstadoCita = async (req, res) => {
	try {
		const { idCita } = req.params
		const { estado, notas, asistio } = req.body

		const estadosPermitidos = [
			'programada',
			'confirmada',
			'cancelada',
			'completada',
		]

		if (!estadosPermitidos.includes(estado)) {
			return res.status(400).json({
				message:
					'Estado no válido. Debe ser: programada, confirmada, cancelada o completada',
			})
		}

		// Actualizar en SQL
		await orm.cita.update(
			{
				estadoCita: estado,
				updateCita: new Date().toLocaleString(),
			},
			{
				where: { idCita },
			}
		)

		// Actualizar en MongoDB
		const actualizacionMongo = {
			estado: estado,
		}

		if (notas) {
			actualizacionMongo.notasAdicionales = decodificarCampo(notas)
		}

		if (typeof asistio === 'boolean') {
			actualizacionMongo.asistio = asistio
		}

		if (estado === 'completada') {
			actualizacionMongo.fechaReal = new Date()
		}

		await mongo.citaModel.updateOne(
			{ idCitaSql: idCita },
			{ $set: actualizacionMongo }
		)

		return res.json({
			message: `Estado de la cita cambiado a ${estado} exitosamente`,
		})
	} catch (error) {
		console.error('Error al cambiar estado de cita:', error)
		return res.status(500).json({
			message: 'Error al cambiar el estado',
			error: error.message,
		})
	}
}

// Verificar disponibilidad de horario
citaCtl.verificarDisponibilidad = async (req, res) => {
	try {
		const { fecha, hora, idServicio, idVeterinario } = req.query

		if (!fecha || !hora) {
			return res.status(400).json({
				message: 'Fecha y hora son requeridos',
			})
		}

		let query = `
            SELECT COUNT(*) as citasExistentes 
            FROM citas 
            WHERE fecha = ? 
            AND hora = ? 
            AND estadoCita IN ('programada', 'confirmada')
        `

		const params = [fecha, hora]

		const [resultado] = await sql.promise().query(query, params)

		const disponible = resultado[0].citasExistentes === 0

		return res.json({
			disponible,
			mensaje: disponible
				? 'Horario disponible'
				: 'Horario no disponible, ya existe una cita programada',
		})
	} catch (error) {
		console.error('Error al verificar disponibilidad:', error)
		return res.status(500).json({
			message: 'Error al verificar disponibilidad',
			error: error.message,
		})
	}
}

// Obtener estadísticas de citas
citaCtl.obtenerEstadisticas = async (req, res) => {
	try {
		const { fechaInicio, fechaFin } = req.query

		let filtroFecha = ''
		const params = []

		if (fechaInicio && fechaFin) {
			filtroFecha = 'WHERE fecha BETWEEN ? AND ?'
			params.push(fechaInicio, fechaFin)
		}

		const [estadisticas] = await sql.promise().query(
			`
            SELECT 
                COUNT(*) as totalCitas,
                SUM(CASE WHEN estadoCita = 'programada' THEN 1 ELSE 0 END) as citasProgramadas,
                SUM(CASE WHEN estadoCita = 'confirmada' THEN 1 ELSE 0 END) as citasConfirmadas,
                SUM(CASE WHEN estadoCita = 'completada' THEN 1 ELSE 0 END) as citasCompletadas,
                SUM(CASE WHEN estadoCita = 'cancelada' THEN 1 ELSE 0 END) as citasCanceladas
            FROM citas
            ${filtroFecha}
        `,
			params
		)

		return res.json(estadisticas[0])
	} catch (error) {
		console.error('Error al obtener estadísticas:', error)
		return res.status(500).json({
			message: 'Error al obtener estadísticas',
			error: error.message,
		})
	}
}

// Verificar si una cita fue creada correctamente
citaCtl.verificarCitaCreada = async (req, res) => {
	try {
		const { idCita } = req.params

		// Verificar en SQL
		const citaSQL = await orm.cita.findByPk(idCita)

		// Verificar en MongoDB
		const citaMongo = await mongo.citaModel.findOne({
			idCitaSql: idCita.toString(),
		})

		const existeEnSQL = !!citaSQL
		const existeEnMongoDB = !!citaMongo
		const sincronizado = existeEnSQL && existeEnMongoDB

		return res.json({
			idCita,
			existeEnSQL,
			existeEnMongoDB,
			sincronizado,
			mensaje: sincronizado
				? 'Cita verificada correctamente en ambas bases de datos'
				: 'Cita con problemas de sincronización',
			detalles: {
				sql: existeEnSQL
					? {
							fecha: citaSQL.fecha,
							hora: citaSQL.hora,
							estado: citaSQL.estadoCita,
							idCliente: citaSQL.idCliente,
							idMascota: citaSQL.idMascota,
							idServicio: citaSQL.idServicio,
					  }
					: null,
				mongodb: existeEnMongoDB
					? {
							_id: citaMongo._id,
							motivo: citaMongo.motivo,
							estado: citaMongo.estado,
							sintomas: citaMongo.sintomas,
					  }
					: null,
			},
		})
	} catch (error) {
		console.error('Error al verificar cita:', error)
		return res.status(500).json({
			message: 'Error al verificar la cita',
			error: error.message,
		})
	}
}

module.exports = citaCtl
