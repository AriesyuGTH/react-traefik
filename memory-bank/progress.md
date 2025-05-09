# Progress: React Traefik Dashboard v2 API Migration

## 1. Current Status

- **Phase:** Backend Migration (Phase 1) & Documentation.
- **Overall Progress:** ~5% (Analysis complete, backend modification planning started).
- **Memory Bank:** Updated with detailed analysis findings (backend role, dependencies, API usage, v1-v2 mapping).

## 2. What Works (Current State - Pre-Migration)

- The dashboard application *presumably* functions correctly when connected to a Traefik v1 instance (this needs verification).
- The basic React/Redux structure is in place.
- The Node.js/Express backend (`api/`) acts as a proxy to the Traefik v1 API (`/api/providers`) and manages the Traefik URL.

## 3. What's Left to Build/Migrate

- **Analysis:**
- **Analysis:** (Completed)
    - Analyzed `api/`, `src/actions`, `src/reducers`, `package.json`, `config/`, `src/Conf.js`.
    - Confirmed backend proxy role. Frontend calls backend only.
    - Identified dependencies (React 15, Redux, Express, etc.).
    - Confirmed v1 API usage (`/api/providers` via backend proxy).
- **Mapping:** (Initial mapping done)
    - Identified key v2 endpoints (`/api/http/routers`, `/api/http/services`, etc.).
    - Updated `productContext.md` and `systemPatterns.md`.
- **Implementation (Backend - In Progress):**
    - **Modify `api/routes/api.js`**: Replace `/api/providers` proxy with new proxies for v2 endpoints (e.g., `/api/v2/http/routers`, `/api/v2/http/services`).
- **Implementation (Frontend - Next):**
    - Redesign Redux state structure (`reducers/index.js`).
    - Update actions (`actions/index.js`) to call new backend endpoints.
    - Update reducers to handle v2 data.
    - Rewrite search logic (`filterProviders`).
    - Modify React components (`components/`, `containers/`).
- **Testing:**
    - Set up a Traefik v2 instance.
    - Test backend proxy endpoints.
    - Test frontend data fetching and display.
    - Test search functionality.
- **Documentation:**
    - Update Memory Bank (In Progress).
    - Update `README.md` (Later).

## 4. Known Issues / Blockers

- **Backend Role Confirmed:** Backend (`api/`) is a necessary proxy.
- **Lack of v1/v2 Instance:** Still need access to running Traefik v1 (for baseline comparison) and v2 (for development/testing) instances.
- **API Differences:** v2 API is more granular. Requires fetching multiple endpoints (routers, services) instead of one (`/providers`). Data structures are different, necessitating significant frontend refactoring (state, components, search).
- **React Version:** Old React version (v15) might require careful handling during component updates.

## 5. Evolution of Project Decisions

*(This section will track key decisions made during the migration)*

- **[Date]:** Initialized Memory Bank structure.
- **[Date]:** Completed code analysis, confirmed backend proxy role, identified v1 API usage and target v2 endpoints. Decided to modify backend first.
