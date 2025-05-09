# Active Context: React Traefik Dashboard v2 API Migration (Initialization)

## 1. Current Work Focus

- **Backend Migration (Phase 1):** Modifying the Node.js backend (`api/routes/api.js`) to proxy Traefik v2 API endpoints instead of v1.
- **Memory Bank Update:** Reflecting analysis findings and v2 API mapping in documentation.

## 2. Recent Changes

- Created the `memory-bank` directory.
- Created `projectbrief.md`.
- Created `productContext.md`.
- Created this file (`activeContext.md`).

## 3. Next Steps (Immediate)

- **Update Memory Bank:** Reflect analysis findings (backend proxy role, dependencies, v1 API usage in actions/reducers). (Done for systemPatterns, productContext)
- **Update Memory Bank:** Update progress.md. (Next)
- **Modify Backend (`api/routes/api.js`):** Replace the `/api/providers` proxy logic with new proxies for v2 endpoints (e.g., `/api/v2/http/routers`, `/api/v2/http/services`).
- **Frontend State Redesign:** Plan the new Redux state structure for v2 data.

## 4. Active Decisions & Considerations

- **Memory Bank:** Establishing a robust documentation structure is crucial due to session memory resets.
- **API Mapping:** The core challenge will be accurately mapping v1 concepts/endpoints (backends, frontends) to v2 concepts/endpoints (services, routers, middleware).
- **State Management:** Need to understand the current Redux setup (`actions/`, `reducers/`, `store/`) and how API data is integrated into the application state. This will likely require significant refactoring.
- **Backend API (`api/` directory):** Confirmed role as a proxy for the Traefik API (currently v1 `/api/providers`) and URL management. Migration requires modifying this backend.

## 5. Important Patterns & Preferences (To Be Discovered)

*(This section will be populated as we analyze the code and establish working patterns)*

- Coding style preferences.
- Preferred libraries or approaches for API calls (e.g., `fetch`, `axios`).
- State management patterns observed.

## 6. Learnings & Insights (To Be Discovered)

*(This section will capture key learnings during the migration process)*

- **API Mapping:** Identified key v2 endpoints (`/api/http/routers`, `/api/http/services`, etc.) corresponding to v1 `/api/providers`.
- **Frontend Dependencies:** Confirmed use of React v15, Redux, isomorphic-fetch.
- **Development Workflow:** Separate start scripts for frontend (`start-front`) and backend (`start-api`), with proxy configured in `package.json`.
