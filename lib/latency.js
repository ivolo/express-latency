var express        = require('express');

exports.defaults = {

    setHeaders: true,
    print: false,

    printRequestLatency: function (req, requestDuration) {
        
        console.log('Request ' + req.url + ' duration : ' + requestDuration + ' ms');

        req.latency.forEach(function (point) {
            console.log('\t Info ' + JSON.stringify(point.info) + 
                ' duration : ' + point.duration + ' ms');
        });
    }

};

var installProxy = function (handle, info) {

    var realHandle = handle;

    return function (req, res, next) {
        var start = new Date().getTime();

        realHandle(req, res, function (err) {
            var done = new Date().getTime();
            var duration = done - start;

            req.latency.push({info: info, done: done, duration: duration});
            next(err);
        });
    };
};

exports.measure = function (app, options) {
    
    var defaults = exports.defaults;

    options = options || {};

    for (var prop in defaults) {
        if (options[prop] == null) options[prop] = defaults[prop];
    }

    // follows middleware traversal method from
    // https://github.com/visionmedia/express-trace/blob/master/lib/express-trace.js
    // I used to insert middleware in between but found the clever overriding-next-method 
    // from the express createor himself

    for (var i = 0; i < app.stack.length; i += 1) {

        (function (stackItem) {

            var middleware = stackItem;
            var route = middleware.route;
            var handle = middleware.handle;

            if (handle === app.router) {

                // we've hit the router middleware

                // iterate through the instealled routes, and proxy them 
                // through latency handlers

                for (var method in app.routes.routes) {
                    
                    app.routes.routes[method].forEach(function (route) {

                        // install proxies around the route middleware
                        for (var j = 0; j < route.callbacks.length; j += 1) {
                           
                           if (j < (route.callbacks.length -1)) {

                               var routeMiddleware = route.callbacks[j];

                               var info = {
                                   type: 'route-middleware', 
                                   index: j, 
                                   path: route.path,
                                   method: route.method.toLowerCase(),
                                   name: routeMiddleware.name 
                               };

                               route.callbacks[j] = installProxy(route.callbacks[j], info);

                            } else {
                        
                                // surround the controller with a proxy as wel
                                var info = {
                                   type: 'controller', 
                                   index: 0, 
                                   path: route.path,
                                   method: route.method.toLowerCase(),
                                   name: route.callbacks[j].name 
                                };
                                
                                route.callbacks[j] = installProxy(route.callbacks[j], info);
                            }
                        }

                    });

                }

            } else {
                 
                // we are dealing with global middleware

                var info = {type: 'global-middleware', index: i, name: handle.name};
                
                middleware.handle = installProxy(middleware.handle, info);

            }
        })(app.stack[i]);
    }

    app.stack.unshift({
        route: '',
        handle: function (req, res, next) {

            req.latency = req.latency || [];
            
            var writeHead = res.writeHead;

            // method from : https://github.com/senchalabs/connect/blob/master/lib/middleware/responseTime.js
            // proxy writeHead to calculate duration
            res.writeHead = function(status, headers) {

                var end = new Date().getTime();
                var requestStart = req.latency[0].done - req.latency[0].duration;
                var requestDuration = (end - requestStart);

                var controllerDuration = (end - req.latency[req.latency.length-1].done);


                var info = {
                   type: 'controller', 
                   index: 0, 
                   path: req.url,
                   method: req.method,
                   status: res.statusCode 
                };
                
                req.latency.push({info: info, done: end, duration: controllerDuration});

                if (options.setHeaders) {
                    res.setHeader('X-Response-Duration', requestDuration);
                    res.setHeader('X-Response-Time', end);
                }

                if (options.print) {
                    options.printRequestLatency(req, requestDuration);
                }

                res.writeHead = writeHead;
                res.writeHead(status, headers);
            };

            next();
        }
    });
};