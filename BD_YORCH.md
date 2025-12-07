# CONEXION A BASE DE DATOS LOCAL - YORCH

Guia rapida para conectarse a la base de datos PostgreSQL de YORCH en desarrollo local.

---

## CONFIGURACION ACTUAL

Tu base de datos PostgreSQL corre en el mismo Docker que JJ Ross:

```yaml
Container: jjross-postgres
Host: localhost
Puerto: 5433 (host) → 5432 (container)
Usuario: postgres
Password: postgres123
Base de datos: yorch_db
```

---

## COMANDOS VERIFICADOS QUE FUNCIONAN

### 1. Ver todas las tablas

```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "\dt"
```

**Output esperado:**
```
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | alembic_version       | table | postgres
 public | clientes              | table | postgres
 public | mensajes              | table | postgres
 public | movimientos_pendientes| table | postgres
```

---

### 2. Ver version de Alembic (migraciones)

```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT version_num FROM alembic_version;"
```

---

### 3. Contar registros en tablas

```bash
# Clientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT COUNT(*) as total FROM clientes;"

# Movimientos pendientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT COUNT(*) as total FROM movimientos_pendientes;"

# Mensajes del chat
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT COUNT(*) as total FROM mensajes;"
```

---

### 4. Ver estructura de una tabla

```bash
# Estructura de clientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "\d clientes"

# Estructura de movimientos_pendientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "\d movimientos_pendientes"
```

---

### 5. Ver datos de tablas

```bash
# Ver todos los clientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT id, nombre, imagen_sobre_url FROM clientes;"

# Ver movimientos pendientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT m.id, c.nombre, m.tipo, m.monto, m.procesado FROM movimientos_pendientes m JOIN clientes c ON m.cliente_id = c.id ORDER BY m.id DESC;"

# Ver ultimos mensajes del chat
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT id, rol, LEFT(contenido, 50) as contenido FROM mensajes ORDER BY id DESC LIMIT 10;"
```

---

### 6. Queries utiles para YORCH

#### Ver clientes con pendientes:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT c.nombre, COUNT(m.id) as pendientes, SUM(CASE WHEN m.tipo='PRESTAMO' THEN m.monto ELSE 0 END) as prestamos, SUM(CASE WHEN m.tipo='ABONO' THEN m.monto ELSE 0 END) as abonos FROM clientes c JOIN movimientos_pendientes m ON c.id = m.cliente_id WHERE m.procesado = false GROUP BY c.nombre;"
```

#### Ver todos los movimientos (pendientes y procesados):
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT m.id, c.nombre, m.tipo, m.monto, m.procesado, m.created_at FROM movimientos_pendientes m JOIN clientes c ON m.cliente_id = c.id ORDER BY m.created_at DESC LIMIT 20;"
```

#### Ver solo pendientes:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT m.id, c.nombre, m.tipo, m.monto FROM movimientos_pendientes m JOIN clientes c ON m.cliente_id = c.id WHERE m.procesado = false;"
```

#### Buscar cliente por nombre:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT * FROM clientes WHERE nombre ILIKE '%preciado%';"
```

---

### 7. Abrir consola interactiva de PostgreSQL

```bash
docker exec -it jjross-postgres psql -U postgres -d yorch_db
```

**Nota:** Puede dar error "input device is not a TTY" en algunos terminales de Windows.
Si ocurre, usa los comandos `-c` de arriba.

---

## MODIFICAR DATOS (CON CUIDADO)

### Marcar movimiento como procesado manualmente:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "UPDATE movimientos_pendientes SET procesado = true, procesado_at = NOW() WHERE id = 1;"
```

### Eliminar un cliente de prueba:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "DELETE FROM clientes WHERE nombre = 'Cliente Prueba';"
```

### Limpiar historial de mensajes:
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "DELETE FROM mensajes;"
```

### Limpiar movimientos procesados (mantener pendientes):
```bash
docker exec jjross-postgres psql -U postgres -d yorch_db -c "DELETE FROM movimientos_pendientes WHERE procesado = true;"
```

---

## COMANDOS RAPIDOS MAS USADOS

```bash
# Ver tablas
docker exec jjross-postgres psql -U postgres -d yorch_db -c "\dt"

# Ver clientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT id, nombre, imagen_sobre_url FROM clientes;"

# Ver pendientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT m.id, c.nombre, m.tipo, m.monto FROM movimientos_pendientes m JOIN clientes c ON m.cliente_id = c.id WHERE m.procesado = false;"

# Contar pendientes
docker exec jjross-postgres psql -U postgres -d yorch_db -c "SELECT COUNT(*) FROM movimientos_pendientes WHERE procesado = false;"
```

---

## TROUBLESHOOTING

### Error: "Cannot connect to Docker daemon"
**Solucion:** Inicia Docker Desktop

### Error: "container jjross-postgres is not running"
**Solucion:**
```bash
cd C:\Users\juanp\Documents\Proyectos\jjross
docker-compose up -d postgres
```

### Error: "database yorch_db does not exist"
**Solucion:** Crear la base de datos:
```bash
docker exec jjross-postgres psql -U postgres -c "CREATE DATABASE yorch_db;"
```
Luego ejecutar migraciones:
```bash
cd C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend
.venv\Scripts\activate
alembic upgrade head
```

---

## ESTRUCTURA DE TABLAS YORCH

### clientes
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | INT | ID unico |
| nombre | VARCHAR | Nombre del cliente |
| cedula | VARCHAR | Cedula (opcional) |
| telefono | VARCHAR | Telefono (opcional) |
| direccion | VARCHAR | Direccion (opcional) |
| imagen_sobre_url | VARCHAR | URL de la imagen del sobre |
| notas | TEXT | Notas adicionales |
| created_at | TIMESTAMP | Fecha de creacion |

### movimientos_pendientes
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | INT | ID unico |
| cliente_id | INT | FK a clientes |
| tipo | VARCHAR | PRESTAMO o ABONO |
| monto | DECIMAL | Monto del movimiento |
| notas | TEXT | Notas adicionales |
| procesado | BOOLEAN | Si ya se actualizo el sobre |
| procesado_at | TIMESTAMP | Cuando se proceso |
| created_at | TIMESTAMP | Fecha de creacion |

### mensajes
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | INT | ID unico |
| rol | VARCHAR | user o assistant |
| contenido | TEXT | Contenido del mensaje |
| created_at | TIMESTAMP | Fecha de creacion |

---

## ESTRUCTURA DE CONEXION

```
Tu PC (Windows)
    ↓
localhost:5433
    ↓
Docker Container (jjross-postgres)
    ↓
PostgreSQL (puerto interno 5432)
    ↓
Base de datos: yorch_db
```

---

## ARCHIVOS IMPORTANTES

- **Backend:** `C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend\`
- **Frontend:** `C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-frontend\`
- **Migraciones:** `C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend\alembic\versions\`
- **Uploads:** `C:\Users\juanp\Documents\Proyectos\proyecto yorch\yorch-backend\uploads\sobres\`
- **Docker (compartido):** `C:\Users\juanp\Documents\Proyectos\jjross\docker-compose.yml`

---

**Ultima actualizacion:** 2025-12-07
