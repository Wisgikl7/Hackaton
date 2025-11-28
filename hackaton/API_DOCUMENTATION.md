# 🚀 Sistema de Gestión de Visitas - Backend API

Sistema backend completo para gestión de visitas pre-autorizadas con notificaciones en tiempo real.

## 📋 Características Implementadas

✅ **RF-BE 1**: Crear visita pre-autorizada  
✅ **RF-BE 2**: Consultar estado de visita  
✅ **RF-BE 3**: Listado diario para Recepción  
✅ **RF-BE 4**: Check-in rápido  
✅ **RF-BE 5**: Notificación inmediata (sistema de eventos)  
✅ **RF-BE 6**: Aprobación o Rechazo  

## 🛠️ Tecnologías

- **NestJS** - Framework backend
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **EventEmitter** - Sistema de eventos asíncronos
- **class-validator** - Validación de DTOs

## 📦 Instalación

```bash
# Instalar dependencias
yarn install

# Configurar base de datos (asegúrate de tener PostgreSQL corriendo)
# La configuración está en .env

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev
```

## 🚀 Ejecución

```bash
# Desarrollo
yarn start:dev

# Producción
yarn build
yarn start:prod
```

## 🌐 Endpoints API

### 📝 Crear Visita Pre-Autorizada

**POST** `/visitas`

```json
{
  "nombreVisitante": "Juan Pérez",
  "dniVisitante": "12345678",
  "empresa": "Empresa XYZ",
  "motivo": "Reunión comercial",
  "fechaHoraEstimada": "2025-11-28T14:00:00Z",
  "autorizanteId": "uuid-del-autorizante"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-de-visita",
  "nombreVisitante": "Juan Pérez",
  "dniVisitante": "12345678",
  "empresa": "Empresa XYZ",
  "motivo": "Reunión comercial",
  "fechaHoraEstimada": "2025-11-28T14:00:00.000Z",
  "fechaHoraLlegada": null,
  "autorizanteId": "uuid-del-autorizante",
  "estado": "PRE_AUTORIZADA",
  "recepcionistaId": null,
  "createdAt": "2025-11-28T15:00:00.000Z",
  "updatedAt": "2025-11-28T15:00:00.000Z",
  "autorizante": {
    "id": "uuid-del-autorizante",
    "name": "María García",
    "email": "maria@empresa.com"
  }
}
```

---

### 🔍 Consultar Visitas por Autorizante

**GET** `/visitas?autorizanteId={uuid}`

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-de-visita",
    "nombreVisitante": "Juan Pérez",
    "estado": "PRE_AUTORIZADA",
    ...
  }
]
```

---

### 📋 Listado Diario para Recepción

**GET** `/agenda/visitas`

**Query Parameters**:
- `fecha` (opcional): YYYY-MM-DD (default: hoy)
- `estado` (opcional): PRE_AUTORIZADA,EN_RECEPCION,APROBADA,RECHAZADA (default: PRE_AUTORIZADA,EN_RECEPCION)

**Ejemplos**:
```
GET /agenda/visitas
GET /agenda/visitas?fecha=2025-11-28
GET /agenda/visitas?estado=PRE_AUTORIZADA,EN_RECEPCION
```

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "nombreVisitante": "Juan Pérez",
    "dniVisitante": "12345678",
    "empresa": "Empresa XYZ",
    "motivo": "Reunión comercial",
    "fechaHoraEstimada": "2025-11-28T14:00:00.000Z",
    "estado": "PRE_AUTORIZADA",
    "autorizante": {
      "id": "uuid",
      "name": "María García",
      "email": "maria@empresa.com"
    }
  }
]
```

---

### ✅ Check-in de Visita

**POST** `/visitas/{id}/checkin`

```json
{
  "recepcionistaId": "uuid-recepcionista"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid-de-visita",
  "nombreVisitante": "Juan Pérez",
  "estado": "EN_RECEPCION",
  "fechaHoraLlegada": "2025-11-28T14:05:00.000Z",
  "recepcionistaId": "uuid-recepcionista",
  ...
}
```

**Evento Emitido**: `visit.checkin`
```typescript
{
  visitaId: string,
  autorizanteId: string,
  nombreVisitante: string,
  fechaHoraLlegada: Date
}
```

---

### ✅ Aprobar Visita

**POST** `/visitas/{id}/aprobar`

**Response**: `200 OK`
```json
{
  "id": "uuid-de-visita",
  "estado": "APROBADA",
  ...
}
```

**Evento Emitido**: `visit.approved`

---

### ❌ Rechazar Visita

**POST** `/visitas/{id}/rechazar`

**Request Body**:
```json
{
  "razon": "El visitante no tiene cita programada para hoy"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid-de-visita",
  "estado": "RECHAZADA",
  ...
}
```

**Evento Emitido**: `visit.rejected`
```typescript
{
  visitaId: string,
  autorizanteId: string,
  autorizanteName: string,
  autorizanteEmail: string,
  nombreVisitante: string,
  razon: string,
  recepcionistaId: string | null
}
```

**Email enviado**: Se envía un email al recepcionista con:
- ✉️ Asunto: "❌ Visita Rechazada por Autorizante"
- 👤 Nombre del visitante
- 🙅 Nombre del autorizante que rechazó
- 📝 Razón del rechazo

---

### 🔎 Obtener Visita por ID

**GET** `/visitas/{id}`

**Response**: `200 OK`

---

## 📊 Modelo de Datos

### Visit (Visita)

```prisma
model Visit {
  id                  String      @id @default(uuid())
  nombreVisitante     String
  dniVisitante        String
  empresa             String
  motivo              String
  fechaHoraEstimada   DateTime
  fechaHoraLlegada    DateTime?
  autorizanteId       String
  estado              VisitStatus @default(PRE_AUTORIZADA)
  recepcionistaId     String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  
  autorizante         User        @relation("Autorizante")
}

enum VisitStatus {
  PRE_AUTORIZADA
  EN_RECEPCION
  APROBADA
  RECHAZADA
}
```

### User (Usuario/Autorizante)

```prisma
model User {
  id                  String   @id @default(uuid())
  email               String   @unique
  name                String
  role                String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  visitasAutorizadas  Visit[]  @relation("Autorizante")
}
```

---

## 🔔 Sistema de Eventos

El sistema implementa un patrón de eventos asíncronos para notificaciones:

### Eventos Disponibles

1. **visit.checkin** - Emitido cuando un visitante hace check-in
2. **visit.approved** - Emitido cuando se aprueba una visita
3. **visit.rejected** - Emitido cuando se rechaza una visita

### Listener de Notificaciones

El `VisitNotificationsListener` captura todos los eventos y puede integrar:
- ✉️ Email notifications
- 🔗 Webhooks
- 📱 Push notifications
- 💬 SMS
- 🔌 WebSocket para tiempo real

**Archivo**: `src/visits/listeners/visit-notifications.listener.ts`

---

## 🧪 Criterios de Aceptación Implementados

### ✅ CA-BE1 – Creación de visita
```gherkin
Dado que recibo un POST a /visitas con los datos requeridos
Cuando los datos son válidos
Entonces creo un registro con estado PRE_AUTORIZADA
Y devuelvo 201 con los datos de la visita.
```

### ✅ CA-BE2 – Check-in y notificación
```gherkin
Dado que un recepcionista realiza POST /visitas/{id}/checkin
Cuando la visita existe y está en PRE_AUTORIZADA
Entonces la cambio a EN_RECEPCION
Y disparo el evento VisitCheckIn.
```

### ✅ CA-BE3 – Aprobación/Rechazo
```gherkin
Dado que recibo un POST /visitas/{id}/aprobar
Cuando la visita está EN_RECEPCION
Entonces cambio el estado a APROBADA
Y emito un evento VisitApproved.
```

---

## 🔒 Validaciones Implementadas

- ✅ Validación de DTOs con `class-validator`
- ✅ Verificación de existencia de autorizante
- ✅ Validación de transiciones de estado
- ✅ Validación de datos obligatorios
- ✅ Transformación automática de tipos

---

## 📝 Estructura del Proyecto

```
src/
├── visits/
│   ├── dto/
│   │   ├── create-visit.dto.ts
│   │   ├── checkin-visit.dto.ts
│   │   └── query-visits.dto.ts
│   ├── events/
│   │   ├── visit-checkin.event.ts
│   │   ├── visit-approved.event.ts
│   │   └── visit-rejected.event.ts
│   ├── listeners/
│   │   └── visit-notifications.listener.ts
│   ├── visits.controller.ts
│   ├── visits.service.ts
│   └── visits.module.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts
└── main.ts
```

---

## 🧰 Comandos Útiles

```bash
# Ver base de datos en Prisma Studio
npx prisma studio

# Regenerar cliente Prisma
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Reiniciar base de datos (⚠️ borra todos los datos)
npx prisma migrate reset

# Ver logs de la aplicación
yarn start:dev
```

---

## 🚦 Próximos Pasos Sugeridos

1. **Autenticación y Autorización**
   - Implementar JWT
   - Guards para roles (Autorizante, Recepcionista)
   - Middleware de autenticación

2. **Notificaciones Reales**
   - Integrar servicio de email (SendGrid, AWS SES)
   - Implementar webhooks
   - Agregar WebSocket para tiempo real

3. **Testing**
   - Unit tests para servicios
   - Integration tests para endpoints
   - E2E tests para flujos completos

4. **Documentación API**
   - Integrar Swagger/OpenAPI
   - Generar documentación automática

5. **Optimizaciones**
   - Implementar caché (Redis)
   - Cola de mensajes (Bull, RabbitMQ)
   - Paginación para listados

---

## 📧 Ejemplo de Flujo Completo

1. **Crear visita pre-autorizada**
   ```bash
   POST /visitas
   ```

2. **Recepción consulta visitas del día**
   ```bash
   GET /agenda/visitas
   ```

3. **Visitante llega y hace check-in**
   ```bash
   POST /visitas/{id}/checkin
   # → Evento emitido → Notificación al autorizante
   ```

4. **Autorizante aprueba la visita**
   ```bash
   POST /visitas/{id}/aprobar
   # → Evento emitido → Notificación a recepción
   ```

---

## 🐛 Manejo de Errores

El sistema implementa manejo robusto de errores:

- `400 Bad Request` - Datos inválidos o transición de estado inválida
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

**Ejemplo de respuesta de error**:
```json
{
  "statusCode": 400,
  "message": "No se puede aprobar. Estado actual: PRE_AUTORIZADA",
  "error": "Bad Request"
}
```

---

## 📄 Licencia

Este proyecto es parte de un hackathon y está disponible para uso educativo.

---

**¡Sistema completamente funcional y listo para integrarse con el frontend! 🎉**
