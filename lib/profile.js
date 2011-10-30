var express        = require('express');

exports.defaults = {

    debug: false,

    setHeaders: true,

    print: false

};

var printRequestLatency = function (points, end) {
    
    var startTime = points[0].time;
    var duration = end - startTime;
    
    console.log('Request duration : ' + duration + ' ms');

    last = null;
    points.forEach(function (point) {
        if (!last)
            last = point.time;
        else {
            duration = point.time - last;
            console.info('\t Info ' + JSON.stringify(point.info) + 
                ' duration : ' + duration + ' ms');
            last = point.time;   
        }
    });
      
};

var latencyMiddlewareGenerator = function (info) {
    return function (req, res, next) {
        req.latency = req.latency || [];
        req.latency.push({info: info, time: new Date().getTime()});
        next();
    };
};

var addAndReorderMiddleware = function (app, middleware, targetIndex) {
    var endIndex = app.stack.length;
    app.use(middleware);
    var inserted = app.stack[endIndex];
    app.stack.splice(endIndex, 1);
    app.stack.splice(targetIndex, 0, inserted);
};

exports.middleware = function (app, options) {
    
    var defaults = exports.defaults;

    options = options || {};

    for (var prop in defaults) {
        if (options[prop] == null) options[prop] = defaults[prop];
    }

    for (var i = 0; i < app.stack.length; i += 2) {

        var info = {type: 'Global middleware', middlewareIndex: (i/2)};

        if (options.debug) {
            info,route = app.stack[i].route;
            info.source = app.stack[i].handle.toString();
        }

        addAndReorderMiddleware(app, latencyMiddlewareGenerator(info), i);
    }

    express.router.methods.forEach(function (method) {
        var method = app[method];
        app[method] = function () {
            // modify arguments
            var new_arguments = [];
            // first argument is the path
            new_arguments.push(arguments[0]);
            // now the rest are paths 
            // put a middleware for 

            method.apply(app, arguments);
        };
    });

    // method from : https://github.com/senchalabs/connect/blob/master/lib/middleware/responseTime.js
    return function (req, res, next) {

        var writeHead = res.writeHead;
        if (!req.latency) return next();

        // proxy writeHead to calculate duration
        res.writeHead = function(status, headers) {
            var end = new Date().getTime();
            var duration = (end - req.latency[0].time);

            if (options.setHeaders) {
                res.setHeader('X-Response-Duration', duration);
                res.setHeader('X-Response-Time', end);
            }

            if (options.print) {
                req.latency.push({info: {type: 'Route middleware and controller'}, time: end});

                printRequestLatency(req.latency, end);
            }

            res.writeHead = writeHead;
            res.writeHead(status, headers);
        };

        next();
    };
};