# API (real backend: Eutropia ComplaintManagement)
Base: `/api` (Vite proxy -> http://127.0.0.1:8000). Auth: `Authorization: Bearer <access>`.

| Frontend use | Method + endpoint |
|---|---|
| Login | POST /api/token/ {username,password} -> {access,refresh} |
| Refresh | POST /api/token/refresh/ |
| Register (customer) | POST /api/accounts/register/ |
| Tickets list / detail | GET /api/tickets/tickets/ , /{id}/ |
| Submit ticket | POST /api/tickets/tickets/ {subject,description,priority} |
| Status / priority | PATCH /api/tickets/tickets/{id}/update_status/ , update_priority/ |
| Assign (admin) | PATCH /api/tickets/tickets/{id}/assign_agent/ {agent_id} |
| SLA deadlines | GET /api/sla/ |
| Dashboard KPIs | GET /api/dashboard/summary/ |
| Notifications | GET /api/notifications/ |
| Activity log | GET /api/logs/ |

Role mapping: customer -> citizen, agent -> agent, admin -> admin. The backend has no "me" endpoint, so the frontend detects the role by probing (see `detectRole` in `src/lib/api.ts`).
