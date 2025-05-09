# System Patterns: React Traefik Dashboard v2 API Migration

## 1. System Architecture Overview

*(Based on initial file structure analysis)*

- **Frontend:** React application (`src/`) likely built using Create React App (judging by `App.js`, `index.js`, `public/index.html`).
    - **UI Components:** Located in `src/components/`.
    - **Containers:** Smart components connecting UI to state/logic in `src/containers/`.
    - **State Management:** Redux (`src/actions/`, `src/reducers/`, `src/store/`).
    - **API Interaction:** Likely handled within Redux actions or dedicated service modules (to be confirmed).
- **Backend API (`api/`):** Node.js/Express application (judging by `api/app.js`, `api/routes/`, `api/bin/www`).
    - **Purpose:** Unknown. Could be:
        - A proxy to the actual Traefik v1 API.
        - A mock server for development/testing.
        - Serving unrelated backend functionality.
    - **Routes:** Defines API endpoints in `api/routes/`.
- **Configuration:** Handled via `config/` files (e.g., `default.json`, `test.json`), likely using the `config` npm package.
- **Build/Deployment:** Dockerfile suggests containerization is used or intended.

```mermaid
graph TD
    subgraph Frontend (React App - src/)
        UI[UI Components - src/components]
        Containers[Containers - src/containers]
        Redux[Redux Store - src/store]
        Actions[Actions - src/actions]
        Reducers[Reducers - src/reducers]

        UI --> Containers
        Containers --> Actions
        Actions --> Reducers
        Reducers --> Redux
        Containers --> Redux
    end

    subgraph Backend (Node.js/Express - api/)
        Routes[Routes - api/routes]
        AppJS[App Logic - api/app.js]
        Config[Config - config/]

        Routes --> AppJS
        AppJS --> Config
    end

    subgraph Traefik
        TraefikAPI_V1["Traefik API v1 (/api/providers)"]
        TraefikAPI_V2["Traefik API v2 (/api/overview, /api/http/routers, /api/http/services, etc.)"]
    end

    User[User Browser] --> Frontend
    Frontend --> BackendAPI[Backend API (api/)]
    BackendAPI -- Proxies --> TraefikAPI_V1
    %% BackendAPI -- Will Proxy --> TraefikAPI_V2 %% (Target State)

    %% Dashed lines indicate uncertainty or potential paths
    %% style BackendAPI fill:#f9f,stroke:#333,stroke-width:2px,color:#000
    %% linkStyle 2 stroke:#f9f,stroke-width:2px,color:#f9f;
    %% linkStyle 4 stroke:#f9f,stroke-width:2px,color:#f9f;

```

*(Diagram updated to reflect backend proxy role)*

## 2. Key Technical Decisions (Pre-Migration)

- **Framework:** React for the frontend.
- **State Management:** Redux.
- **Backend (if applicable):** Node.js/Express.
- **Styling:** CSS files (`App.css`, `index.css`).
- **Visualization:** Potentially Three.js (`src/components/ThreeJSFlow.js`) and a Tree component (`src/components/Tree.js`).

## 3. Design Patterns (To Be Discovered/Confirmed)

- Container/Presentational Component pattern (suggested by `components/` vs `containers/`).
- Action-Reducer pattern (Redux).
- Module pattern (Node.js).
- Potentially others (e.g., Factory, Singleton) within specific components or backend logic.

## 4. Component Relationships (High-Level)

- `Root.js` likely sets up the Redux Provider and routing.
- `AsyncApp.js` might be the main application container managing asynchronous operations (like API calls).
- Components like `Search.js`, `Tree.js`, `ThreeJSFlow.js` provide specific UI views/functionality.
- `UrlInput.js` likely handles user input for the Traefik API endpoint.

## 5. Critical Implementation Paths (Focus for Migration)

- **API Call Logic:** Frontend calls backend (`/api/...`) which proxies to Traefik. Currently proxies `GET /api/providers` to Traefik v1 `/api/providers`. Also handles `GET/PUT /api/url`.
- **Data Transformation:** v1 API response (`/api/providers`) is processed in Redux reducers (`src/reducers/index.js`), including search filtering (`filterProviders`).
- **Component Data Consumption:** Components read the v1-structured data (`providers`, `backends`, `frontends`) from the Redux store.
- **Configuration (`src/Conf.js`):** `API_URL` is empty, relying on relative paths and the CRA proxy / backend static serving. Traefik URL itself is managed via `GET/PUT /api/url` and stored in backend DB/discovered via Docker.
- **Target v2 API Endpoints:** `/api/http/routers`, `/api/http/services`, `/api/entrypoints`, `/api/overview`.
