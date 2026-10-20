## Qué cambia

<!-- Resumen breve y enlace a specs/<nombre>/spec.md -->

## Tipo

- [ ] Feature (`feat/*`)
- [ ] Fix (`fix/*`)
- [ ] Documentación (`docs/*`)

## Verificación

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] UI verificada con Chrome MCP (si aplica)
- [ ] CI del PR en verde

## Cierre de feature

> Obligatorio para PRs de feature/fix y para el PR `docs/cierre-<nombre>`.
> Para documentación que no cierra una feature, marcar “No aplica”.

- [ ] `specs/<nombre>/tasks.md` sin casillas pendientes
- [ ] `specs/<nombre>/cierre.md` completo (sin casillas pendientes)
- [ ] `MEMORY.md`: estado, roadmap y Registro de features actualizados
- [ ] `CHANGELOG.md`, `README.md` y `docs/*` actualizados
- [ ] `npm run docs:check -- <nombre>` pasa
- [ ] Producción verificada (URL, deployment, commit y smoke autenticado)
- [ ] Rama de feature borrada y CI de `main` verde

## Notas

<!-- Riesgos, follow-ups, credenciales: NUNCA pegar contraseñas o secretos -->
