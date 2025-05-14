var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('config');
var Datastore = require('nedb')
    , db = new Datastore({ filename: config.db_path, autoload: true });

/* GET saved url listing. */
router.get('/url', function (req, res, next) {
    // The same rules apply when you want to only find one document
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            return res.status(500).json(err);
        }

        if (!doc) {
            var Docker = require('dockerode');
            var docker = new Docker({ socketPath: '/var/run/docker.sock' });
            docker.listContainers(function (err, containers) {
                if (err || !containers) {
                    return res.status(404).json({
                        message: 'traefik url not provided'
                    });
                } else {
                    var traefik = containers.filter((c) => {
                        return c.Image == 'traefik' && c.State == 'running';
                    })
                    var ip;
                    if (traefik.length) {
                        var network = traefik[0].HostConfig.NetworkMode;
                        if (network) {
                            ip = traefik[0].NetworkSettings.Networks[network].IPAddress;
                        }
                    }
                }

                if (ip) {
                    return res.json({
                        status: 'ok',
                        url: 'http://' + ip + ':8080'
                    })
                }
                return res.status(404).json({
                    message: 'traefik url not provided'
                });
            });
        } else {

            return res.json({
                status: 'ok',
                url: doc.value
            })
        }
    });
});

/* GET users listing. */
router.put('/url', function (req, res, next) {
    var url = req.body.url;
    if (!url) {
        return res.status(400).json({
            message: 'Incorrect url'
        })
    }

    db.update({ name: 'url' }, { name: 'url', value: url }, { upsert: true }, function (err, num, newDoc) {
        if (err) {
            return res.status(500).json(err);
        }
        return res.json({
            status: 'ok',
            url: url
        })
    });
});

/* GET providers info from traefik. (V1 - Deprecated) */
/*
router.get('/providers', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            return res.status(500).json(err);
        }

        if (!doc) {
            return res.status(404).json({
                message: 'traefik url not provided'
            });
        }

        var x = request(doc.value + '/api/providers', function (err, response) {
            if (err) {
                // Log the error but attempt to let the pipe handle Traefik's response if possible
                console.error("Error requesting Traefik v1 providers:", err);
            }
        });
        // Handle request errors specifically for the proxy request
        x.on('error', function(proxyErr) {
            console.error("Traefik v1 providers proxy request error:", proxyErr);
            if (!res.headersSent) {
                res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API', error: proxyErr.message });
            }
        });
        req.pipe(x).pipe(res); // Pipe request to Traefik, and Traefik's response back to client
    });
});
*/

/* GET v2 http routers info from traefik. */
router.get('/v2/http/routers', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            console.error("Error fetching URL from DB:", err);
            return res.status(500).json({ message: 'Database error fetching Traefik URL', error: err });
        }

        if (!doc || !doc.value) {
            return res.status(404).json({
                message: 'Traefik URL not configured or found in DB'
            });
        }

        const targetUrl = doc.value.replace(/\/$/, '') + '/api/http/routers'; // Ensure no trailing slash before appending
        console.log(`Proxying request to Traefik v2 routers: ${targetUrl}`);

        try {
            var x = request(targetUrl);
             // Handle request errors specifically for the proxy request
            x.on('error', function(proxyErr) {
                console.error(`Traefik v2 routers proxy request error to ${targetUrl}:`, proxyErr);
                if (!res.headersSent) {
                    res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API (v2/http/routers)', error: proxyErr.message });
                }
            });
            req.pipe(x).pipe(res); // Pipe request to Traefik, and Traefik's response back to client
        } catch (requestErr) {
             console.error(`Error initiating request to ${targetUrl}:`, requestErr);
             if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to initiate proxy request to Traefik API', error: requestErr.message });
            }
        }
    });
});

/* GET v2 http services info from traefik. */
router.get('/v2/http/services', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            console.error("Error fetching URL from DB:", err);
            return res.status(500).json({ message: 'Database error fetching Traefik URL', error: err });
        }

        if (!doc || !doc.value) {
            return res.status(404).json({
                message: 'Traefik URL not configured or found in DB'
            });
        }

        const targetUrl = doc.value.replace(/\/$/, '') + '/api/http/services'; // Ensure no trailing slash before appending
        console.log(`Proxying request to Traefik v2 services: ${targetUrl}`);

        try {
            var x = request(targetUrl);
             // Handle request errors specifically for the proxy request
            x.on('error', function(proxyErr) {
                console.error(`Traefik v2 services proxy request error to ${targetUrl}:`, proxyErr);
                if (!res.headersSent) {
                    res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API (v2/http/services)', error: proxyErr.message });
                }
            });
            req.pipe(x).pipe(res); // Pipe request to Traefik, and Traefik's response back to client
        } catch (requestErr) {
             console.error(`Error initiating request to ${targetUrl}:`, requestErr);
             if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to initiate proxy request to Traefik API', error: requestErr.message });
            }
        }
    });
});

/* GET v2 overview info from traefik. */
router.get('/v2/overview', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            console.error("Error fetching URL from DB:", err);
            return res.status(500).json({ message: 'Database error fetching Traefik URL', error: err });
        }

        if (!doc || !doc.value) {
            return res.status(404).json({
                message: 'Traefik URL not configured or found in DB'
            });
        }

        const targetUrl = doc.value.replace(/\/$/, '') + '/api/overview'; // Ensure no trailing slash
        console.log(`Proxying request to Traefik v2 overview: ${targetUrl}`);

        try {
            var x = request(targetUrl);
            x.on('error', function(proxyErr) {
                console.error(`Traefik v2 overview proxy request error to ${targetUrl}:`, proxyErr);
                if (!res.headersSent) {
                    res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API (v2/overview)', error: proxyErr.message });
                }
            });
            req.pipe(x).pipe(res);
        } catch (requestErr) {
             console.error(`Error initiating request to ${targetUrl}:`, requestErr);
             if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to initiate proxy request to Traefik API', error: requestErr.message });
            }
        }
    });
});

/* GET v2 entrypoints info from traefik. */
router.get('/v2/entrypoints', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            console.error("Error fetching URL from DB:", err);
            return res.status(500).json({ message: 'Database error fetching Traefik URL', error: err });
        }

        if (!doc || !doc.value) {
            return res.status(404).json({
                message: 'Traefik URL not configured or found in DB'
            });
        }

        const targetUrl = doc.value.replace(/\/$/, '') + '/api/entrypoints'; // Ensure no trailing slash
        console.log(`Proxying request to Traefik v2 entrypoints: ${targetUrl}`);

        try {
            var x = request(targetUrl);
            x.on('error', function(proxyErr) {
                console.error(`Traefik v2 entrypoints proxy request error to ${targetUrl}:`, proxyErr);
                if (!res.headersSent) {
                    res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API (v2/entrypoints)', error: proxyErr.message });
                }
            });
            req.pipe(x).pipe(res);
        } catch (requestErr) {
             console.error(`Error initiating request to ${targetUrl}:`, requestErr);
             if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to initiate proxy request to Traefik API', error: requestErr.message });
            }
        }
    });
});

/* GET v2 http middlewares info from traefik. */
router.get('/v2/http/middlewares', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            console.error("Error fetching URL from DB:", err);
            return res.status(500).json({ message: 'Database error fetching Traefik URL', error: err });
        }

        if (!doc || !doc.value) {
            return res.status(404).json({
                message: 'Traefik URL not configured or found in DB'
            });
        }

        const targetUrl = doc.value.replace(/\/$/, '') + '/api/http/middlewares'; // Ensure no trailing slash
        console.log(`Proxying request to Traefik v2 http/middlewares: ${targetUrl}`);

        try {
            var x = request(targetUrl);
            x.on('error', function(proxyErr) {
                console.error(`Traefik v2 http/middlewares proxy request error to ${targetUrl}:`, proxyErr);
                if (!res.headersSent) {
                    res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API (v2/http/middlewares)', error: proxyErr.message });
                }
            });
            req.pipe(x).pipe(res);
        } catch (requestErr) {
             console.error(`Error initiating request to ${targetUrl}:`, requestErr);
             if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to initiate proxy request to Traefik API', error: requestErr.message });
            }
        }
    });
});

/* GET v2 tls certificates info from traefik. */
router.get('/v2/tls/certificates', function (req, res, next) {
    db.findOne({ name: 'url' }, function (err, doc) {
        if (err) {
            console.error("Error fetching URL from DB:", err);
            return res.status(500).json({ message: 'Database error fetching Traefik URL', error: err });
        }

        if (!doc || !doc.value) {
            return res.status(404).json({
                message: 'Traefik URL not configured or found in DB'
            });
        }

        const targetUrl = doc.value.replace(/\/$/, '') + '/api/tls/certificates'; // Ensure no trailing slash
        console.log(`Proxying request to Traefik v2 tls/certificates: ${targetUrl}`);

        try {
            var x = request(targetUrl);
            x.on('error', function(proxyErr) {
                console.error(`Traefik v2 tls/certificates proxy request error to ${targetUrl}:`, proxyErr);
                if (!res.headersSent) {
                    res.status(502).json({ message: 'Bad Gateway - Error connecting to Traefik API (v2/tls/certificates)', error: proxyErr.message });
                }
            });
            req.pipe(x).pipe(res);
        } catch (requestErr) {
             console.error(`Error initiating request to ${targetUrl}:`, requestErr);
             if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to initiate proxy request to Traefik API', error: requestErr.message });
            }
        }
    });
});

module.exports = router;
