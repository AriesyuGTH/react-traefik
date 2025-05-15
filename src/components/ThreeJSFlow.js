import React, { Component } from 'react';
import _ from 'lodash';
import Tree from './Tree';
// Import only selectAll and select from d3-selection instead of the whole d3 library
import { selectAll, select } from 'd3-selection';


export default class ThreeJSFlow extends Component {

  loadData(props) {
    // Access v2 data and search query from props.data (passed from AsyncApp)
    const { 
      routers: originalRouters, 
      services: originalServices, 
      overview: originalOverview,
      entrypoints: originalEntrypoints,
      middlewares: originalMiddlewares,
      tlsCertificates: originalTlsCertificates,
      search_query 
    } = props.data;

    // Clear SVG and check if data is available
    // Use the imported selectAll directly
    selectAll('#d3-flow-svg *').remove();
    if (!originalRouters || !originalServices) { // Keep this check for now, expand later
      console.warn("Core routers or services data not available for visualization.");
      return;
    }

    // --- Apply Filtering based on search_query ---
    let routers = originalRouters || {};
    let services = originalServices || {};
    let overview = originalOverview || {}; // Initialize even if null/undefined
    let entrypoints = originalEntrypoints || {};
    let middlewares = originalMiddlewares || {};
    let tlsCertificates = originalTlsCertificates || []; // Assuming array for certs
    const query = search_query ? search_query.toLowerCase() : '';
    let matchedServiceKeys = new Set();
    let someDataMatched = false; // Flag to check if any data type matched

    if (query) {
        console.log("Applying filter:", query);

        // Filter Services
        const filteredServices = {};
        if (originalServices) {
            Object.values(originalServices).forEach(service => {
                const serviceKey = `${service.name}@${service.provider}`;
                let match = false;
                if (service.name && service.name.toLowerCase().includes(query)) match = true;
                if (!match && service.provider && service.provider.toLowerCase().includes(query)) match = true;
                if (!match && service.type === 'loadbalancer' && service.loadBalancer && service.loadBalancer.servers) {
                    if (service.loadBalancer.servers.some(server => server.address && server.address.toLowerCase().includes(query))) {
                        match = true;
                    }
                }
                if (!match && service.serverStatus) {
                    if (Object.values(service.serverStatus).some(status => status && status.toLowerCase().includes(query))) {
                        match = true;
                    }
                }
                if (match) {
                    filteredServices[serviceKey] = service;
                    matchedServiceKeys.add(serviceKey);
                    someDataMatched = true;
                }
            });
        }
        services = filteredServices;

        // Filter Routers
        const filteredRouters = {};
        if (originalRouters) {
            Object.values(originalRouters).forEach(router => {
                const routerKey = `${router.name}@${router.provider}`;
                const serviceKey = router.service ? `${router.service}@${router.provider}` : null;
                let match = false;
                if (router.name && router.name.toLowerCase().includes(query)) match = true;
                if (!match && router.provider && router.provider.toLowerCase().includes(query)) match = true;
                if (!match && router.rule && router.rule.toLowerCase().includes(query)) match = true;
                if (!match && router.entryPoints && router.entryPoints.some(ep => ep && ep.toLowerCase().includes(query))) match = true;
                if (!match && serviceKey && matchedServiceKeys.has(serviceKey)) match = true;
                if (!match && serviceKey && services[serviceKey]) match = true; // Check against already filtered services

                if (match) {
                    filteredRouters[routerKey] = router;
                    if (serviceKey && originalServices && originalServices[serviceKey] && !services[serviceKey]) {
                        services[serviceKey] = originalServices[serviceKey]; // Add back if router matched
                        matchedServiceKeys.add(serviceKey);
                    } else if (serviceKey) {
                        matchedServiceKeys.add(serviceKey);
                    }
                    someDataMatched = true;
                }
            });
        }
        routers = filteredRouters;
        
        // Ensure services linked by the final list of filtered routers are included
        if (originalServices) {
            Object.values(routers).forEach(router => {
                const serviceKey = router.service ? `${router.service}@${router.provider}` : null;
                if (serviceKey && originalServices[serviceKey] && !services[serviceKey]) {
                    services[serviceKey] = originalServices[serviceKey];
                }
            });
        }

        // Filter Entrypoints (Example: by name or address)
        const filteredEntrypoints = {};
        if(originalEntrypoints){
            Object.entries(originalEntrypoints).forEach(([key, ep]) => {
                let match = false;
                if (key.toLowerCase().includes(query)) match = true;
                if (!match && ep.address && ep.address.toLowerCase().includes(query)) match = true;
                if (match) {
                    filteredEntrypoints[key] = ep;
                    someDataMatched = true;
                }
            });
        }
        entrypoints = filteredEntrypoints;

        // Filter Middlewares (Example: by name or type)
        const filteredMiddlewares = {};
        if(originalMiddlewares){
            Object.entries(originalMiddlewares).forEach(([key, mw]) => {
                const mwName = key.substring(0, key.lastIndexOf('@')); // Extract name before @provider
                const mwProvider = key.substring(key.lastIndexOf('@') + 1);
                let match = false;
                if (mwName.toLowerCase().includes(query)) match = true;
                if (!match && mwProvider.toLowerCase().includes(query)) match = true;
                // Add more specific middleware type checks if needed, e.g., mw.stripPrefix, mw.addHeaders
                if (match) {
                    filteredMiddlewares[key] = mw;
                    someDataMatched = true;
                }
            });
        }
        middlewares = filteredMiddlewares;
        
        // Filter TLS Certificates (Example: by SANs)
        const filteredTlsCertificates = [];
        if(originalTlsCertificates) {
            originalTlsCertificates.forEach(cert => {
                let match = false;
                if (cert.sans && cert.sans.some(san => san.toLowerCase().includes(query))) match = true;
                if (match) {
                    filteredTlsCertificates.push(cert);
                    someDataMatched = true;
                }
            });
        }
        tlsCertificates = filteredTlsCertificates;
        
        // Overview data is usually small, decide if/how to filter or always show
        // For now, overview is not explicitly filtered but will be passed through.
        // If query is active and nothing matched, then we show "No results"
        if (query && !someDataMatched) {
             console.log("Filtering resulted in no matching data across all types.");
             select("#d3-flow-svg").append("text")
                .attr("x", 450).attr("y", 50).attr("text-anchor", "middle")
                .text(`No results found for "${query}"`);
            return;
        }


    } else {
        // No query, use original data (already assigned above)
    }

    // Check again if core data for visualization is empty after potential filtering
    if (Object.keys(routers).length === 0 && Object.keys(services).length === 0 && !query) { // Only show this if no query and still no data
        console.log("No routers or services data to display (even without filter).");
        // Optionally display a message on the SVG
        // Use the imported select directly
        select("#d3-flow-svg").append("text")
            .attr("x", 450) // Center horizontally (approx)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .text(`No results found for "${query}"`);
        return;
    }

    // --- Prepare v2 Data Structures ---
    // Overview Info removed from direct display as per design adjustment
    
    var traefikSideData = {
      name: "Traefik Instance", 
      hasDetails: true,
      details: overview && overview.version ? `Version: ${overview.version}` : "Traefik Core",
      children: [],
      image: { src: 'images/traefik.png', width: 100, height: 100 },
      className: 'traefik-root'
    };

    var internetSideData = {
      name: "Internet / Entrypoints",
      hasDetails: false,
      children: [], // Entrypoints will be children here
      image: { src: 'images/cloud.png', width: 100, height: 100 },
      className: 'internet-root'
    };
    
    // Process Entrypoints and add them as children to internetSideData
    if (entrypoints && Object.keys(entrypoints).length > 0) {
        Object.entries(entrypoints).forEach(([epName, epData]) => {
            const entrypointNode = {
                name: epName,
                hasDetails: true,
                details: `Address: ${epData.address}<br/>Transport: ${epData.transport && epData.transport.protocol || 'TCP'}`,
                children: [], 
                className: 'entrypoint-node' 
            };
            internetSideData.children.push(entrypointNode);
        });
    }

    // Process Middlewares and add them as a group to traefikSideData
    if (middlewares && Object.keys(middlewares).length > 0) {
        const middlewaresGroupNode = {
            name: "Middlewares",
            hasDetails: false,
            children: [],
            className: 'middlewares-group-node'
            // No specific image for the group, individual middlewares might have icons based on type later
        };
        Object.entries(middlewares).forEach(([mwKey, mwData]) => {
            const mwName = mwKey.substring(0, mwKey.lastIndexOf('@'));
            const mwProvider = mwKey.substring(mwKey.lastIndexOf('@') + 1);
            let detailsHtml = `<div>Provider: ${mwProvider}</div><div>Type: ${mwData.type}</div>`;
            // Add specific details based on middleware type
            if (mwData.stripPrefix && mwData.stripPrefix.prefixes) {
                detailsHtml += `<div>Strip Prefixes: ${mwData.stripPrefix.prefixes.join(', ')}</div>`;
            }
            if (mwData.headers && (mwData.headers.customRequestHeaders || mwData.headers.customResponseHeaders)) {
                detailsHtml += `<div>Headers Modified</div>`; // Simplified for now
            }
            // Add more types as needed

            const middlewareNode = {
                name: mwName,
                hasDetails: true,
                details: detailsHtml,
                className: `middleware-node type-${mwData.type}`
            };
            middlewaresGroupNode.children.push(middlewareNode);
        });
        // if (middlewaresGroupNode.children.length > 0) { // Middlewares group display removed to simplify graph
        //     traefikSideData.children.push(middlewaresGroupNode);
        // }
    }
    
    // Process TLS Certificates (removed as tlsCertificates is no longer fetched)
    // if (tlsCertificates && tlsCertificates.length > 0) { ... }

    var serviceMap = {}; // Still used to link routers to service details
    var providerNodes = {}; // To store and reuse provider nodes

    // --- 1. Process Services (Backends) and group them under Providers ---
    Object.values(services).forEach(service => {
      if (service.type !== 'loadbalancer' || !service.loadBalancer || !service.loadBalancer.servers) {
        // Store non-loadbalancer services or services without servers in serviceMap for router details, but don't create visual nodes for them
        const serviceKey = `${service.name}@${service.provider}`;
        serviceMap[serviceKey] = {
            key: serviceKey,
            name: service.name,
            provider: service.provider,
            details: `<div>Provider: ${service.provider}</div><div>Type: ${service.type}</div> (No servers to display)`,
            children: []
        };
        return;
      }

      // Ensure provider node exists or create it
      let providerNode = providerNodes[service.provider];
      if (!providerNode) {
        let providerImageSrc = 'images/file.png'; // Default provider icon
        if (service.provider.toLowerCase().includes('docker')) {
          providerImageSrc = 'images/docker.png';
        }
        // Add more provider icon conditions if needed for kubernetes, etc.

        providerNode = {
          name: `Provider: ${service.provider}`,
          image: { src: providerImageSrc, width: 80, height: 80 }, // Adjusted size
          children: [],
          className: `provider-node provider-${service.provider.replace(/[^a-zA-Z0-9-_]/g, '')}`, // Sanitize provider name for CSS class
          hasDetails: false // Providers might not need details themselves, or simple ones
        };
        providerNodes[service.provider] = providerNode;
        traefikSideData.children.push(providerNode);
      }

      const serverNodes = service.loadBalancer.servers.map(server => {
        // Determine server status
        let status = 'Unknown';
        if (service.serverStatus && service.serverStatus[server.address]) {
            status = service.serverStatus[server.address];
        }
        // Use address as name, v2 doesn't have explicit server names like v1
        let serverName = server.address;
        return {
          name: serverName,
          hasDetails: true,
          // Include status in details
          details: `<ul><li>URL: ${server.address}</li><li>Status: ${status}</li></ul>`,
          depth: 150, // Keep original layout params for now
          width: 200,
          className: `traefik-server status-${status.toLowerCase()}`
        };
      });

      const serviceKey = `${service.name}@${service.provider}`;
      const serviceNode = {
        key: serviceKey,
        name: service.name, // This is the "Backend" name from original design
        provider: service.provider,
        children: serverNodes,
        hasDetails: true,
        details: `<div>Provider: ${service.provider}</div><div>Type: ${service.type}</div>`,
        className: 'service-node backend-node' // Use .node-html with default steelblue or custom .backend-node style
      };
      
      // Add this serviceNode to its provider's children
      providerNode.children.push(serviceNode);
      
      // Also populate serviceMap for router linking
      serviceMap[serviceKey] = serviceNode; 
    });

    // --- 2. Process Routers (Frontends) and Link to Services ---
    Object.values(routers).forEach(router => {
      // Routers might not have a service (e.g., redirect middleware), skip visualization for now or handle differently
      if (!router.service) {
          // Create a router node even if it doesn't link to a service, if desired
          // For now, consistent with original, only linkable routers are prominent
          console.warn(`Router "${router.name}@${router.provider}" has no service, skipping direct visualization.`);
          return;
      }

      const serviceKey = `${router.service}@${router.provider}`;
      const linkedServiceData = serviceMap[serviceKey]; // This now refers to the full serviceNode object

      // Build internet-side node (representing the route/rule)
      // Routers are now children of their respective entrypoints if that model is chosen,
      // or they can remain direct children of a general "internet" node if entrypoints are separate.
      // For now, let's keep routers as direct children of a general "routes" group under internetSideData,
      // and entrypoints are separate children of internetSideData.
      // We can refine the hierarchy later.

      // Routers will be direct children of internetSideData
      // let routesParentNode = internetSideData.children.find(c => c.name === "Configured Routes");
      // if (!routesParentNode) {
      //     routesParentNode = {
      //         name: "Configured Routes",
      //         hasDetails: false,
      //         children: [],
      //         className: 'routes-group'
      //     };
      //     internetSideData.children.push(routesParentNode);
      // }
      
      let ruleLink = '#';
      let displayName = router.name;
      let hostInfoForDetails = '';

      try {
        if (router.rule) {
          const hostMatch = router.rule.match(/Host\(`([^`]+)`\)/);
          if (hostMatch && hostMatch[1]) {
            const host = hostMatch[1];
            displayName = `${router.name} (Host: ${host})`;
            hostInfoForDetails = `<div>Host: ${host}</div>`;
            const scheme = router.entryPoints && router.entryPoints.some(ep => ep.toLowerCase().includes('https')) ? 'https://' : 'http://';
            ruleLink = scheme + host;

            const pathMatch = router.rule.match(/PathPrefix\(`([^`]+)`\)/);
            if (pathMatch && pathMatch[1]) {
              ruleLink += pathMatch[1];
            }
          } else {
            // Handle other rule types if necessary for displayName or ruleLink
            const pathMatch = router.rule.match(/PathPrefix\(`([^`]+)`\)/);
            if (pathMatch && pathMatch[1]) {
                displayName = `${router.name} (PathPrefix: ${pathMatch[1]})`;
            }
          }
        }
      } catch (e) { console.warn("Could not parse rule for link or display name:", router.rule); }
      
      const detailsHtml = `
        ${hostInfoForDetails}
        <div>Rule: ${router.rule}</div>
        <div>EntryPoints: ${router.entryPoints ? router.entryPoints.join(", ") : "N/A"}</div>
        <div>Provider: ${router.provider}</div>
        ${router.middlewares ? `<div>Middlewares: ${router.middlewares.join(", ")}</div>` : ''}
        ${linkedServiceData ? `<div>Service: ${linkedServiceData.name} (${linkedServiceData.provider})</div>` : `<div>Service: ${router.service}@${router.provider} (Not Found/Visualized)</div>`}
        ${ruleLink !== '#' ? `<div><a class="backend-link" target="_blank" href="${ruleLink}">Link (best guess)</a></div>` : ''}
      `;

      const routeNode = {
        name: displayName,
        entryPoints: router.entryPoints ? router.entryPoints.join(", ") : "N/A", // Used by Tree.js for link text
        backend: serviceKey, // Internal linkage, not directly displayed by Tree.js as a property
        hasDetails: true,
        details: detailsHtml.trim(),
        className: 'internet-route frontend-node' // Ensures .node-html is used by Tree.js
      };
      internetSideData.children.push(routeNode);

      // Service node (if it exists and has servers) is already added to its provider's children.
      // No need to add it to traefikSideData.children directly here anymore.
      if (!linkedServiceData) {
          console.warn(`Router "${router.name}@${router.provider}" points to service "${serviceKey}" which is not a loadbalancer or has no servers.`);
      }
      // Router's `details` string already includes linked service name.
    });
    
    // Ensure entrypoints are direct children of internetSideData if they were not used to group routers
    // This part is already handled earlier by pushing entrypointNode to internetSideData.children

    // --- 3. Adjust layout parameters based on data size ---
    // Calculate leaves based on server nodes
    const traefikLeaves = traefikSideData.children.reduce((sum, service) => sum + (service.children ? service.children.length : 0), 0);
    const internetLeaves = internetSideData.children.length; // Leaves are the route nodes

    // --- 4. Render Trees ---
    var tree = new Tree();
    // Always attempt to render the root nodes, Tree.js should handle empty children for root.
    if (traefikSideData) { 
        tree.createTree("#d3-flow-svg", traefikSideData, "left-to-right", Math.max(traefikLeaves * 150, 300));
    }
    if (internetSideData) {
        tree.createTree("#d3-flow-svg", internetSideData, "right-to-left", Math.max(internetLeaves * 170, 300));
    }
  }

  componentDidMount() {
    // Initial load uses data passed in props
    this.loadData(this.props);
  }

  componentDidUpdate(prevProps) {
    // Check if relevant v2 data has changed using lodash for deep comparison
    const currentData = this.props.data || {};
    const previousData = prevProps.data || {};

    if (_.isEqual(previousData.routers, currentData.routers) &&
        _.isEqual(previousData.services, currentData.services) &&
        _.isEqual(previousData.overview, currentData.overview) &&
        _.isEqual(previousData.entrypoints, currentData.entrypoints) &&
        _.isEqual(previousData.middlewares, currentData.middlewares) &&
        _.isEqual(previousData.tlsCertificates, currentData.tlsCertificates) &&
        previousData.search_query === currentData.search_query // also check search query
        ) {
      return; // No change in relevant data, do nothing
    }
    // Reload data if any relevant part changed
    this.loadData(this.props);
  }

  render() {
    return (
      <div id="d3-flow">
        <svg id="d3-flow-svg"></svg>
      </div>
    );
  }
}
