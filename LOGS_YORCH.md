# Comandos para Consultar Logs del Servidor - Yorch

**Servidor:** Hetzner Cloud (188.245.126.137)
**Usuario:** juan
**Última actualización:** 2025-12-07

---

## Conexión al Servidor

```bash
# Desde Windows usando SSH
ssh juan@188.245.126.137

# O desde VSCode: F1 > Remote-SSH: Connect to Host
```

---

## Logs del Backend (FastAPI)

### Ver logs recientes
```bash
# Últimos 50 logs
sudo journalctl -u yorch-backend -n 50 --no-pager

# Últimos 100 logs
sudo journalctl -u yorch-backend -n 100 --no-pager

# Últimos 200 logs
sudo journalctl -u yorch-backend -n 200 --no-pager
```

### Ver logs en tiempo real (seguimiento)
```bash
sudo journalctl -u yorch-backend -f --no-pager
```

### Ver logs de un período específico
```bash
# Logs de hoy
sudo journalctl -u yorch-backend --since today --no-pager

# Logs de la última hora
sudo journalctl -u yorch-backend --since "1 hour ago" --no-pager

# Logs de los últimos 30 minutos
sudo journalctl -u yorch-backend --since "30 minutes ago" --no-pager

# Logs entre fechas específicas
sudo journalctl -u yorch-backend --since "2025-12-07 10:00:00" --until "2025-12-07 12:00:00" --no-pager
```

### Filtrar logs por texto
```bash
# Buscar errores
sudo journalctl -u yorch-backend -n 200 --no-pager | grep -i error

# Buscar por endpoint específico
sudo journalctl -u yorch-backend -n 200 --no-pager | grep "chat"

# Buscar por cliente
sudo journalctl -u yorch-backend -n 200 --no-pager | grep -i "preciado"

# Buscar excepciones
sudo journalctl -u yorch-backend -n 200 --no-pager | grep -i "exception\|traceback"

# Buscar errores de Gemini
sudo journalctl -u yorch-backend -n 200 --no-pager | grep -i "gemini\|generative"
```

---

## Estado de Servicios

```bash
# Estado del backend
sudo systemctl status yorch-backend

# Estado de PostgreSQL
sudo systemctl status postgresql

# Ver procesos activos
ps aux | grep -E 'uvicorn' | grep -v grep
```

---

## Logs de PostgreSQL

```bash
# Ver logs de PostgreSQL
sudo journalctl -u postgresql -n 50 --no-pager

# Logs en tiempo real
sudo journalctl -u postgresql -f --no-pager
```

---

## Comandos Remotos desde Windows

Si no quieres conectarte al servidor, puedes ejecutar comandos remotamente:

```bash
# Ver últimos 50 logs del backend
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend -n 50 --no-pager"

# Ver logs de la última hora
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend --since '1 hour ago' --no-pager"

# Buscar errores en logs
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend -n 200 --no-pager | grep -i error"

# Ver estado del servicio
ssh juan@188.245.126.137 "sudo systemctl status yorch-backend"

# Ver logs en tiempo real (Ctrl+C para salir)
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend -f --no-pager"
```

---

## Troubleshooting Común

### Si el backend no responde:
```bash
# Ver si el servicio está corriendo
sudo systemctl status yorch-backend

# Reiniciar el servicio
sudo systemctl restart yorch-backend

# Ver logs para identificar el error
sudo journalctl -u yorch-backend -n 100 --no-pager
```

### Si hay errores con Gemini AI:
```bash
# Ver logs relacionados con Gemini
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -i "gemini\|api_key\|generative"

# Verificar que la API key está configurada
cat ~/apps/yorch/yorch-backend/.env | grep GEMINI
```

### Si hay errores de base de datos:
```bash
# Ver estado de PostgreSQL
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Probar conexión
PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c "SELECT 1;"

# Ver logs de PostgreSQL
sudo journalctl -u postgresql -n 50 --no-pager
```

### Si hay errores 500 en el frontend:
```bash
# Ver logs del backend para encontrar el error
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -i "error\|exception\|500"
```

### Si las imágenes no cargan:
```bash
# Verificar carpeta de uploads
ls -la ~/apps/yorch/yorch-backend/uploads/sobres/

# Ver permisos
stat ~/apps/yorch/yorch-backend/uploads/sobres/
```

---

## Logs Específicos por Funcionalidad

### Chat/Agente:
```bash
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -i "chat\|mensaje"
```

### OCR (Extracción de nombres):
```bash
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -i "extraer\|nombre\|sobre"
```

### Movimientos (Préstamos/Abonos):
```bash
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -i "prestamo\|abono\|movimiento"
```

### Clientes:
```bash
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -i "cliente"
```

---

## Verificar Requests HTTP

```bash
# Ver todas las peticiones HTTP recientes
sudo journalctl -u yorch-backend -n 100 --no-pager | grep "HTTP"

# Ver solo errores HTTP (4xx, 5xx)
sudo journalctl -u yorch-backend -n 100 --no-pager | grep -E "HTTP.*[45][0-9][0-9]"

# Ver peticiones POST (chat, crear cliente, etc)
sudo journalctl -u yorch-backend -n 100 --no-pager | grep "POST"
```

---

## Notas Importantes

1. **Se requiere sudo** para ver logs de systemd en este servidor
2. **Siempre usar `--no-pager`** para ver output completo sin paginación
3. **El backend usa systemd** como gestor de servicios
4. **Los logs se rotan automáticamente** por journald
5. **Ctrl+C** para salir del modo follow (`-f`)

---

## URLs de Referencia

| Componente | URL |
|------------|-----|
| Frontend | https://proyectoyorch.vercel.app |
| Backend API | http://188.245.126.137:8000/api/v1 |
| Swagger Docs | http://188.245.126.137:8000/docs |

---

**Creado por:** Claude Code
**Propósito:** Referencia rápida para consultar logs sin perder tiempo
