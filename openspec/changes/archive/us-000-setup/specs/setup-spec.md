# Specs: us-000-setup

## Variables de entorno requeridas

### Backend (.env)
```
DATABASE_URL=postgresql+psycopg2://foodstore:foodstore@127.0.0.1:5432/foodstore
JWT_SECRET_KEY=min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
MERCADOPAGO_MOCK=true
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8008
```
(En desarrollo suele bastar el proxy de Vite hacia el puerto 8008; ver `vite.config.ts`.)

## Credenciales seed
- Admin: `admin@foodstore.com` / `Admin1234!`
- Roles: ADMIN | STOCK | PEDIDOS | CLIENT

## Contratos de autenticación
- `POST /api/v1/auth/register` → 201 `{ id, email, roles }`
- `POST /api/v1/auth/login` → 200 `{ access_token, refresh_token }`
- `POST /api/v1/auth/refresh` → 200 `{ access_token, refresh_token }`
- `POST /api/v1/auth/logout` → 204
