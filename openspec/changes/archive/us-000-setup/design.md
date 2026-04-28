# Design: us-000-setup

## Enfoque técnico

### Backend
- FastAPI con estructura modular (app/modules/)
- SQLModel + Alembic para modelos y migraciones
- Patrón UoW (Unit of Work) para transacciones
- JWT con python-jose y bcrypt para autenticación
- pyproject.toml como gestor de dependencias

### Frontend
- Vite + React 18 + TypeScript strict
- TanStack Query v5 para estado del servidor
- Zustand v4 para estado del cliente
- Axios con interceptor de refresh 401
- Tailwind CSS para estilos

### Estructura de archivos backend
```
backend/
├── app/
│   ├── core/         (config, db, security, uow)
│   ├── deps/         (auth, roles, uow)
│   ├── modules/      (auth, usuarios, categorias...)
│   └── main.py
├── alembic/
└── pyproject.toml
```

### Estructura de archivos frontend
```
frontend/
├── src/
│   ├── app/          (router, providers)
│   ├── pages/        (una por ruta)
│   ├── features/     (hooks y UI por dominio)
│   └── shared/       (api, store, types, ui)
└── vite.config.ts
```

## Decisiones técnicas
- SQLModel elegido por combinar SQLAlchemy + Pydantic en una clase
- UoW para garantizar atomicidad en operaciones complejas
- TanStack Query para caché automático y sincronización
- Zustand para estado liviano sin boilerplate

## Dependencias entre módulos
- Auth depende de: Usuarios, Roles
- Productos depende de: Categorías, Ingredientes
- Pedidos depende de: Productos, Usuarios, Direcciones
- Pagos depende de: Pedidos
