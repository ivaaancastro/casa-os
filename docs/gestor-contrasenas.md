# Gestor de contraseñas familiar

> **Estado**: Backend completado (API + cifrado). UI en `/perfil` pendiente (próxima feature).

## Qué hace
Almacena contraseñas de la familia cifradas con AES-256-GCM. Cada usuario ve solo sus propias contraseñas. Los datos se guardan en el campo `encryptedPasswords` del usuario (JSON cifrado), sin tabla separada.

## Cómo funciona
1. **Cifrado**: La contraseña maestra deriva de `TOTP_ENCRYPTION_KEY` (variable de entorno, misma que 2FA). PBKDF2 100k iteraciones → clave AES-256-GCM.
2. **Almacenamiento**: JSON `{ "Título": "contraseña" }` cifrado completo en `User.encryptedPasswords`.
3. **Aislamiento**: Cada usuario solo descifra su propio campo. No hay joins ni permisos complejos.

## API (para desarrollo/integración)

### Listar
```bash
GET /api/passwords
Authorization: Session cookie
Response: [{"title":"GitHub","username":"user","password":"****"}]
```

### Crear
```bash
POST /api/passwords
Content-Type: application/json
Body: {"title":"GitHub","username":"user","password":"secreto123","notes":"token clásico","category":"desarrollo"}
Response: {"success":true}
```

### Eliminar (futuro)
```bash
DELETE /api/passwords/GitHub
```

## Uso en producción (cuando UI esté lista)
1. Entrar en **Perfil** → pestaña **Contraseñas**
2. Botón **Nueva** → rellenar título, usuario, contraseña, notas, categoría
3. **Ver/ocultar** contraseña (icono ojo)
4. **Copiar** al portapapeles
5. **Exportar** → descarga `passwords-fecha.json.cifrado` (para backup)
6. **Importar** → selecciona archivo, mergea entradas nuevas

## Seguridad
- **Nunca** se guardan contraseñas en claro en BD
- **Nunca** se envían claves de cifrado al cliente
- **Nunca** se loguean contraseñas
- Export/import mantiene cifrado end-to-end (archivo inútil sin clave maestra del servidor)

## Variables de entorno requeridas
```env
TOTP_ENCRYPTION_KEY=clave-base64-de-32-bytes-minimo  # Misma que 2FA
```

## Roadmap
- [x] Backend (API + cifrado + migración) — **Hecho**
- [ ] UI en `/perfil` — Próxima feature
- [ ] Compartir entre miembros familia
- [ ] Extensión navegador (autollenado)
- [ ] Auditoría de accesos

## Troubleshooting
| Síntoma | Causa | Solución |
|---------|-------|----------|
| `[]` vacío tras crear | Cifrado falla | Verificar `TOTP_ENCRYPTION_KEY` en Vercel |
| 409 Conflict | Título duplicado | Usar título único por usuario |
| 500 Server Error | Clave inválida | Regenerar `TOTP_ENCRYPTION_KEY` y redeploy |
