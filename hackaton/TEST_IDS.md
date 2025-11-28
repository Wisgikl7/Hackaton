# 🔑 IDs de Prueba - Sistema de Gestión de Visitas

## 👥 Usuarios

### Autorizante 1
- **ID**: `14f9818d-1e12-4a03-ae2c-c7092a397cf4`
- **Nombre**: María García
- **Email**: maria.garcia@empresa.com
- **Rol**: AUTORIZANTE

### Autorizante 2
- **ID**: `3d815248-e551-4fe4-ada6-9011d8eb0a0d`
- **Nombre**: Carlos López
- **Email**: carlos.lopez@empresa.com
- **Rol**: AUTORIZANTE

### Recepcionista
- **ID**: `fdc4398c-f82f-41a5-808d-5eff69bdd242`
- **Nombre**: Ana Martínez
- **Email**: ana.martinez@empresa.com
- **Rol**: RECEPCIONISTA

---

## 📅 Visitas Precargadas

### Visita 1
- **ID**: `d844446f-4a55-4ec6-a727-4939a29c8ed3`
- **Visitante**: Juan Pérez (DNI: 12345678)
- **Empresa**: Tech Solutions
- **Estado**: PRE_AUTORIZADA
- **Autorizante**: María García

### Visita 2
- **ID**: `ffac2e1d-79e4-43f1-8ca2-2934da1fb880`
- **Visitante**: Laura Rodríguez (DNI: 87654321)
- **Empresa**: Consulting Group
- **Estado**: PRE_AUTORIZADA
- **Autorizante**: María García

### Visita 3
- **ID**: `a723de22-5d37-4c41-ab3e-7e356e614cb5`
- **Visitante**: Pedro González (DNI: 45678912)
- **Empresa**: Marketing Pro
- **Estado**: PRE_AUTORIZADA
- **Autorizante**: Carlos López

### Visita 4
- **ID**: `55880af5-c237-444c-b652-7f3ef5a8590a`
- **Visitante**: Sandra Díaz (DNI: 78945612)
- **Empresa**: Design Studio
- **Estado**: EN_RECEPCION ✅
- **Autorizante**: Carlos López
- **Recepcionista**: Ana Martínez

---

## 🧪 Comandos de Prueba Rápida

### 1. Crear nueva visita
```bash
curl -X POST http://localhost:3000/visitas \
  -H "Content-Type: application/json" \
  -d '{
    "nombreVisitante": "Test User",
    "dniVisitante": "11111111",
    "empresa": "Test Company",
    "motivo": "Testing",
    "fechaHoraEstimada": "2025-11-28T16:00:00Z",
    "autorizanteId": "14f9818d-1e12-4a03-ae2c-c7092a397cf4"
  }'
```

### 2. Ver visitas de María García
```bash
curl http://localhost:3000/visitas?autorizanteId=14f9818d-1e12-4a03-ae2c-c7092a397cf4
```

### 3. Ver agenda del día (Recepción)
```bash
curl http://localhost:3000/agenda/visitas
```

### 4. Hacer check-in de Juan Pérez
```bash
curl -X POST http://localhost:3000/visitas/d844446f-4a55-4ec6-a727-4939a29c8ed3/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "recepcionistaId": "fdc4398c-f82f-41a5-808d-5eff69bdd242"
  }'
```

### 5. Aprobar visita de Sandra Díaz (ya está EN_RECEPCION)
```bash
curl -X POST http://localhost:3000/visitas/55880af5-c237-444c-b652-7f3ef5a8590a/aprobar
```

---

## 📱 Para usar en Postman/Thunder Client

1. Crea variables de entorno:
   - `BASE_URL`: `http://localhost:3000`
   - `AUTORIZANTE_ID`: `14f9818d-1e12-4a03-ae2c-c7092a397cf4`
   - `RECEPCIONISTA_ID`: `fdc4398c-f82f-41a5-808d-5eff69bdd242`
   - `VISITA_ID`: `d844446f-4a55-4ec6-a727-4939a29c8ed3`

2. Usa `{{BASE_URL}}`, `{{AUTORIZANTE_ID}}`, etc. en tus requests

---

## 🔄 Resetear Base de Datos

Si necesitas empezar de nuevo:

```bash
npx prisma migrate reset
npx prisma db seed
```

⚠️ **Advertencia**: Esto borrará todos los datos y creará nuevos IDs.

---

## 📊 Ver Base de Datos

```bash
npx prisma studio
```

Se abrirá en `http://localhost:5555`
