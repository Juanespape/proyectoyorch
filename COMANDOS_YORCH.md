# COMANDOS - Yorch

## CONEXIÓN SSH AL SERVIDOR HETZNER

### **Información del Servidor:**
- **IP:** 188.245.126.137
- **Hostname:** ubuntu-4gb-fsn1-1
- **Usuario:** juan
- **Clave SSH:** `~/.ssh/id_ed25519`

### **Comando de Conexión:**
```bash
ssh juan@188.245.126.137
```

### **Ejecutar comandos remotos (sin entrar al servidor):**
```bash
ssh juan@188.245.126.137 "comando"
```

### **Ejemplos de uso:**
```bash
# Ver archivos del servidor
ssh juan@188.245.126.137 "ls ~/apps/yorch"

# Ver estado del servicio backend
ssh juan@188.245.126.137 "sudo systemctl status yorch-backend"

# Leer archivo .env del backend
ssh juan@188.245.126.137 "cat ~/apps/yorch/yorch-backend/.env"

# Ver logs del backend
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend -f"

# Verificar base de datos
ssh juan@188.245.126.137 "sudo systemctl status postgresql"

# Consultar clientes en BD
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c 'SELECT * FROM clientes;'"
```

---

## DESPLIEGUE EN SERVIDOR

### **Deploy del Backend:**
```bash
# Conectarse y hacer pull + restart
ssh juan@188.245.126.137 << 'EOF'
cd ~/apps/yorch
git pull origin main
cd yorch-backend
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart yorch-backend
echo "Deploy completado!"
EOF
```

### **Comandos individuales:**
```bash
# Solo pull del código
ssh juan@188.245.126.137 "cd ~/apps/yorch && git pull origin main"

# Solo reiniciar backend
ssh juan@188.245.126.137 "sudo systemctl restart yorch-backend"

# Ver estado del backend
ssh juan@188.245.126.137 "sudo systemctl status yorch-backend"

# Ver logs en tiempo real
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend -f"
```

---

## ESTRUCTURA DEL SERVIDOR

```
/home/juan/
├── apps/
│   └── yorch/
│       ├── yorch-backend/      # Backend FastAPI (Puerto 8000)
│       │   ├── .venv/          # Python virtual environment
│       │   ├── app/            # Código de la aplicación
│       │   ├── alembic/        # Migraciones de BD
│       │   ├── uploads/sobres/ # Imágenes de sobres
│       │   └── .env            # Variables de entorno
│       │
│       └── yorch-frontend/     # (No usado - Frontend en Vercel)
│
└── .ssh/                       # Claves SSH
```

---

## SERVICIOS Y PUERTOS

| Servicio | Puerto | Gestor | Estado |
|----------|--------|--------|--------|
| Backend (FastAPI) | 8000 | systemd | `sudo systemctl status yorch-backend` |
| PostgreSQL | 5432 | systemd | `sudo systemctl status postgresql` |
| Frontend | - | Vercel | Automático con git push |

---

## BASE DE DATOS

### **Credenciales:**
```
Host: localhost
Database: yorch_db
User: yorch
Password: yorch_secure_2024
```

### **Comandos útiles:**
```bash
# Conectarse a la BD
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost"

# Ver tablas
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c '\dt'"

# Ver clientes
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c 'SELECT * FROM clientes;'"

# Ver movimientos pendientes
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c 'SELECT m.*, c.nombre FROM movimientos_pendientes m JOIN clientes c ON m.cliente_id = c.id WHERE m.procesado = false;'"

# Contar pendientes
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c 'SELECT COUNT(*) FROM movimientos_pendientes WHERE procesado = false;'"
```

---

## URLS DE PRODUCCIÓN

| Componente | URL |
|------------|-----|
| **Frontend** | https://proyectoyorch.vercel.app |
| **Backend API** | http://188.245.126.137:8000/api/v1 |
| **API Docs (Swagger)** | http://188.245.126.137:8000/docs |
| **GitHub Repo** | https://github.com/Juanespape/proyectoyorch |

---

## FLUJO DE DEPLOYMENT

```
Windows (Desarrollo)
    │
    ▼
git push origin main
    │
    ├──────────────────┬──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
  GitHub           Vercel             Hetzner
                  (Auto)             (Manual)
                    │                    │
                    ▼                    ▼
              Frontend              Backend
              desplegado         ssh + git pull
              automático         + restart
```

---

## TROUBLESHOOTING

### **Backend no responde:**
```bash
# Ver logs de error
ssh juan@188.245.126.137 "sudo journalctl -u yorch-backend --no-pager -n 50"

# Reiniciar servicio
ssh juan@188.245.126.137 "sudo systemctl restart yorch-backend"

# Verificar que está corriendo
ssh juan@188.245.126.137 "sudo systemctl status yorch-backend"
```

### **Error de base de datos:**
```bash
# Verificar PostgreSQL
ssh juan@188.245.126.137 "sudo systemctl status postgresql"

# Reiniciar PostgreSQL
ssh juan@188.245.126.137 "sudo systemctl restart postgresql"

# Probar conexión
ssh juan@188.245.126.137 "PGPASSWORD=yorch_secure_2024 psql -U yorch -d yorch_db -h localhost -c 'SELECT 1;'"
```

### **Error de migraciones:**
```bash
# Ejecutar migraciones manualmente
ssh juan@188.245.126.137 << 'EOF'
cd ~/apps/yorch/yorch-backend
source .venv/bin/activate
alembic upgrade head
EOF
```

---

**Última actualización:** 2025-12-07
