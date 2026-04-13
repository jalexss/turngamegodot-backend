# TESTING GUÍA: Sistema de Autenticación con Refresh Tokens

## Quick Start

```bash
cd turngamegodot-backend
npm install
npm run dev
```

El servidor estará en: http://localhost:3000

---

## Endpoints de Autenticación

### 1. REGISTER (Crear cuenta)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada (201):**
```json
{
  "msg": "Usuario creado con éxito",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

---

### 2. LOGIN (Iniciar sesión)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "testuser",
    "password": "password123"
  }'
```

**Respuesta esperada (200):**
```json
{
  "msg": "Success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "stats": {
      "level": 1,
      "gold": 100,
      "elo_rating": 1000
    }
  }
}
```

---

### 3. REFRESH TOKEN (Refrescar acceso)
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
  }'
```

**Respuesta esperada (200):**
```json
{
  "msg": "Token refrescado",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error esperado si token es inválido (403):**
```json
{
  "error": "Refresh token inválido o expirado"
}
```

---

### 4. ACCESO A RUTA PROTEGIDA (Obtener perfil)
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

**Respuesta esperada (200):**
```json
{
  "message": "Bienvenido a tu perfil",
  "userId": 1
}
```

**Error esperado sin token o token inválido (401):**
```json
{
  "error": "Acceso denegado"
}
```

---

## Flujo Completo de Testing

### Paso 1: Registrar usuario
```bash
# Ejecutar REGISTER y guardar los tokens de la respuesta
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "test@game.local",
    "password": "SecurePass123"
  }')

echo "😊 Respuesta de registro:"
echo $REGISTER_RESPONSE | jq .
```

### Paso 2: Extraer tokens (en un script real)
```bash
# Extraer tokens del JSON
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.refreshToken')

echo "🔓 Access Token: ${ACCESS_TOKEN:0:50}..."
echo "🔑 Refresh Token: ${REFRESH_TOKEN:0:50}..."
```

### Paso 3: Acceder a ruta protegida con accessToken
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Respuesta esperada:
# {"message":"Bienvenido a tu perfil","userId":1}
```

### Paso 4: Refrescar el token (simular expiración)
```bash
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

echo "♻️ Respuesta de refresh:"
echo $REFRESH_RESPONSE | jq .

# Extraer nuevo accessToken
NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.accessToken')
```

### Paso 5: Usar el nuevo token
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN"

# Respuesta esperada:
# {"message":"Bienvenido a tu perfil","userId":1}
```

---

## Resumen de Tokens

| Token | Duración | Uso |
|-------|----------|-----|
| **accessToken** | 15 minutos | Autenticación en requests |
| **refreshToken** | 7 días | Obtener nuevo accessToken |

---

## Testing en Godot

Una vez que hayas verificado el backend:

1. **Abre Godot 4.3**
2. **Abre el proyecto turngamegodot**
3. **Ejecuta la escena Gateway.tscn**
4. Deberías ver:
   - Pantalla de carga inicial
   - Auto-login si hay sesión previa, O
   - Botones de "Iniciar Sesión" y "Crear Cuenta"
5. **Prueba flujo completo:**
   - Crear cuenta → confirma en backend
   - Login → obtiene tokens en sesión
   - Auto-logout después de 7 días o manual
   - Refresh automático cada 14 minutos (antes de expiración)

---

## Variables de Debugging

En Godot, puedes habilitar/deshabilitar debug output:

```gdscript
# En scripts/Global/Config.gd
const DEBUG_AUTH: bool = true  # Cambiar a false en producción
const DEMO_MODE: bool = false  # Cambiar a true para testing offline
```

Esto activará logs como:
```
🔧 [Config] Inicializado - Backend URL: http://localhost:3000/api
🌐 [NetworkValidator] Inicializado
✅ [SessionManager] Sesión cargada: usuario testplayer (ID: 1)
✅ [AuthManager] Login exitoso: testplayer
🔄 [AuthManager] Token refrescado exitosamente
⏱️  [AuthManager] Token refresh programado en 840 segundos
```

---

## Troubleshooting

### Error: "JWT_SECRET not found"
→ Verifica que .env tiene `JWT_SECRET` y `JWT_REFRESH_SECRET`

### Error: 401 Unauthorized
→ El accessToken expiró. Usa refreshToken para obtener uno nuevo

### Error: 403 Forbidden
→ El refreshToken es inválido o también expiró. Requiere re-login

### Godot no conecta al backend
→ Verifica `Config.BACKEND_BASE_URL` apunta a localhost:3000
→ Asegúrate que `npm run dev` está ejecutándose

### Demo mode siempre activado
→ Verifica `Config.DEMO_MODE = false` en scripts/Global/Config.gd

---

## Checklist de Validación

- [ ] Backend inicia sin errores
- [ ] Endpoint `/auth/register` devuelve 201 + tokens
- [ ] Endpoint `/auth/login` devuelve 200 + tokens
- [ ] Endpoint `/auth/refresh` devuelve nuevo accessToken
- [ ] Endpoint `/user/profile` requiere Bearer token válido
- [ ] Token inválido retorna 401/403
- [ ] Godot Gateway carga sin errores
- [ ] Botones Login/Register funcionan
- [ ] Formularios validan email/password
- [ ] Login exitoso → transición a MainMenu
- [ ] MainMenu muestra username del usuario
- [ ] Botón Logout → vuelve a Gateway
- [ ] SessionManager guarda tokens en disk
- [ ] Auto-login funciona con sesión guardada
- [ ] Refresh automático ocurre antes de expiración
- [ ] Demo mode toggleable en Config.gd
