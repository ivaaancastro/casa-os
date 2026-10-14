# Skill: casa-router

## Descripción

Guía para trabajar con la sección de dispositivos de red de casa-os.
Incluye escaneo de red, interpretación de resultados, y mejores prácticas
de seguridad.

## Activación

Usa esta skill cuando:
- Se trabaje en la sección de dispositivos
- Se modifique el escáner de red
- Se añadan nuevas funcionalidades relacionadas con la red
- Se necesite diagnosticar problemas de conectividad

## Escaneo de red

### Cómo funciona

El escáner utiliza `nmap` en modo "ping scan" (`-sn`) para descubrir hosts
activos en la red local sin hacer escaneo de puertos (rápido y silencioso).

```bash
npm run scan  # Escanea NETWORK_CIDR (default: 192.168.1.0/24)
```

### Instalación de nmap

```bash
# macOS
brew install nmap

# Linux (Debian/Ubuntu)
sudo apt install nmap

# Linux (Fedora)
sudo dnf install nmap
```

### Formato de salida

```
ip          | mac               | vendor
192.168.1.1 | AA:BB:CC:DD:EE:FF | TP-Link (Router)
192.168.1.2 | 11:22:33:44:55:66 | Apple (iPhone)
...
```

## Seguridad de red

### Principios

1. **Solo red local**: El escaneo solo debe ejecutarse en la red del hogar
2. **No exponer nmap**: La API route de escaneo requiere autenticación
3. **Rate limiting**: Máximo 1 escaneo cada 5 minutos por usuario
4. **Datos sensibles**: Las IPs y MACs son información privada del hogar

### Buenas prácticas

- Cambiar la contraseña del router periódicamente
- Actualizar firmware del router
- Desactivar WPS (es vulnerable)
- Usar WPA3 si el router lo soporta
- Revisar la lista de dispositivos conectados regularmente

## Interpretación de resultados

### Tipos de dispositivos comunes

| Patrón MAC (OUI) | Probable dispositivo |
|-------------------|----------------------|
| `AA:BB:CC` (Apple) | iPhone, iPad, Mac |
| `00:11:22` (Samsung) | Móvil/tablet Samsung |
| `B8:27:EB` (Raspberry Pi) | Raspberry Pi |
| `DC:A6:32` (Raspberry Pi) | Raspberry Pi (modelos recientes) |

**Nota**: El vendor puede no coincidir exactamente. Usar la MAC OUI para
inferir, pero confirmar con la IP已知 (conocida).

### Detección de intrusos

Se considera "intruso" un dispositivo que:
- No está en la lista de dispositivos conocidos
- Aparece por primera vez
- Tiene un vendor desconocido

**Acción recomendada**: No bloquear automáticamente. Notificar al admin para
revisión manual.

## Integración con la app

### API Route de escaneo

```
POST /api/devices/scan
Body: { }
Response: { devices: ScannedDevice[], timestamp: string }
```

### Sincronización con la base de datos

El escáner NO debe insertar dispositivos automáticamente. En su lugar:
1. El escáner devuelve la lista de dispositivos encontrados
2. El frontend muestra los resultados
3. El usuario elige qué dispositivos guardar y con qué nombre
4. Solo entonces se insertan en la base de datos

**Razón**: El escaneo detecta TODOS los dispositivos, incluyendo vecinos,
dispositivos temporales, etc. El usuario decide cuáles son "de la casa".
