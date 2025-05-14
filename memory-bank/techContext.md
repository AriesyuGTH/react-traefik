# Technical Context: React Traefik Dashboard v2 API Migration

## 1. Core Technologies

- **Frontend:**
    - React (`react: "^16.14.0"` as per `package.json`)
    - Redux (`redux: "^4.2.0"`, `react-redux: "^5.0.4"`) for state management.
    - `redux-thunk` for asynchronous actions.
    - `isomorphic-fetch` for HTTP requests.
    - D3.js (`d3: "^4.8.0"`) for visualization, integrated into `ThreeJSFlow.js`.
    - Standard CSS.
- **Backend (`api/` directory):**
    - Node.js (Dockerfile uses `node:18-alpine`).
    - Express (`express: "~4.15.2"`).
    - `config` npm package for configuration management.
    - `nedb` for simple database (URL persistence).
    - `request` for proxying HTTP requests.
    - `dockerode` for Docker interaction (automatic URL discovery).
- **Build/Development:**
    - npm (based on `package-lock.json` and scripts in `package.json`).
    - Create React App scripts (`react-scripts: "4.0.3"`) for frontend build (`build-front`) and dev server (`start-front`).
    - Docker (`Dockerfile`, `docker-compose.yml`) for containerization of the application and a test Traefik v2 instance.
- **Testing:**
    - Mocha (`mocha: "^3.4.1"`) with Chai (`chai: "^3.5.0"`, `chai-http: "^3.0.0"`) for backend API tests (`test/test.js`).
    - Jest (via `react-scripts test --env=jsdom`) for frontend component tests (e.g., `App.test.js`).

## 2. Development Setup (Confirmed & Assumptions)

- **Prerequisites:** Node.js (v18 recommended), npm, Docker.
- **Git Repository:** `https://github.com/AriesyuGTH/react-traefik.git` (Actual remote URL used for push).
- **Installation:** Run `npm install` in the root directory. The `api/` directory does not have its own `package.json`, so root-level install covers backend dependencies too.
- **Running Application (Docker Compose - Recommended for Integrated Testing):**
    - `docker-compose up --build` will build and run both the `app` (React frontend + Node.js backend proxy) and a `traefik` v2 service.
    - The application will be accessible at `http://localhost:3001`.
    - Traefik API (for the test instance) is at `http://traefik:8080` (internally within Docker network) or potentially `http://localhost:8080` if port is exposed from `docker-compose.yml`.
- **Running Frontend (Standalone):** `npm run start-front` (runs `react-scripts start` on port 3000, proxies to backend on 3001).
- **Running Backend (Standalone):** `npm run start-api` (runs `node ./api/bin/www` on port 3001).
- **Running Tests:**
    - Backend API tests: `npm test` (runs Mocha tests).
    - Frontend tests: `npm run test-front` (runs Jest tests).
- **Traefik Instance:**
    - For development and testing, `docker-compose.yml` provides a Traefik v2.10 instance.
    - The application's backend can auto-detect Traefik URL if running in Docker with socket mounted, or URL can be manually set via UI.

## 3. Technical Constraints & Considerations

- **Browser Compatibility:** Target modern web browsers. (Specifics still TBD, but React 16 has good compatibility).
- **API Rate Limiting:** Be mindful of potential rate limits on the Traefik API, especially if using polling.
- **Data Volume:** Traefik API responses can be large. Efficient data handling and rendering are important.
- **Authentication/Authorization:** How does the dashboard authenticate with the Traefik API? (v1 might be unauthenticated by default, v2 might have options). Needs investigation.
- **CORS:** Cross-Origin Resource Sharing might be a factor if the dashboard is served from a different domain/port than the Traefik API. The backend (`api/`) might be acting as a CORS proxy.

## 4. Dependencies (High-Level - Check `package.json` for specifics)

- **Frontend:** `react`, `react-dom`, `redux`, `react-redux`, `redux-thunk` (likely), `three`, potentially `axios`, `react-router-dom`.
- **Backend (`api/`):** `express`, `config`, `morgan`, `debug`, potentially `cors`, `node-fetch` or `axios`.

## 5. Tool Usage Patterns (To Be Discovered)

- Linting/Formatting tools (e.g., ESLint, Prettier).
- Specific debugging techniques used.
- Deployment scripts or CI/CD setup (if any).
