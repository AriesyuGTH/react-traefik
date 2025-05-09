import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// Updated action import
import { fetchTraefikData, fetchConfigReady, setUrl, search, invalidateData } from '../actions';
import UrlInput from '../components/UrlInput';
import Search from '../components/Search';
import ThreeJSFlow from '../components/ThreeJSFlow'

class AsyncApp extends Component {
  timer = null

  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleSearchChange = this.handleSearchChange.bind(this)
  }

  // Updated function name to reflect v2
  loadData(dispatch, traefik_url) {
    // Call the updated action
    dispatch(fetchTraefikData(traefik_url));
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch(fetchConfigReady())
  }

  componentDidUpdate(prevProps) {
    const { dispatch, traefikData } = this.props;

    // Guard against initial render when traefikData might be undefined
    if (!traefikData) {
      return;
    }

    // Use traditional checks instead of optional chaining for Node v7 compatibility
    const prevTraefikData = prevProps.traefikData; // Get previous data object
    const prevTraefikUrl = prevTraefikData && prevTraefikData.traefik_url; // Check if prevTraefikData exists
    const prevConfigReady = prevTraefikData && prevTraefikData.configReady; // Check if prevTraefikData exists

    const urlChanged = traefikData.traefik_url !== prevTraefikUrl;
    const configJustBecameReady = traefikData.configReady && !prevConfigReady;
    const shouldLoadInitialData = traefikData.configReady && (!traefikData.routers || traefikData.didInvalidate); // Load if ready and no routers yet or invalidated

    // If URL changed or config just became ready, and we should load initial data
    if ((urlChanged || configJustBecameReady) && shouldLoadInitialData) {
        console.log("URL changed or config ready, loading initial data...");
        this.loadData(dispatch, traefikData.traefik_url);
        // Clear existing timer if URL changed
        if (this.timer) {
            window.clearInterval(this.timer);
            delete this.timer;
        }
        // Set up polling timer only if config is ready
        if (traefikData.configReady) {
             this.timer = window.setInterval(() => {
                 console.log("Polling for data...");
                 this.loadData(dispatch, traefikData.traefik_url);
             }, 15000); // Poll every 15 seconds
        }
    }

    // Clear timer if config becomes not ready (e.g., due to error)
    if (!traefikData.configReady && this.timer) {
        console.log("Config not ready, clearing timer.");
        window.clearInterval(this.timer);
        delete this.timer;
    }
  }

  handleChange(next_traefik_url) {
    const { dispatch } = this.props
    dispatch(setUrl(next_traefik_url))
  }

  handleSearchChange(query) {
    const { dispatch } = this.props
    dispatch(search(query))
  }

  // Clear timer on unmount
  componentWillUnmount() {
      if (this.timer) {
          window.clearInterval(this.timer);
      }
  }


  handleChange(next_traefik_url) {
    const { dispatch } = this.props;
    // Setting URL now also invalidates data in the reducer
    dispatch(setUrl(next_traefik_url));
  }

  handleSearchChange(query) {
    const { dispatch } = this.props;
    dispatch(search(query));
    // Note: Actual filtering logic is commented out in reducer for now
  }

  render() {
    // Get data from the mapped traefikData prop
    const { traefikData } = this.props;
    // Destructure needed properties from traefikData, providing defaults
    const {
        traefik_url = null,
        isFetching = false,
        lastUpdated = null, // Use new property name
        routers = null,
        services = null, // Use new property name
        error = null,
        configReady = false,
        search_query = '' // Needed for Search component value
    } = traefikData || {}; // Handle case where traefikData might be null initially

    const hasData = routers && services; // Condition based on v2 data

    return (
    <div>
      <nav className="navbar navbar-toggleable-md navbar-inverse bg-inverse">
        <button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <a className="navbar-brand" href="/">Traefik - diagram</a>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <a className="nav-link" href="https://github.com/guillaumejacquart/react-traefik">Doc</a>
            </li>
          </ul>
          
          {/* Pass traefik_url directly */}
          <UrlInput value={traefik_url} onClick={this.handleChange} />
        </div>
      </nav>
      <div className="container">
        {/* Render Search if data is available */}
        {hasData &&
        <Search value={search_query} onChange={this.handleSearchChange} />
        }
        <p>
          {/* Use lastUpdated */}
          {lastUpdated &&
            <span>
              Last updated at {new Date(lastUpdated).toLocaleTimeString()}.
              {' '}
            </span>
          }
        </p>
        {/* Show loading only if fetching and no data yet */}
        {isFetching && !hasData &&
          <h2>Loading...</h2>
        }
        {/* Show prompt if config not ready and not fetching */}
        {!configReady && !isFetching && !traefik_url &&
          <h3 className="text-center">Fill out your Traefik API URL in the navigation header</h3>
        }
         {/* Show error message if an error exists */}
        {error &&
          <h3 className="text-center text-danger">Error: {typeof error === 'string' ? error : JSON.stringify(error)}</h3>
        }
      </div>
      <div>
         {/* Render visualization if data is available */}
        {hasData &&
          // Pass the whole traefikData object, ThreeJSFlow needs updating too
          <ThreeJSFlow data={traefikData} />
        }
      </div>
    </div>
    )
  }
}

AsyncApp.propTypes = {
  // traefikData contains all the state now
  traefikData: PropTypes.shape({
      isFetching: PropTypes.bool.isRequired,
      lastUpdated: PropTypes.number, // Use new name
      configReady: PropTypes.bool,
      traefik_url: PropTypes.string,
      routers: PropTypes.any, // Adjust type as needed
      services: PropTypes.any, // Adjust type as needed
      error: PropTypes.any,
      didInvalidate: PropTypes.bool,
      search_query: PropTypes.string
  }),
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  // Map the entire traefikData slice to the traefikData prop
  const { traefikData } = state;

  // No need to map individual properties if passing the whole slice
  return {
    traefikData
  };
}

export default connect(mapStateToProps)(AsyncApp);
