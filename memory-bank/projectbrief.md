# Project Brief: React Traefik Dashboard v2 API Migration

## 1. Project Goal

The primary goal of this project is to update the existing React-based Traefik dashboard to utilize the Traefik v2 API instead of the currently implemented v1 API. This involves identifying all v1 API interactions within the codebase and replacing them with their corresponding v2 equivalents.

## 2. Core Requirements

- **API Migration:** Replace all Traefik v1 API calls with Traefik v2 API calls.
- **Functionality Preservation:** Ensure all existing dashboard features (e.g., viewing services, routers, health checks) continue to function correctly with the v2 API.
- **Compatibility:** The updated dashboard should be compatible with Traefik v2.x versions.
- **Maintainability:** The updated code should follow best practices for clarity and ease of future maintenance.

## 3. Scope

- **In Scope:**
    - Analysis of existing code to identify v1 API endpoints used.
    - Researching Traefik v2 API documentation for equivalent endpoints and data structures.
    - Refactoring React components and API interaction logic (e.g., actions, reducers, API service files) to use the v2 API.
    - Testing the dashboard against a Traefik v2 instance to ensure functionality.
- **Out of Scope:**
    - Adding new features not present in the original dashboard.
    - Major UI/UX redesigns unrelated to the API migration.
    - Support for Traefik versions other than v2.x.
    - Backend API changes (assuming the `api/` directory serves a different purpose or is a mock).

## 4. Key Stakeholders

- Development Team (Cline & User)

## 5. Success Metrics

- All dashboard features function as expected when connected to a Traefik v2 instance.
- No remaining Traefik v1 API calls in the frontend codebase.
- Codebase is updated and follows modern React practices where applicable during the refactoring.
