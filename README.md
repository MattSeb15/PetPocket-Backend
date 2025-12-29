# 🐾 PetPocket Backend

Sistema de gestión de citas veterinarias con **Arquitectura Hexagonal**, **Node.js/Express** y **base de datos dual** (MySQL + MongoDB).

---

## 🏗️ Arquitectura Hexagonal

```
src/
├── domain/              # Modelos (Entidades)
│   └── models/sql/      # Sequelize - MySQL
│   └── models/mongo/    # Mongoose - MongoDB
│
├── application/         # Lógica de utilidades
│   └── controller/      # Cifrado de datos
│
└── infrastructure/      # Adaptadores externos
    ├── Database/        # Conexiones BD
    └── http/
        ├── controller/  # Lógica de negocio
        └── router/      # Rutas y validaciones
```

**Flujo**: Cliente HTTP → Router → Controller → BD

---

## 🚀 Ejecutar Proyecto

```bash
npm install
npm run dev
```

- **Servidor**: http://localhost:3000
- **Swagger**: http://localhost:3000/api-docs

---

## 📡 Endpoints Principales

### 1. Listar Citas

```http
GET /cita/lista
```

Obtiene todas las citas con información completa.

**🔄 Viaje de la Request (Arquitectura Hexagonal)**:

```
1. Cliente → POST /cita/lista
2. Router (cita.router.js) → Sin validaciones para GET
3. Controller (cita.controller.js) → Método mostrarCitas()
4. Adaptador BD → Consulta SQL con JOINs (MySQL)
5. Adaptador BD → Busca detalles en MongoDB
6. Utilidad → Descifra datos sensibles (encrypDates.js)
7. Controller → Formatea respuesta JSON
8. Cliente ← Recibe array de citas descifradas
```

**Respuesta**:

```json
[
  {
    "idCita": 1,
    "fecha": "2025-12-29",
    "hora": "14:00",
    "estadoCita": "programada",
    "mascota": { "nombre": "Max", "especie": "Perro" },
    "servicio": { "nombre": "Consulta", "precio": "50.00" },
    "veterinario": "Dr. Martínez"
  }
]
```

---

### 2. Crear Cita

```http
POST /cita/crear
```

**Body**:

```json
{
  "idCliente": 1,
  "idMascota": 2,
  "idServicio": 1,
  "fecha": "2025-12-30",
  "hora": "15:00",
  "userIdUser": 1,
  "motivo": "Vacunación"
}
```

**🔄 Viaje de la Request (Arquitectura Hexagonal)**:

```
1. Cliente → POST /cita/crear + Body JSON
2. Router (cita.router.js) → Valida campos obligatorios (express-validator)
   ❌ Si falla validación → 400 Bad Request
3. Controller (cita.controller.js) → Método crearCita()
4. Utilidad → Descifra hora (decodeURIComponent)
5. Adaptador BD → INSERT en tabla citas (MySQL/Sequelize)
6. Adaptador BD → INSERT en colección citas (MongoDB/Mongoose)
7. Controller → Retorna ID de nueva cita
8. Cliente ← Recibe confirmación 201 Created
```

**Respuesta**: `{ "message": "Cita creada exitosamente", "idCita": 10 }`

---

### 3. Actualizar Cita

```http
PUT /cita/actualizar/{idCita}
```

**Body**:

```json
{
  "idCliente": 1,
  "idMascota": 2,
  "idServicio": 3,
  "fecha": "2025-12-31",
  "hora": "10:00",
  "motivo": "Cambio de servicio"
}
```

**🔄 Viaje de la Request (Arquitectura Hexagonal)**:

```
1. Cliente → PUT /cita/actualizar/5 + Body JSON
2. Router (cita.router.js) → Valida idCita (número) y campos del body
   ❌ Si falla validación → 400 Bad Request
3. Controller (cita.controller.js) → Método actualizarCita()
4. Utilidad → Descifra hora (decodeURIComponent)
5. Adaptador BD → UPDATE en tabla citas WHERE idCita=5 (MySQL)
6. Adaptador BD → UPDATE en colección citas (MongoDB)
7. Controller → Sincroniza ambas bases de datos
8. Cliente ← Recibe confirmación 200 OK
```

**Respuesta**: `{ "message": "Cita actualizada exitosamente" }`

---

### 4. Cancelar Cita

```http
DELETE /cita/cancelar/{idCita}
```

**Body**:

```json
{
  "motivoCancelacion": "Emergencia"
}
```

**🔄 Viaje de la Request (Arquitectura Hexagonal)**:

```
1. Cliente → DELETE /cita/cancelar/3 + Body JSON
2. Router (cita.router.js) → Valida idCita (número)
   ❌ Si falla validación → 400 Bad Request
3. Controller (cita.controller.js) → Método eliminarCita()
4. Adaptador BD → UPDATE estadoCita='cancelada' (MySQL)
   ⚠️ NO hace DELETE físico (Soft Delete)
5. Adaptador BD → UPDATE estado='cancelada' (MongoDB)
6. Controller → Mantiene historial de citas
7. Cliente ← Recibe confirmación 200 OK
```

**Respuesta**: `{ "message": "Cita cancelada exitosamente" }`

**Nota**: El registro permanece en la BD para auditoría.

---

## 🗄️ Base de Datos Dual

| BD          | Propósito                    | Datos                                  |
| ----------- | ---------------------------- | -------------------------------------- |
| **MySQL**   | Estructurados y relacionales | Citas, clientes, mascotas, servicios   |
| **MongoDB** | Flexibles y no estructurados | Motivos, síntomas, diagnósticos, notas |

**Ventaja**: Optimización según el tipo de dato.

---

## 🔐 Seguridad

- **Cifrado**: crypto-js para nombres, cédulas, datos sensibles
- **Validación**: express-validator en todas las rutas
- **Soft Delete**: Las citas canceladas no se eliminan

---

## 🧪 Prueba Rápida

```powershell
# Listar
Invoke-RestMethod -Uri "http://localhost:3000/cita/lista"

# Crear
$body = @{ idCliente=1; idMascota=2; idServicio=1; fecha="2025-12-30"; hora="15:00" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/cita/crear" -Method Post -Body $body -ContentType "application/json"
```

O usa **Swagger UI**: http://localhost:3000/api-docs

---

## 🎓 Conceptos Clave

✅ **Arquitectura Hexagonal**: Lógica de negocio independiente de frameworks  
✅ **Base de Datos Dual**: MySQL (relacional) + MongoDB (flexible)  
✅ **API RESTful**: GET, POST, PUT, DELETE con códigos HTTP estándar  
✅ **Seguridad**: Cifrado automático y validaciones

---

**Proyecto académico - PetPocket 2025**
