# Food Store · TPI Programación IV

Aplicación web de pedidos de comida: los clientes recorren el catálogo, arman el carrito y confirman pedidos; el administrador gestiona categorías, productos, stock, pedidos y usuarios.

- **Alumnos:** Cristian Chiavón y Facundo Chiavón
- **Materia:** Programación IV · Tecnicatura Universitaria en Programación a Distancia (UTN)
- **Repositorio:** https://github.com/cridvon/food-store-tpi
- **Video de demostración:** https://youtu.be/GAaNzyyiUTo

## Stack

| Parte | Tecnologías |
|---|---|
| Backend | Python 3.11 a 3.13, FastAPI, SQLModel, PostgreSQL (psycopg2), JWT en cookie HttpOnly (python-jose), bcrypt (passlib) |
| Frontend | React 19 + TypeScript (strict), Vite 7, Tailwind CSS 4, TanStack Query, Form y Table, Zustand, React Router 7, Axios |

## Requisitos

- **Python 3.11, 3.12 o 3.13.** La consigna indica que SQLModel no funciona con 3.14. En macOS: `brew install python@3.13`.
- **PostgreSQL 15 o superior.** Para desarrollo también sirve SQLite (ver variables de entorno).
- **Node.js 20.19 o superior** y **pnpm 9 o superior** (`npm install -g pnpm`).

## 1. Base de datos

```bash
# macOS con Homebrew
brew install postgresql@16
brew services start postgresql@16
createdb foodstore_db

# O con Docker
docker run --name foodstore-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=foodstore_db -p 5432:5432 -d postgres:16
```

## 2. Backend

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
# Editar DATABASE_URL en .env con tu usuario y clave de PostgreSQL
python -m app.db.seed
uvicorn app.main:app --reload
```

- La API queda en http://localhost:8000.
- La documentación está en http://localhost:8000/docs y en http://localhost:8000/redoc.
- Al iniciar, la app crea las tablas que faltan.
- El seed se puede ejecutar varias veces sin duplicar datos.

Si el proyecto está dentro de una carpeta sincronizada (Dropbox, iCloud) y el servidor se reinicia solo una y otra vez, el `--reload` está vigilando la `.venv`. Limitalo a la carpeta del código:

```bash
uvicorn app.main:app --reload --reload-dir app
```

### Variables de entorno (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://postgres:postgres@localhost:5432/foodstore_db` (Homebrew: `postgresql://TU_USUARIO@localhost:5432/foodstore_db`; desarrollo: `sqlite:///./foodstore.db`) |
| `SECRET_KEY` | Firma del JWT, mínimo 32 caracteres | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración de la cookie y del token | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (varios separados por coma) | `http://localhost:5173` |

### Usuarios del seed

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | admin |
| `cliente` | `Cliente1234!` | user |

El seed también carga 4 categorías y 10 productos con stock.

## 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env               # Windows: copy .env.example .env
pnpm install
pnpm build                         # compila y verifica los tipos
pnpm dev
```

- La app queda en http://localhost:5173.
- Variable `VITE_API_URL` en `frontend/.env`: `http://localhost:8000/api/v1`.

**Importante:** abrí el frontend en `localhost`, no en `127.0.0.1`. La cookie de sesión la emite `localhost:8000`, y el navegador solo la envía si los dos usan el mismo nombre de host.

## Arquitectura

### Backend: módulos por dominio y capas

```
backend/app/
├── main.py              # FastAPI, CORS con credenciales, routers bajo /api/v1
├── core/
│   ├── config.py        # Settings con pydantic-settings (.env)
│   ├── database.py      # engine, create_all_tables, session_factory
│   ├── security.py      # bcrypt, create_access_token, decode_access_token
│   ├── deps.py          # get_current_user, get_current_active_user, require_role
│   ├── unit_of_work.py  # UnitOfWork: commit / rollback / close en __exit__
│   └── base_repository.py  # BaseRepository[T]: get_by_id, get_all, add, delete
├── modules/
│   ├── auth/            # router, service, schemas (usa el modelo Usuario)
│   ├── usuarios/        # models, schemas, repository, unit_of_work, service, router
│   ├── categorias/      # misma cadena de archivos
│   ├── productos/       # misma cadena de archivos
│   └── pedidos/         # misma cadena; RN-01 a RN-06 y máquina de estados
└── db/seed.py           # admin, cliente, categorías y productos (idempotente)
```

- **Flujo de una petición:** Router → Service → Unit of Work → Repository → Model.
- **Commit:** lo hace solo el `__exit__` del Unit of Work. Ningún Service ni Router llama a `session.commit()`.
- **Router:** obtiene el Service con `Depends(get_<modulo>_service)` y traduce las excepciones de dominio a `HTTPException`.
- **Crear un pedido es una sola transacción.**
  - Por cada ítem: bloquea la fila del producto (`SELECT … FOR UPDATE`), verifica disponibilidad y stock, descuenta el stock y crea la línea con una copia del nombre y del precio.
  - Si cualquier validación falla, el rollback deshace todo, incluido el stock ya descontado.
- **Cancelar un pedido** devuelve el stock de cada línea en la misma transacción que cambia el estado.

### Frontend: organización por features

```
frontend/src/
├── shared/      # api (axiosInstance, handleApiError, queryClient), ui, components, layout, utils, hooks
├── features/    # auth, categorias, productos, usuarios, pedidos → pages, components, hooks, api, types
├── store/       # authStore y cartStore (Zustand + persist)
├── routes/      # AppRouter y ProtectedRoute
├── App.tsx      # checkSession al montar
└── main.tsx     # QueryClientProvider
```

- **Datos del servidor:** catálogo, pedidos, usuarios y resumen se manejan con TanStack Query (`useQuery`, y `useMutation` con invalidación).
- **Datos del cliente:** la sesión y el carrito van en Zustand con `persist`.
- **Sesión:** el `authStore` solo guarda los datos del usuario. El token vive en la cookie HttpOnly y el frontend nunca lo lee.
- **Axios:**
  - Usa `withCredentials: true`.
  - Su interceptor limpia la sesión ante un 401 (salvo en el login y en `/auth/me`) o ante una cuenta desactivada.
- **Rutas protegidas:** `ProtectedRoute` manda a `/login` si no hay sesión y a `/unauthorized` si el rol no tiene permiso. La protección real está en el backend.

## Endpoints (prefijo `/api/v1`)

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register` · `/auth/token` · `/auth/logout` | Público |
| GET | `/auth/me` | Sesión |
| GET | `/admin/usuarios` | admin |
| POST | `/admin/usuarios/{id}/activar` · `/desactivar` | admin |
| GET | `/categorias` · `/categorias/{id}` | Público |
| POST, PUT, DELETE | `/categorias` · `/categorias/{id}` | admin |
| GET | `/categorias/inactivas` | admin |
| PATCH | `/categorias/{id}/reactivar` | admin |
| GET | `/productos?skip&limit&search&categoria_id&disponible` · `/productos/{id}` | Público |
| POST, PUT, DELETE | `/productos` · `/productos/{id}` | admin |
| PATCH | `/productos/{id}/stock` | admin |
| POST, GET | `/pedidos` | Sesión (el cliente ve solo los suyos) |
| GET | `/pedidos/resumen` | admin |
| GET | `/pedidos/{id}` | Dueño o admin |
| PATCH | `/pedidos/{id}/estado` | admin |
| PATCH | `/pedidos/{id}/cancelar` | Dueño, solo en PENDIENTE |

**Reactivar categorías:** la baja lógica no libera el nombre (como pide la consigna), así que una categoría dada de baja no se puede volver a crear. Desde *Panel admin > Categorías*, el interruptor «Mostrar dadas de baja» las lista y el botón **Reactivar** las recupera con el mismo id. `/categorias/inactivas` y `/categorias/{id}/reactivar` son endpoints agregados al TPI; reactivar responde 404 si no existe y 409 si ya está activa.

Los códigos de cada endpoint (201, 204, 400, 401, 403, 404, 409 y 422) siguen la especificación del TPI y se pueden ver en `/docs`.
