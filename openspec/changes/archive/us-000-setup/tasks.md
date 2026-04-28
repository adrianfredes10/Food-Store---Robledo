# Tasks: us-000-setup

## Checklist de implementación

### Backend
- [x] Crear estructura de carpetas app/modules/
- [x] Configurar pyproject.toml con todas las dependencias
- [x] Implementar Settings con pydantic-settings
- [x] Configurar conexión a PostgreSQL con SQLAlchemy
- [x] Implementar BaseRepository genérico
- [x] Implementar UnitOfWork con context manager
- [x] Configurar Alembic para migraciones
- [x] Crear migración inicial con todas las tablas
- [x] Implementar JWT (crear, verificar, refresh)
- [x] Implementar hash de passwords con bcrypt
- [x] Configurar CORS para el frontend
- [x] Crear seed con roles, estados y usuario admin
- [x] Configurar uvicorn con hot reload

### Frontend
- [x] Crear proyecto con Vite + React + TypeScript
- [x] Configurar tsconfig con strict: true
- [x] Instalar y configurar TanStack Query
- [x] Instalar y configurar Zustand
- [x] Configurar Axios con interceptor de refresh 401
- [x] Crear auth-store con persistencia en localStorage
- [x] Configurar react-router-dom con rutas principales
- [x] Configurar Tailwind CSS
- [x] Crear estructura de carpetas features/ y shared/

### Verificación
- [x] alembic upgrade head sin errores
- [x] python -m app.db.seed sin errores
- [x] uvicorn corre en puerto 8008
- [x] npm run dev corre en puerto 5173
- [x] Frontend se comunica con el backend
