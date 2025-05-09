# Technical Context: React Traefik Dashboard v2 API Migration

## 1. Core Technologies

- **Frontend:**
    - React (version to be determined from `package.json`)
    - Redux (for state management)
    - Potentially `react-router` for navigation (to be confirmed)
    - CSS (standard CSS files, no CSS-in-JS or preprocessors immediately apparent)
    - Potentially `fetch` API or `axios` for HTTP requests (to be confirmed)
    - Three.js (for 3D visualization, used in `ThreeJSFlow.js`)
- **Backend (`api/` directory):**
    - Node.js (version to be determined)
    - Express framework
    - `config` npm package for configuration management
- **Build/Development:**
    - npm or yarn (check `package.json` and presence of lock files)
    - Likely Create React App scripts (`react-scripts`) for building and running the frontend dev server.
    - Docker (for containerization)
- **Testing:**
    - Jest (implied by `App.test.js`)
    - Potentially other testing libraries (check `package.json`)
    - Custom test setup in `test/` directory.

## 2. Development Setup (Assumptions)

- **Prerequisites:** Node.js, npm/yarn, Docker (optional, but likely useful).
- **Installation:** Run `npm install` or `yarn install` in the root directory and potentially in the `api/` directory.
- **Running Frontend:** `npm start` or `yarn start` (likely runs `react-scripts start`).
- **Running Backend (`api/`):** `npm start` or node `api/bin/www` (check `package.json` in `api/`).
- **Running Tests:** `npm test` or `yarn test`.
- **Traefik Instance:** Requires a running Traefik v1 instance for the current dashboard, and a v2 instance for testing the migrated version. The API endpoint needs to be configured (likely via `src/Conf.js` or environment variables).

## 3. Technical Constraints & Considerations

- **Browser Compatibility:** Target modern web browsers (specifics TBD).
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
