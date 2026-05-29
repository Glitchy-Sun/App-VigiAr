# VigiAr — PRD (MVP)

## Visão
App móvel offline-first para Agentes de Saúde (ACE/ACS) coletarem visitas
em campo e um Dashboard web para Gestores Municipais visualizarem mapa de
calor e estatísticas em tempo real (Recife como cidade-piloto).

## Arquitetura
- **Mobile / Web cliente:** Expo Router (React Native + React Native Web)
- **Persistência local (offline):** AsyncStorage via `@/src/utils/storage`
- **Backend:** FastAPI + Motor (async MongoDB)
- **DB:** MongoDB com índice `2dsphere` em `visitas.location`
- **Auth:** JWT 30 dias (bcrypt + python-jose). Sessão cacheada → reabre app offline.
- **Mapa:** Leaflet + OpenStreetMap (carregado via CDN no web)
- **Alertas SMS/WhatsApp:** MOCK (registra disparo em `db.alertas`)

## Telas / Rotas (Expo Router)
| Rota | Audiência | Função |
|---|---|---|
| `/` | todos | Splash + redirect baseado em sessão |
| `/login` | todos | Matrícula + senha, offline-friendly após 1ª autenticação |
| `/home` | agente | Botão GRANDE \"Novo Registro\", contador pendentes, sync manual |
| `/registro` | agente | Fluxo 3 cliques (Visitado/Fechado → focos → salvar) |
| `/pendentes` | agente | Fila local com retry de sync |
| `/dashboard` | gestor | KPIs, mapa de calor Leaflet, zonas de risco + disparo de alerta |

## Endpoints da API
- `POST /api/auth/login` → `{access_token, user}`
- `GET  /api/auth/me`
- `POST /api/sync` (lote idempotente via `client_id`)
- `GET  /api/visitas` (filtros: data_inicio, data_fim, bairro, tipo)
- `GET  /api/dashboard/stats`
- `GET  /api/dashboard/heatmap` (GeoJSON FeatureCollection)
- `GET  /api/dashboard/zonas-risco`
- `POST /api/dashboard/alertas` (MOCK)
- `GET  /api/dashboard/alertas`
- `GET  /api/bairros`

## Requisitos funcionais atendidos
- **RF001** Sessão local após 1º login (token+user cacheados via secure storage).
- **RF002** GPS passivo via `expo-location` (web: `navigator.geolocation`).
- **RF003** Fluxo 3 cliques: status → focos → salvar (fechado encerra com 1 confirmação).
- **RF004** Persistência IndexedDB-equivalente (AsyncStorage / localStorage).
- **RF005** Auto-sync em background ao detectar `online` (hook `useSync`).
- **RF006** Fallback GPS: alerta discreto + seleção manual de setor/bairro.
- **RF007** Mapa de calor Leaflet com pontos + popups.
- **RF008** Filtros: bairro e tipo de criadouro.
- **RF009** Botão \"Disparar Alerta SMS/WhatsApp\" por zona de risco (**MOCK**).

## Mocks ativos
- **MOCKED** Disparo SMS/WhatsApp → apenas grava em `db.alertas` (sem provedor real).

## Próximos passos (pós-MVP)
- Integrar Twilio/Meta WhatsApp real (RF009).
- Push notifications para gestores.
- Filtros por data (UI) — endpoint já suporta `data_inicio`/`data_fim`.
- Mapa de calor com heatlayer real e clusters por bairro.
