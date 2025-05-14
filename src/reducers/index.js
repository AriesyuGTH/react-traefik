import { combineReducers } from 'redux';
import * as _ from 'lodash';
import {
  REQUEST_TRAEFIK_DATA,
  RECEIVE_TRAEFIK_ROUTERS,
  RECEIVE_TRAEFIK_SERVICES,
  RECEIVE_TRAEFIK_OVERVIEW,
  RECEIVE_TRAEFIK_ENTRYPOINTS,
  RECEIVE_TRAEFIK_MIDDLEWARES,
  RECEIVE_TRAEFIK_TLS_CERTIFICATES,
  RECEIVE_TRAEFIK_DATA_ERROR,
  REQUEST_CONFIG, RECEIVE_CONFIG, SET_URL, SEARCH, INVALIDATE_DATA
} from '../actions';

// Initial state reflecting v2 structure
const initialDataState = {
  isFetching: false,
  didInvalidate: false,
  configReady: false,
  traefik_url: null,
  routers: null,
  services: null,
  overview: null,
  entrypoints: null,
  middlewares: null,
  tlsCertificates: null,
  search_query: '',
  error: null,
  lastUpdated: null
};

function data(state = initialDataState, action) {
  // var newProviders; // No longer needed
  switch (action.type) {
    // case REQUEST_TRAEFIK_PROVIDERS: // Deprecated v1
    //   return Object.assign({}, state, {
    //     isFetching: true,
    //     didInvalidate: false
    //   })
    case REQUEST_TRAEFIK_DATA: // Renamed for v2
      return Object.assign({}, state, {
        isFetching: true, // Indicate fetching has started
        didInvalidate: false,
        error: null // Clear previous errors
      });
    // case RECEIVE_TRAEFIK_PROVIDERS: // Deprecated v1
    //   newProviders = filterProviders(action.data, state.search_query || '');
    //   return Object.assign({}, state, {
    //     isFetching: false,
    //     didInvalidate: false,
    //     providers: newProviders,
    //     error: false,
    //     fetchedProviders: action.data,
    //     lastUpdatedProviders: action.receivedAt
    //   })
    case RECEIVE_TRAEFIK_ROUTERS:
      return Object.assign({}, state, {
        didInvalidate: false,
        routers: action.routers,
        error: null,
        lastUpdated: action.receivedAt // Routers action sets the primary timestamp
      });
    case RECEIVE_TRAEFIK_SERVICES:
      return Object.assign({}, state, {
        // isFetching will be set to false when all data is processed or on error
        didInvalidate: false,
        services: action.services,
        error: null
      });
    case RECEIVE_TRAEFIK_OVERVIEW:
      return Object.assign({}, state, {
        didInvalidate: false,
        overview: action.overview,
        error: null
      });
    case RECEIVE_TRAEFIK_ENTRYPOINTS:
      return Object.assign({}, state, {
        didInvalidate: false,
        entrypoints: action.entrypoints,
        error: null
      });
    case RECEIVE_TRAEFIK_MIDDLEWARES:
      return Object.assign({}, state, {
        didInvalidate: false,
        middlewares: action.middlewares,
        error: null
      });
    case RECEIVE_TRAEFIK_TLS_CERTIFICATES:
      return Object.assign({}, state, {
        isFetching: false, // Assume this is the last piece of data in the Promise.all
        didInvalidate: false,
        tlsCertificates: action.tlsCertificates,
        error: null
      });
    case RECEIVE_TRAEFIK_DATA_ERROR:
        // When any part of the data fetch fails, set isFetching to false
        return Object.assign({}, state, {
            isFetching: false,
            didInvalidate: true,
            error: action.error,
            lastUpdated: action.receivedAt // Update timestamp even on error
        });
    case REQUEST_CONFIG:
      return Object.assign({}, state, {
        isFetching: true, // Indicate fetching config
        didInvalidate: false,
        error: null // Clear previous errors
      });
    case RECEIVE_CONFIG:
      // Keep existing data like routers/services when config updates, unless error occurs
      return Object.assign({}, state, {
        isFetching: false, // Config fetching done
        configReady: action.data.configReady,
        error: action.data.error || state.error, // Keep existing data error if config success but data failed previously
        traefik_url: action.data.traefik_url || state.traefik_url // Keep existing URL if new one not provided
        // Don't reset routers/services here unless specifically intended
      });
    case SET_URL:
      return Object.assign({}, state, {
        traefik_url: action.data,
        // Reset data when URL changes, as new data will be fetched.
        routers: null,
        services: null,
        overview: null,
        entrypoints: null,
        middlewares: null,
        tlsCertificates: null,
        error: null,
        didInvalidate: true, // Mark data as invalid due to URL change
        configReady: true // Assume ready once URL is set manually
      });
    case SEARCH:
      // Filtering logic will be handled by components/selectors based on the search_query
      return Object.assign({}, state, {
        search_query: action.data
      });
    case INVALIDATE_DATA:
       return Object.assign({}, state, {
           didInvalidate: true,
           // Optionally clear all data fields as well if desired upon manual invalidation
           // routers: null, services: null, overview: null, etc.
           error: null // Optionally clear error when manually invalidating
       });
    default:
      return state;
  }
}

// TODO: Re-implement filtering based on v2 data structure (routers, services)
/*
function filterProviders(oldProviders, query){
    // ... (v1 filtering logic - needs complete rewrite for v2) ...
    // This function is now obsolete and needs replacement.
    // For now, it's commented out. The SEARCH action above only stores the query.
    // Filtering logic should be applied either here (if complex) or in selectors/components.
    return oldProviders; // Temporary: return unfiltered data
}
*/

// Combine all data-related state updates into a single reducer
const traefikData = data; // Renamed function 'data' handles all relevant actions

const rootReducer = combineReducers({
  traefikData // Use the single reducer managing the data slice
});

export default rootReducer;
