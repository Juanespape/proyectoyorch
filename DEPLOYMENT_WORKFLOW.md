# 🚀 Flujo de Trabajo para Deployment - Yorch

**Última actualización:** 2025-12-07
**Servidor:** Hetzner Cloud (188.245.126.137)

---

## 📋 PROCESO COMPLETO DE DEPLOYMENT

### **1️⃣ DESARROLLO (Windows - PC Local)**

```bash
# Navegar al proyecto
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch

# Hacer cambios en yorch-backend o yorch-frontend
# Probar localmente...
```

### **Commitear cambios a GitHub:**
```bash
git status
git add -A
git commit -m "Descripción de los cambios"
git push origin main
```

---

### **2️⃣ DEPLOYMENT**

#### **🚀 FRONTEND (VERCEL - AUTOMÁTICO):**
```
⚠️ IMPORTANTE: El frontend se despliega AUTOMÁTICAMENTE en Vercel
   cuando se hace push a GitHub (main branch).

   NO ejecutar nada manualmente para el frontend.
```

#### **🖥️ BACKEND (Servidor Hetzner):**

**Conectarse al servidor:**
```bash
ssh juan@188.245.126.137
```

**Ejecutar deployment:**
```bash
bash ~/deploy-backend.sh
```

**Verificar deployment:**
```bash
bash ~/verify-deployment.sh
```

---

## 🔧 SCRIPTS DISPONIBLES EN EL SERVIDOR

| Script | Función |
|--------|---------|
| `~/deploy-backend.sh` | Deploy del backend FastAPI |
| `~/verify-deployment.sh` | Verificar estado de servicios |

---

## 📁 ESTRUCTURA DEL SERVIDOR

```
/home/juan/
├── apps/
│   └── yorch/
│       ├── yorch-backend/     # Backend FastAPI (Puerto 8000)
│       │   ├── .venv/         # Python virtual environment
│       │   ├── app/           # Código de la aplicación
│       │   ├── alembic/       # Migraciones
│       │   └── .env           # Variables de entorno
│       │
│       └── yorch-frontend/    # (No se usa en servidor, está en Vercel)
│
├── logs/                      # Logs de deployment
├── deploy-backend.sh          # Script de deploy
└── verify-deployment.sh       # Script de verificación
```

---

## 🔐 CREDENCIALES

### **Base de Datos PostgreSQL:**
```
Host: localhost
Database: yorch_db
User: yorch
Password: yorch_secure_2024
```

### **Servidor SSH:**
```
IP: 188.245.126.137
User: juan
Key: ~/.ssh/id_ed25519
```

---

## ⚙️ SERVICIOS Y PUERTOS

| Servicio | Puerto | Gestor | Comando |
|----------|--------|--------|---------|
| Backend (FastAPI) | 8000 | systemd | `sudo systemctl start/stop/restart yorch-backend` |
| PostgreSQL | 5432 | systemd | `sudo systemctl status postgresql` |
| Frontend | - | Vercel | Automático |

---

## 🔄 FLUJO TÍPICO (Resumen)

```
┌─────────────────────────────────────────────────────────┐
│ WINDOWS (Desarrollo)                                    │
│ C:\Users\juanp\Documents\Proyectos\proyecto yorch       │
├─────────────────────────────────────────────────────────┤
│ 1. Hacer cambios en código                              │
│ 2. git add -A                                           │
│ 3. git commit -m "mensaje"                              │
│ 4. git push origin main                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │    GITHUB      │
            │  Juanespape/   │
            │ proyectoyorch  │
            └────┬───────┬───┘
                 │       │
     ┌───────────┘       └────────────┐
     │                                │
     ▼                                ▼
┌─────────────────┐    ┌──────────────────────────────────┐
│ VERCEL          │    │ HETZNER (Backend)                │
│ (Frontend)      │    │                                  │
├─────────────────┤    ├──────────────────────────────────┤
│ ✅ Deploy AUTO  │    │ 1. ssh juan@188.245.126.137      │
│ ~2-3 minutos    │    │ 2. bash ~/deploy-backend.sh      │
└─────────────────┘    └──────────────────────────────────┘
```

---

## 📝 COMANDOS ÚTILES

```bash
# Ver logs del backend
sudo journalctl -u yorch-backend -f

# Reiniciar backend
sudo systemctl restart yorch-backend

# Ver estado de PostgreSQL
sudo systemctl status postgresql

# Conectarse a la base de datos
psql -U yorch -d yorch_db -h localhost
```

---

**Creado por:** Claude Code
