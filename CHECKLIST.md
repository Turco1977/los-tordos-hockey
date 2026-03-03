# Checklist de Tareas - Los Tordos Hockey

## Tareas pedidas por el usuario (realizadas)

- [x] Sprint 1 Seguridad: Auth middleware + Zod validation + role-based access (fa1d44f)
  - middleware.ts: rate limiting 30/min/IP + Bearer token validation
  - authServer.ts: verifyUser, verifyHockeyUser, requireLevel helpers
  - schemas.ts: Zod validation para todos los POST/PUT
  - apiFetch.ts: frontend fetch wrapper con Bearer token automático
  - 14 rutas API protegidas con auth + validación
  - admin/create-user restringido a Director (nivel 1)
  - QR scanning (asistencia/qr GET/POST) permanece público
  - Audit logs usan user ID del token verificado (no body._user_id)
  - 7 componentes frontend actualizados: fetch() → apiFetch()

## Tareas propuestas por Claude (realizadas)

<!-- Agregar aquí cuando surjan -->

## Pendientes / Ideas futuras

<!-- Agregar aquí tareas pendientes cuando surjan -->
