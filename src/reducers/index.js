import { combineReducers } from 'redux';
import * as _ from 'lodash';
import {
  // REQUEST_TRAEFIK_PROVIDERS, RECEIVE_TRAEFIK_PROVIDERS, // v1 Deprecated
  REQUEST_TRAEFIK_DATA, RECEIVE_TRAEFIK_ROUTERS, RECEIVE_TRAEFIK_SERVICES, RECEIVE_TRAEFIK_DATA_ERROR, // v2 New
  REQUEST_CONFIG, RECEIVE_CONFIG, SET_URL, SEARCH, INVALIDATE_DATA // Others
} from '../actions';

// Initial state reflecting v2 structure
const initialDataState = {
  isFetching: false,
  didInvalidate: false,
  configReady: false,
  traefik_url: null,
  routers: null, // Changed from providers/fetchedProviders
  services: null, // New for v2
  search_query: '',
  error: null, // Store general or data fetching errors
  lastUpdated: null // Single timestamp for last successful fetch
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
    case RECEIVE_TRAEFIK_ROUTERS: // New v2
      // TODO: Apply filtering if needed, for now store directly
      // let filteredRouters = filterRouters(action.routers, state.search_query);
      return Object.assign({}, state, {
        // isFetching: false, // Keep fetching until services also arrive? Or set here? Let's set on last action (services)
        didInvalidate: false,
        routers: action.routers, // Store raw routers data
        // filteredRouters: filteredRouters, // Store filtered routers if implementing filtering here
        error: null, // Clear error on successful receive
        lastUpdated: action.receivedAt // Set timestamp on first successful data piece
      });
    case RECEIVE_TRAEFIK_SERVICES: // New v2
       // TODO: Apply filtering if needed
       // let filteredServices = filterServices(action.services, state.search_query);
      return Object.assign({}, state, {
        isFetching: false, // Set fetching to false now that both parts arrived (assuming routers came first)
        didInvalidate: false,
        services: action.services, // Store raw services data
        // filteredServices: filteredServices,
        error: null // Clear error on successful receive
      });
     case RECEIVE_TRAEFIK_DATA_ERROR: // New v2
        return Object.assign({}, state, {
            isFetching: false,
            didInvalidate: true, // Indicate data might be stale/incomplete
            error: action.error, // Store the error message
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
        // Reset data when URL changes? Yes, likely need to refetch.
        routers: null,
        services: null,
        // filteredRouters: null,
        // filteredServices: null,
        error: null,
        didInvalidate: true, // Mark data as invalid due to URL change
        configReady: true // Assume ready once URL is set manually
      });
    case SEARCH:
      // TODO: Re-implement search based on v2 structure (routers, services)
      // For now, just store the query. Filtering needs to happen elsewhere or be re-implemented.
      // let filteredRouters = filterRouters(state.routers, action.data);
      // let filteredServices = filterServices(state.services, action.data);
      return Object.assign({}, state, {
        search_query: action.data
        // filteredRouters: filteredRouters,
        // filteredServices: filteredServices
      });
    case INVALIDATE_DATA:
       return Object.assign({}, state, {
           didInvalidate: true,
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
