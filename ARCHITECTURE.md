# Architecture map

## Current → target

| Current | Target | Compatibility |
| --- | --- | --- |
| `backend/models` and route-embedded logic | `backend/src/modules/{auth,user,listing,visit,admin}` | All existing route domains are now feature modules; existing endpoint paths, response shapes and environment variables remain unchanged. |
| `backend/server.js` | `backend/src/app.js` + `backend/src/server.js` | Root entrypoint delegates to the modular server. |
| `frontend/src/components` | `components/{layout,property,common,search}` | Compatibility exports keep existing imports working during the move. |
| page-local HTTP requests | `frontend/src/services` | Existing API contract remains unchanged. |
| scattered palette choices | `frontend/src/styles/tokens.css` | Shared light/dark design tokens. |

Shared configuration, database startup, Socket.io, authentication context, i18n and routing stay global because they are used by more than one feature.
