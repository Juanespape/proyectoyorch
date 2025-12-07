# Comandos para Desarrollo Local - Yorch

## 🐍 Backend (FastAPI)

### Primera vez (configuración inicial):
```bash
# 1. Ir a la carpeta del backend
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend

# 2. Crear entorno virtual
python -m venv .venv

# 3. Activar entorno virtual (Windows)
.venv\Scripts\activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Crear las tablas en la base de datos (primera vez)
alembic revision --autogenerate -m "Initial tables"
alembic upgrade head
```

### Iniciar servidor backend:
```bash
# Activar entorno virtual (si no está activo)
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend
.venv\Scripts\activate

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

**URL Backend:** http://localhost:8000
**Docs API:** http://localhost:8000/docs

---

## ⚛️ Frontend (Next.js)

### Primera vez (configuración inicial):
```bash
# 1. Ir a la carpeta del frontend
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-frontend

# 2. Instalar dependencias
npm install
```

### Iniciar servidor frontend:
```bash
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-frontend
npm run dev
```

**URL Frontend:** http://localhost:3000

---

## 🚀 Desarrollo en paralelo (2 terminales)

### Terminal 1 - Backend:
```bash
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend:
```bash
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-frontend
npm run dev
```

---

## 🗃️ Base de Datos Local (PostgreSQL en Docker)

La base de datos corre en el mismo container Docker de jjross:

```
Container: jjross-postgres
Host: 127.0.0.1
Puerto: 5433
Usuario: postgres
Password: postgres123
Base de datos: yorch_db
```

### Comandos útiles de BD:

```bash
# Ver tablas
docker exec jjross-postgres psql -U postgres -d yorch_db -c "\dt"

# Ver estructura de una tabla
docker exec jjross-postgres psql -U postgres -d yorch_db -c "\d clientes"

# Ver clientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT * FROM clientes;"

# Ver movimientos pendientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT * FROM movimientos_pendientes WHERE procesado = false;"

# Ver mensajes del chat
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT * FROM mensajes ORDER BY id DESC LIMIT 10;"

# Contar registros
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT COUNT(*) FROM clientes;"

# Ver versión de Alembic
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT version_num FROM alembic_version;"
```

### Insertar cliente de prueba:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "INSERT INTO clientes (nombre, cedula, telefono) VALUES ('Acevedo Marroquin Cristian', '1005074881', '3142435053');"
```

---

## 📝 Migraciones (Alembic)

```bash
# Activar entorno primero
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend
.venv\Scripts\activate

# Crear nueva migración
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Ver estado actual
alembic current

# Revertir última migración
alembic downgrade -1
```

---

## 🔗 URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 📦 Git

```bash
git status
git add -A
git commit -m "mensaje"
git push origin main
```
