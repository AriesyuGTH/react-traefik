# System Patterns: React Traefik Dashboard v2 API Migration

## 1. System Architecture Overview

*(Based on `repomix-output.xml` analysis and current project state)*

- **Frontend:** React application (`src/`) using Create React App (`react-scripts`).
    - **UI Components:** Located in `src/components/` (e.g., `ThreeJSFlow.js`, `Search.js`, `UrlInput.js`).
    - **Containers:** Smart components in `src/containers/` (e.g., `AsyncApp.js`, `Root.js`) connecting UI to Redux.
    - **State Management:** Redux (`src/actions/`, `src/reducers/`, `src/store/`) with `redux-thunk` for async operations.
    - **API Interaction:** Handled within Redux actions (`src/actions/index.js`) using `isomorphic-fetch`, calling the backend proxy.
- **Backend API (`api/`):** Node.js/Express application.
    - **Purpose:** Acts as a proxy to the Traefik API and manages Traefik URL configuration (stored in NeDB via `config/default.json`).
    - **Routes (`api/routes/api.js`):**
        - `GET /api/url`: Retrieves the configured Traefik API URL.
        - `PUT /api/url`: Saves/updates the Traefik API URL.
        - `GET /api/v2/http/routers`: Proxies to Traefik v2 `/api/http/routers`. (Implemented)
        - `GET /api/v2/http/services`: Proxies to Traefik v2 `/api/http/services`. (Implemented)
        - `GET /api/v2/overview`: Proxies to Traefik v2 `/api/overview`. (Implemented)
        - `GET /api/v2/entrypoints`: Proxies to Traefik v2 `/api/entrypoints`. (Implemented)
        - `GET /api/v2/http/middlewares`: Proxies to Traefik v2 `/api/http/middlewares`. (Implemented)
        - `GET /api/v2/tls/certificates`: Proxies to Traefik v2 `/api/tls/certificates`. (Implemented)
- **Configuration:** `config` npm package with `config/default.json` and `config/test.json`.
- **Build/Deployment:** Docker (`Dockerfile`, `docker-compose.yml`) for containerization. `npm run build-front` (via `react-scripts build`) for frontend.

```mermaid
graph TD
    subgraph Frontend (React App - src/)
        UI[UI Components - src/components] --> Containers
        Containers[Containers - src/containers] --> Actions[Redux Actions - src/actions]
        Actions --> Reducers[Redux Reducers - src/reducers]
        Reducers --> ReduxStore[Redux Store - src/store]
        Containers --> ReduxStore
    end

    subgraph Backend_Proxy (Node.js/Express - api/)
        APIRoutes[API Routes - api/routes/api.js] --> AppLogic[App Logic - api/app.js]
        AppLogic --> DBConfig[URL Config (NeDB) - config/]
        
        APIRoutes -- "/api/url" --> DBConfig
        APIRoutes -- "/api/v2/http/routers" --> TraefikAPI_V2_Routers
        APIRoutes -- "/api/v2/http/services" --> TraefikAPI_V2_Services
        APIRoutes -- "/api/v2/overview" --> TraefikAPI_V2_Overview
        APIRoutes -- "/api/v2/entrypoints" --> TraefikAPI_V2_Entrypoints
        APIRoutes -- "/api/v2/http/middlewares" --> TraefikAPI_V2_Middlewares
        APIRoutes -- "/api/v2/tls/certificates" --> TraefikAPI_V2_TLS
    end

    subgraph Traefik_Instance (Traefik v2)
        TraefikAPI_V2_Routers["/api/http/routers"]
        TraefikAPI_V2_Services["/api/http/services"]
        TraefikAPI_V2_Overview["/api/overview"]
        TraefikAPI_V2_Entrypoints["/api/entrypoints"]
        TraefikAPI_V2_Middlewares["/api/http/middlewares"]
        TraefikAPI_V2_TLS["/api/tls/certificates"]
    end

    UserBrowser[User Browser] --> Frontend
    Frontend -- HTTP Requests --> Backend_Proxy
    
    %% Style for implemented
    style TraefikAPI_V2_Routers fill:#ccffcc,stroke:#333,stroke-width:2px
    style TraefikAPI_V2_Services fill:#ccffcc,stroke:#333,stroke-width:2px
    style TraefikAPI_V2_Overview fill:#ccffcc,stroke:#333,stroke-width:2px
    style TraefikAPI_V2_Entrypoints fill:#ccffcc,stroke:#333,stroke-width:2px
    style TraefikAPI_V2_Middlewares fill:#ccffcc,stroke:#333,stroke-width:2px
    style TraefikAPI_V2_TLS fill:#ccffcc,stroke:#333,stroke-width:2px
```

*(Diagram and description updated to reflect that all backend proxy routes are implemented.)*

## 2. Key Technical Decisions (Current)

- **Framework:** React (v16.14.0) for the frontend.
- **State Management:** Redux with `redux-thunk`.
- **Backend:** Node.js/Express for API proxy and URL configuration.
- **Styling:** Standard CSS files.
- **Visualization:** D3.js (v4) integrated into `ThreeJSFlow.js` React component via a custom `Tree` class.
- **API Client:** `isomorphic-fetch`.

## 3. Design Patterns

- **Container/Presentational Component Pattern:** Evident from `src/components/` vs `src/containers/`.
- **Action-Reducer Pattern:** Core of Redux implementation.
- **Proxy Pattern:** Backend API acts as a proxy to the Traefik API.
- **Module Pattern:** Used in Node.js backend.

## 4. Component Relationships (High-Level)

- `Root.js` initializes the Redux Provider.
- `AsyncApp.js` is the main application container, managing API calls via Redux actions and passing data to presentational components.
- `UrlInput.js` allows users to set the Traefik API URL, which is persisted by the backend.
- `Search.js` provides filtering capabilities for the displayed Traefik data.
- `ThreeJSFlow.js` is responsible for rendering the D3.js visualization of Traefik data (all v2 data types are now being integrated).

## 5. Critical Implementation Paths (Current & Next Steps)

- **Backend API Proxy (Completed):**
    - All routes in `api/routes/api.js` for `/overview`, `/entrypoints`, `/http/middlewares`, `/tls/certificates`, `/http/routers`, and `/http/services` are implemented.
- **Frontend Data Integration (Completed for Actions & Reducers, Component Integration in Progress):**
    - **Actions (`src/actions/index.js` - Completed):** Action types and creators for all v2 data types are implemented.
    - **Reducers (`src/reducers/index.js` - Completed):** Reducers store all v2 data types in the Redux state.
    - **Components (`src/components/ThreeJSFlow.js`, etc. - In Progress/Refinement):** Components are being updated to consume and visualize/display all v2 data. Filtering logic is also being adapted.
- **Configuration (`src/Conf.js`):** `API_URL` is empty, relying on relative paths to the backend proxy. Traefik URL itself is managed via `GET/PUT /api/url`. This setup is stable.
- **Data Transformation & Consumption:** Data from Traefik v2 API (via backend proxy) is processed in Redux actions/reducers and consumed by React components. This pattern will be extended for new data types.
