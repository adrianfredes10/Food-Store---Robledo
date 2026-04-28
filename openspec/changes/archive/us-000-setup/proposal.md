# Proposal: us-000-setup

## Qué se hace
Setup inicial del proyecto FoodStore con la arquitectura base,
configuración del entorno y estructura de módulos.

## Por qué
Para tener una base sólida sobre la que construir todos los
módulos del sistema de forma ordenada y trazable.

## Scope
- Estructura de carpetas backend y frontend
- Configuración de base de datos PostgreSQL con Alembic
- Configuración de autenticación JWT
- Setup de React + Vite + TypeScript + TanStack Query + Zustand
- CORS configurado para comunicación frontend-backend

## Fuera de scope
- Implementación de módulos de negocio (pedidos, pagos, etc.)
- Integración con MercadoPago
- Deploy en producción

## Historias de usuario cubiertas
- Base para todas las historias de usuario (US-001 a US-009)
