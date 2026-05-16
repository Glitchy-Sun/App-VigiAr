# VigiAr — Test Credentials

Backend seeds (idempotente) on app startup. Defined in `backend/server.py`.

## Manager (Gestor)
- Matrícula: `GESTOR001`
- Senha: `gestor123`
- Role: `gestor`
- Routes: `/dashboard`

## Field Agents (Agentes)
- Matrícula: `ACE001` / Senha: `agente123` — Boa Viagem
- Matrícula: `ACS002` / Senha: `agente123` — Boa Viagem
- Matrícula: `ACE003` / Senha: `agente123` — Casa Forte
- Role: `agente`
- Routes: `/home`, `/registro`, `/pendentes`

Login endpoint: `POST /api/auth/login` with body `{\"matricula\": \"...\", \"password\": \"...\"}`
JWT token returned has 30-day expiry (offline-first).
