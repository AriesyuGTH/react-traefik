import fetch from 'isomorphic-fetch'
import { API_URL } from '../Conf'

export const REQUEST_CONFIG = 'REQUEST_CONFIG'
export const RECEIVE_CONFIG = 'RECEIVE_CONFIG'
export const SET_URL = 'SET_URL'
export const REQUEST_TRAEFIK_DATA = 'REQUEST_TRAEFIK_DATA' // Renamed from REQUEST_TRAEFIK_PROVIDERS
export const RECEIVE_TRAEFIK_ROUTERS = 'RECEIVE_TRAEFIK_ROUTERS' // New for v2
export const RECEIVE_TRAEFIK_SERVICES = 'RECEIVE_TRAEFIK_SERVICES' // New for v2
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
    // receivedAt: Date.now() // Routers action will set the timestamp
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


// New function to fetch v2 data (routers and services concurrently)
function fetchTraefikV2Data(dispatch) {
  const fetchRouters = fetch(`${API_URL}/api/v2/http/routers`).then(response => {
      if (!response.ok) { throw new Error(`HTTP error ${response.status} fetching routers`); }
      return response.json();
  });
  const fetchServices = fetch(`${API_URL}/api/v2/http/services`).then(response => {
      if (!response.ok) { throw new Error(`HTTP error ${response.status} fetching services`); }
      return response.json();
  });

  return Promise.all([fetchRouters, fetchServices])
    .then(([routersJson, servicesJson]) => {
      // Dispatch actions for both routers and services
      // Use routers action to set the lastUpdated timestamp
      dispatch(receiveTraefikRouters(routersJson));
      dispatch(receiveTraefikServices(servicesJson));
    })
    .catch(error => {
      console.error("Error fetching Traefik v2 data:", error);
      // Dispatch a specific error action for data fetching failure
      dispatch(receiveTraefikDataError(error.message || 'Failed to fetch Traefik v2 data'));
       // Also update config state to reflect the error
       dispatch(receiveConfig({
            configReady: false, // Indicate config is not ready due to error
            error: error.message || 'Failed to fetch Traefik v2 data'
        }));
    });
}
