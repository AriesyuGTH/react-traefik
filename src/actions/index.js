import fetch from 'isomorphic-fetch'
import { API_URL } from '../Conf'

export const REQUEST_CONFIG = 'REQUEST_CONFIG'
export const RECEIVE_CONFIG = 'RECEIVE_CONFIG'
export const SET_URL = 'SET_URL'
export const REQUEST_TRAEFIK_DATA = 'REQUEST_TRAEFIK_DATA' // Renamed from REQUEST_TRAEFIK_PROVIDERS
export const RECEIVE_TRAEFIK_ROUTERS = 'RECEIVE_TRAEFIK_ROUTERS' // New for v2
export const RECEIVE_TRAEFIK_SERVICES = 'RECEIVE_TRAEFIK_SERVICES' // New for v2
export const RECEIVE_TRAEFIK_OVERVIEW = 'RECEIVE_TRAEFIK_OVERVIEW' // New for v2
export const RECEIVE_TRAEFIK_ENTRYPOINTS = 'RECEIVE_TRAEFIK_ENTRYPOINTS' // New for v2
export const RECEIVE_TRAEFIK_MIDDLEWARES = 'RECEIVE_TRAEFIK_MIDDLEWARES' // New for v2
export const RECEIVE_TRAEFIK_TLS_CERTIFICATES = 'RECEIVE_TRAEFIK_TLS_CERTIFICATES' // New for v2
export const RECEIVE_TRAEFIK_DATA_ERROR = 'RECEIVE_TRAEFIK_DATA_ERROR' // New for v2 errors
// export const RECEIVE_TRAEFIK_PROVIDERS = 'RECEIVE_TRAEFIK_PROVIDERS' // Deprecated v1
export const INVALIDATE_DATA = 'INVALIDATE_DATA'
export const SEARCH = 'SEARCH'

export function invalidateData() {
  return {
    type: INVALIDATE_DATA
  }
}

function requestConfig() {
  return {
    type: REQUEST_CONFIG
  }
}

function receiveConfig(json) {
  return {
    type: RECEIVE_CONFIG,
    data: json
  }
}

// Renamed from requestTraefikProviders
function requestTraefikData() {
  return {
    type: REQUEST_TRAEFIK_DATA
  }
}

// Deprecated v1
// function receiveTraefikProviders(json) {
//   return {
//     type: RECEIVE_TRAEFIK_PROVIDERS,
//     data: json,
//     receivedAt: Date.now()
//   }
// }

// New for v2 routers
function receiveTraefikRouters(json) {
  return {
    type: RECEIVE_TRAEFIK_ROUTERS,
    routers: json,
    receivedAt: Date.now() // Use a single timestamp for related data
  }
}

// New for v2 services
function receiveTraefikServices(json) {
  return {
    type: RECEIVE_TRAEFIK_SERVICES,
    services: json,
    // receivedAt: Date.now() // Main data action will set the timestamp
  }
}

// New for v2 overview
function receiveTraefikOverview(json) {
  return {
    type: RECEIVE_TRAEFIK_OVERVIEW,
    overview: json,
  }
}

// New for v2 entrypoints
function receiveTraefikEntrypoints(json) {
  return {
    type: RECEIVE_TRAEFIK_ENTRYPOINTS,
    entrypoints: json,
  }
}

// New for v2 middlewares
function receiveTraefikMiddlewares(json) {
  return {
    type: RECEIVE_TRAEFIK_MIDDLEWARES,
    middlewares: json,
  }
}

// New for v2 TLS certificates
function receiveTraefikTlsCertificates(json) {
  return {
    type: RECEIVE_TRAEFIK_TLS_CERTIFICATES,
    tlsCertificates: json,
  }
}

// New for v2 errors during data fetch
function receiveTraefikDataError(error) {
    return {
        type: RECEIVE_TRAEFIK_DATA_ERROR,
        error: error,
        receivedAt: Date.now()
    }
}

export function setUrl(url) {
  return dispatch => {
    return dispatch({
      type: SET_URL,
      data: url
    })
  }
}

export function search(query) {
  return dispatch => {
    return dispatch({
      type: SEARCH,
      data: query
    })
  }
}

export function fetchConfigReady() {
  return dispatch => {
    dispatch(requestConfig())
    return fetch(`${API_URL}/api/url`)
      .then(response => response.json())
      .then((json) => {
        if (json.status === 'ok') {
          return dispatch(receiveConfig({
            configReady: true,
            traefik_url: json.url
          }));
        }
        return dispatch(receiveConfig({
          configReady: false,
          error: json
        }));
      })
      .catch(function (error) {
        dispatch(receiveConfig({
          configReady: false,
          error: error
        }))
      });
  }
}

// Renamed and modified for v2
export function fetchTraefikData(traefik_url) {
  return dispatch => {
    dispatch(requestTraefikData())
    return fetch(`${API_URL}/api/url`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: traefik_url
      })
    })
      .then(response => response.json())
      .then((json) => {
        if (json.status === 'ok') {
          // URL saved successfully, now fetch v2 data
          return fetchTraefikV2Data(dispatch);
        }
        // If saving URL fails, dispatch an error
        const error = new Error(json.message || 'Failed to save Traefik URL');
        dispatch(receiveTraefikDataError(error.message)); // Dispatch specific data error
        // Also update config state if needed, similar to original catch block
        dispatch(receiveConfig({
            configReady: false, // Indicate config is not ready due to error
            error: error.message
        }));
        throw error; // Propagate error to stop further execution if necessary
      })
      .catch(function (error) {
        // Catch errors from PUT /api/url or fetchTraefikV2Data
        console.error("Error in fetchTraefikData chain:", error);
        // Ensure a generic error state is set if not already handled
        if (error.type !== RECEIVE_TRAEFIK_DATA_ERROR) {
             dispatch(receiveTraefikDataError(error.message || 'Unknown error fetching Traefik data'));
        }
        // Also update config state if needed
         dispatch(receiveConfig({
            configReady: false, // Indicate config is not ready due to error
            error: error.message || 'Unknown error during Traefik data fetch process'
        }));
      });
  }
}


// Updated function to fetch all necessary v2 data concurrently
function fetchTraefikV2Data(dispatch) {
  const endpoints = {
    routers: `${API_URL}/api/v2/http/routers`,
    services: `${API_URL}/api/v2/http/services`,
    overview: `${API_URL}/api/v2/overview`,
    entrypoints: `${API_URL}/api/v2/entrypoints`,
    middlewares: `${API_URL}/api/v2/http/middlewares`,
    tlsCertificates: `${API_URL}/api/v2/tls/certificates`
  };

  const fetchPromises = Object.entries(endpoints).map(([key, url]) => {
    return fetch(url).then(response => {
      if (!response.ok) { throw new Error(`HTTP error ${response.status} fetching ${key} from ${url}`); }
      return response.json().then(data => ({ key, data })); // Tag data with its key
    });
  });

  return Promise.all(fetchPromises)
    .then(results => {
      // results is an array of {key, data} objects
      // Dispatch actions for each piece of data
      // The first successful data piece (e.g., routers) will set the lastUpdated timestamp
      let timestampSet = false;
      results.forEach(result => {
        switch (result.key) {
          case 'routers':
            dispatch(receiveTraefikRouters(result.data));
            timestampSet = true; // Assuming routers is always fetched and sets the primary timestamp
            break;
          case 'services':
            dispatch(receiveTraefikServices(result.data));
            break;
          case 'overview':
            dispatch(receiveTraefikOverview(result.data));
            break;
          case 'entrypoints':
            dispatch(receiveTraefikEntrypoints(result.data));
            break;
          case 'middlewares':
            dispatch(receiveTraefikMiddlewares(result.data));
            break;
          case 'tlsCertificates':
            dispatch(receiveTraefikTlsCertificates(result.data));
            break;
          default:
            console.warn("Unknown data key received:", result.key);
        }
      });
    })
    .catch(error => {
      console.error("Error fetching Traefik v2 data:", error);
      dispatch(receiveTraefikDataError(error.message || 'Failed to fetch Traefik v2 data'));
      dispatch(receiveConfig({
        configReady: false,
        error: error.message || 'Failed to fetch Traefik v2 data'
      }));
    });
}
