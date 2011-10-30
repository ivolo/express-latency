
# express-latency

express-latency is an express.js module that allows you to profile the latency in your app's requests, or how long each (global/route) middleware and controller take to execute. It can help you solve sluggishness problems in your app and give you an idea of how long your requests take server-side.

This is an alpha release. 

## Installation

	  $ npm install express-latency


## Usage:

Enable express-latency by adding the following middleware after your app decla

```js
var express = require('express');
var latency = require('express-latency');

// create express app here 
var app = express.createServer();

// something, something

// enable middleware
app.use(express.logger());
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(public_directory), {maxAge: 86400000});
app.use(app.router);

// add your routes
app.get('/', function (req, res) {
	res.send('Measure me!');
});

// add it right after all your route definitions
latency.measure(app, {print: true});
```
express-latency builds the latency object for the request file. Use 
```
req.latency
```
to access it. req.latency is structured like the following:
```
[
[{"info":{"type":"global-middleware","index":0,"name":""},"done":1320012478268,"duration":0},{"info":{"type":"global-middleware","index":1,"name":"logger"},"done":1320012478268,"duration":0},{"info":{"type":"global-middleware","index":2,"name":"methodOverride"},"done":1320012478268,"duration":0},{"info":{"type":"global-middleware","index":3,"name":"bodyParser"},"done":1320012478268,"duration":0},{"info":{"type":"global-middleware","index":4,"name":"cookieParser"},"done":1320012478269,"duration":1},{"info":{"type":"global-middleware","index":5,"name":"session"},"done":1320012478271,"duration":2},{"info":{"type":"global-middleware","index":6,"name":"processUserAgent"},"done":1320012478272,"duration":1},{"info":{"type":"global-middleware","index":7,"name":"renderArgs"},"done":1320012478272,"duration":0},{"info":{"type":"global-middleware","index":8,"name":"renderArgs"},"done":1320012478272,"duration":0},{"info":{"type":"global-middleware","index":9,"name":""},"done":1320012478272,"duration":0},{"info":{"type":"global-middleware","index":10,"name":""},"done":1320012478272,"duration":0},{"info":{"type":"global-middleware","index":11,"name":"static"},"done":1320012478272,"duration":0},{"info":{"type":"route-middleware","index":0,"path":"/?","method":"get","name":""},"done":1320012478273,"duration":0},{"info":{"type":"route-middleware","index":1,"path":"/?","method":"get","name":"recordRate"},"done":1320012478273,"duration":0},{"info":{"type":"route-middleware","index":2,"path":"/?","method":"get","name":"pageListen"},"done":1320012478273,"duration":0},{"info":{"type":"route-middleware","index":3,"path":"/?","method":"get","name":"pageSender"},"done":1320012478274,"duration":1},{"info":{"type":"route-middleware","index":4,"path":"/?","method":"get","name":"countVisits"},"done":1320012478275,"duration":1},{"info":{"type":"controller","index":0,"path":"/","method":"GET","status":200},"done":1320012478275,"duration":0}]
]
```

## Options:

- *print*

```js
false
```

  Logs to console the profile of each request.

- *setHeaders*

```js
true
```

  Writes request header X-Response-Duration for the duration of the request in milliseconds, and header X-Response-Time for the time when the server finished rendering the request. These can be used in conjunction with the client-side window.performance object to generate how long the entire request took both on the serverside and clientside.

- *printRequestLatency*

```js
printRequestLatency: function (req, requestDuration) {
        
    console.log('Request ' + req.url + ' duration : ' + requestDuration + ' ms');

    req.latency.forEach(function (point) {
        console.info('\t Info ' + JSON.stringify(point.info) + 
            ' duration : ' + point.duration + ' ms');
    });
}
```

  Customize the function that prints latency information into the console.

## TO-DOs

  - Aggregate latency across requests into the app object
  - Provide a page where page latency can be accessed
  - Add tests :)
  - Make a [GeckoBoard](http://geckoboard.com) widget