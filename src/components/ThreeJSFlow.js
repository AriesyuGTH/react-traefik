import React, { Component } from 'react';
import _ from 'lodash';
import Tree from './Tree';
// Import only selectAll and select from d3-selection instead of the whole d3 library
import { selectAll, select } from 'd3-selection';


export default class ThreeJSFlow extends Component {

  loadData(props) {
    // Access v2 data and search query from props.data (passed from AsyncApp)
    const { routers: originalRouters, services: originalServices, search_query } = props.data;

    // Clear SVG and check if data is available
    // Use the imported selectAll directly
    selectAll('#d3-flow-svg *').remove();
    if (!originalRouters || !originalServices) {
      console.warn("Routers or services data not available for visualization.");
      return;
    }

    // --- Apply Filtering based on search_query ---
    let routers = originalRouters;
    let services = originalServices;
    const query = search_query ? search_query.toLowerCase() : '';
    let matchedServiceKeys = new Set(); // Keep track of services linked by matched routers

    if (query) {
        console.log("Applying filter:", query);
        const filteredServices = {};
        Object.values(originalServices).forEach(service => {
            const serviceKey = `${service.name}@${service.provider}`;
            let match = false;
            if (service.name.toLowerCase().includes(query)) match = true;
            if (!match && service.provider.toLowerCase().includes(query)) match = true;
            // Replace optional chaining with traditional check
            if (!match && service.type === 'loadbalancer' && service.loadBalancer && service.loadBalancer.servers) {
                if (service.loadBalancer.servers.some(server => server.address.toLowerCase().includes(query))) {
                    match = true;
                }
            }
            // Also check status if available
             if (!match && service.serverStatus) {
                 if (Object.values(service.serverStatus).some(status => status.toLowerCase().includes(query))) {
                     match = true;
                 }
             }

            if (match) {
                filteredServices[serviceKey] = service;
                matchedServiceKeys.add(serviceKey); // Add directly matched services
            }
        });
        services = filteredServices; // Use the filtered services object

        const filteredRouters = {};
        Object.values(originalRouters).forEach(router => {
            const routerKey = `${router.name}@${router.provider}`;
            const serviceKey = router.service ? `${router.service}@${router.provider}` : null;
            let match = false;

            if (router.name.toLowerCase().includes(query)) match = true;
            if (!match && router.provider.toLowerCase().includes(query)) match = true;
            if (!match && router.rule.toLowerCase().includes(query)) match = true;
            if (!match && router.entryPoints.some(ep => ep.toLowerCase().includes(query))) match = true;
            // Keep router if its linked service was matched directly
            if (!match && serviceKey && matchedServiceKeys.has(serviceKey)) match = true;
             // Keep router if it links to a service that exists in the filtered services list
            if (!match && serviceKey && services[serviceKey]) match = true;


            if (match) {
                filteredRouters[routerKey] = router;
                // If this router matched, ensure its linked service is included (if it exists in original data)
                if (serviceKey && originalServices[serviceKey] && !services[serviceKey]) {
                     console.log(`Including service ${serviceKey} because router ${routerKey} matched.`);
                     services[serviceKey] = originalServices[serviceKey]; // Add service back if router matched
                     matchedServiceKeys.add(serviceKey); // Track it
                } else if (serviceKey) {
                    matchedServiceKeys.add(serviceKey); // Track service linked by matched router
                }
            }
        });
        routers = filteredRouters; // Use the filtered routers object

        // Final pass on services: ensure all services linked by the final router list are included
        Object.values(routers).forEach(router => {
            const serviceKey = router.service ? `${router.service}@${router.provider}` : null;
            if (serviceKey && originalServices[serviceKey] && !services[serviceKey]) {
                 console.log(`Including service ${serviceKey} in final pass due to router ${router.name}@${router.provider}.`);
                 services[serviceKey] = originalServices[serviceKey];
            }
        });


    } else {
        // No query, use original data
        routers = originalRouters;
        services = originalServices;
    }

    // Check again if filtering resulted in empty data
    if (Object.keys(routers).length === 0 && Object.keys(services).length === 0) {
        console.log("Filtering resulted in no matching routers or services.");
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
    var traefikSideData = {
      name: "traefik",
      hasDetails: false,
      // routes: [], // Maybe remove if not used by Tree
      children: [],
      image: { src: 'images/traefik.png', width: 100, height: 100 },
      className: 'traefik-root'
    };

    var internetSideData = {
      name: "internet",
      hasDetails: false,
      // routes: [], // Maybe remove if not used by Tree
      children: [],
      image: { src: 'images/cloud.png', width: 100, height: 100 },
      className: 'internet-root'
    };

    var serviceMap = {}; // To store processed service data for linking

    // --- 1. Process Services (Backends) ---
    Object.values(services).forEach(service => {
      // Basic check for load balancer and servers
      // Also check service type, maybe only handle LoadBalancer type?
      if (service.type !== 'loadbalancer' || !service.loadBalancer || !service.loadBalancer.servers) return;

      var serverNodes = service.loadBalancer.servers.map(server => {
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
          className: `traefik-server status-${status.toLowerCase()}` // Add status class
        };
      });

      // Use name@provider as unique key
      const serviceKey = `${service.name}@${service.provider}`;
      serviceMap[serviceKey] = {
        key: serviceKey, // Store the key itself
        name: service.name,
        provider: service.provider,
        children: serverNodes, // Server nodes are children of the service
        // Add other relevant service details if needed for display
        details: `<div>Provider: ${service.provider}</div><div>Type: ${service.type}</div>`
      };
    });

    // --- 2. Process Routers (Frontends) and Link to Services ---
    Object.values(routers).forEach(router => {
      // Routers might not have a service (e.g., redirect middleware)
      if (!router.service) return;

      const serviceKey = `${router.service}@${router.provider}`;
      const linkedServiceData = serviceMap[serviceKey];

      // Build internet-side node (representing the route/rule)
      // Attempt to create a clickable link from the rule if possible (simple Host based)
      let ruleLink = '#';
      try {
          if (router.rule && router.rule.startsWith('Host(`')) {
              // Simple case: Host(`example.com`)
              const hostMatch = router.rule.match(/Host\(`([^`]+)`\)/);
              if (hostMatch && hostMatch[1]) {
                  const host = hostMatch[1];
                  const scheme = router.entryPoints.some(ep => ep.toLowerCase().includes('https')) ? 'https://' : 'http://';
                  ruleLink = scheme + host;
              }
          } else if (router.rule && router.rule.includes('PathPrefix(`')) {
               // Try to find Host rule if PathPrefix exists
               const hostMatch = router.rule.match(/Host\(`([^`]+)`\)/);
               const pathMatch = router.rule.match(/PathPrefix\(`([^`]+)`\)/);
               if (hostMatch && hostMatch[1] && pathMatch && pathMatch[1]) {
                   const host = hostMatch[1];
                   const path = pathMatch[1];
                   const scheme = router.entryPoints.some(ep => ep.toLowerCase().includes('https')) ? 'https://' : 'http://';
                   ruleLink = scheme + host + path;
               }
          }
      } catch (e) { console.warn("Could not parse rule for link:", router.rule); }

      const routeNode = {
        name: router.name, // Use router name
        // route: { name: router.name, value: router.rule }, // Keep if Tree needs it
        entryPoints: router.entryPoints.join(", "),
        backend: serviceKey, // Link to service key
        hasDetails: true,
        details: `<div>Rule: ${router.rule}</div>
                  <div>EntryPoints: ${router.entryPoints.join(", ")}</div>
                  ${linkedServiceData ? `<div>Service: ${linkedServiceData.name} (${linkedServiceData.provider})</div>` : `<div>Service: ${router.service}@${router.provider} (Not Found/Visualized)</div>`}
                  ${ruleLink !== '#' ? `<div><a class="backend-link" target="_blank" href="${ruleLink}">Link (best guess)</a></div>` : ''}`,
        className: 'internet-route' // Add class for styling
      };
      internetSideData.children.push(routeNode);

      // Add service node to the traefik side if it's linked and not already added
      if (linkedServiceData) {
           let serviceGroupNode = traefikSideData.children.find(n => n.key === serviceKey);
           if (!serviceGroupNode) {
               // Determine image based on provider (simple example)
               let providerImage = 'images/docker.png'; // Default
               // Use includes for broader matching (e.g., docker@docker, kubernetescrd@kubernetescrd)
               if (linkedServiceData.provider.toLowerCase().includes('file')) providerImage = 'images/file.png';
               else if (linkedServiceData.provider.toLowerCase().includes('kubernetes')) providerImage = 'images/cloud.png'; // Example for k8s
               // Add more provider checks if needed

               serviceGroupNode = {
                   key: serviceKey,
                   name: linkedServiceData.name, // Service name
                   provider: linkedServiceData.provider,
                   children: linkedServiceData.children, // Add server nodes
                   image: { src: providerImage, width: 100, height: 100 }, // Use determined image
                   details: linkedServiceData.details, // Add service details
                   className: `traefik-service provider-${linkedServiceData.provider}` // Add classes
               };
               traefikSideData.children.push(serviceGroupNode);
           }
           // Optionally, add router info to service details if needed
           // serviceGroupNode.details += `<div>Linked Router: ${router.name}</div>`;
      } else {
          console.warn(`Router "${router.name}@${router.provider}" points to unknown or non-loadbalancer service "${serviceKey}"`);
          // Optionally create a placeholder node on the traefik side for the missing/non-LB service
      }
    });

    // --- 3. Adjust layout parameters based on data size ---
    // Calculate leaves based on server nodes
    const traefikLeaves = traefikSideData.children.reduce((sum, service) => sum + (service.children ? service.children.length : 0), 0);
    const internetLeaves = internetSideData.children.length; // Leaves are the route nodes

    // --- 4. Render Trees ---
    var tree = new Tree();
    // Only render if there are children to avoid errors
    if (traefikSideData.children.length > 0) {
        // Use Math.max to ensure a minimum width, prevent collapse if few leaves
        tree.createTree("#d3-flow-svg", traefikSideData, "left-to-right", Math.max(traefikLeaves * 150, 300));
    }
    if (internetSideData.children.length > 0) {
         // Use Math.max to ensure a minimum width
        tree.createTree("#d3-flow-svg", internetSideData, "right-to-left", Math.max(internetLeaves * 170, 300));
    }
  }

  componentDidMount() {
    // Initial load uses data passed in props
    this.loadData(this.props);
  }

  componentDidUpdate(prevProps) {
    // Check if relevant v2 data has changed using lodash for deep comparison
    if (_.isEqual(prevProps.data.routers, this.props.data.routers) &&
        _.isEqual(prevProps.data.services, this.props.data.services)) {
      return; // No change in relevant data, do nothing
    }
    // Reload data if routers or services changed
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
