# Product Context: React Traefik Dashboard v2 API Migration

## 1. Problem Solved

The current React dashboard provides a visual interface for monitoring Traefik v1 instances. However, Traefik has evolved, and v2 introduced significant changes, including a new API structure. Users running Traefik v2 cannot use the existing dashboard effectively, lacking visibility into their modern Traefik deployments. This project addresses that gap by updating the dashboard to be compatible with the Traefik v2 API.

## 2. Target Audience

- Developers and Operations personnel who use Traefik v2 as their edge router/load balancer.
- Users of the previous v1 dashboard who have upgraded or plan to upgrade their Traefik instances.

## 3. How it Should Work (Post-Migration)

- The dashboard should connect to a specified Traefik v2 API endpoint.
- It should fetch and display key information available through the v2 API, such as:
    - Entrypoints
    - Routers (including middleware and services)
    - Services (including server status)
    - Middleware configurations
    - TLS Certificates
    - Traefik instance health/status overview.
- The user interface should present this information clearly and intuitively, similar to the v1 dashboard's intent but reflecting v2 concepts.
- Data fetching should be efficient, potentially using polling or other mechanisms suitable for real-time monitoring.
- Error handling should gracefully manage API connection issues or unexpected data formats.

## 4. User Experience Goals

- **Clarity:** Information should be presented in a way that is easy to understand for users familiar with Traefik v2 concepts.
- **Responsiveness:** The UI should feel responsive, even when handling potentially large amounts of data from the API.
- **Reliability:** The dashboard should reliably reflect the state of the connected Traefik v2 instance.
- **Ease of Use:** Connecting to a Traefik instance and navigating the dashboard should be straightforward.

## 5. Key Features (Mapping v1 to v2)

*(Mapping based on initial analysis - requires further refinement as UI components are analyzed)*

- **Displaying Frontends/Backends/Servers (v1 `/api/providers`):**
    - Mapped to **v2 `/api/http/routers`**: Provides routing rules, entrypoints, middleware, and the target service. (Analogous to v1 Frontends + linking).
    - Mapped to **v2 `/api/http/services`**: Provides load balancing configuration and server details (IPs, ports, status). (Analogous to v1 Backends + Servers).
    - Mapped to **v2 `/api/entrypoints`**: Provides information about listening ports.
    - Mapped to **v2 `/api/overview`**: Provides general health and status.
- **Search Functionality:** Needs to be adapted to search across v2 routers, services, and potentially entrypoints based on the new data structures.
- **URL Configuration:** Handled by backend `GET/PUT /api/url`, likely requires minimal changes unless v2 API default port/path differs significantly.
