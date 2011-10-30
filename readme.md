
# express-profile

express-profile is an express.js middleware that allows you to profile your request, or how long each middleware and controller take to execute. It can help you solve sluggishness problems in your app and give you an idea of how long your requests take server-side.

This is an alpha release. 

## Installation

	  $ npm install express-profile


## Usage:

Enable express-profile by adding the following middleware 

```js
var profile = require('express-profile');

// create express app here 

// something, something

// enable middleware
app.use(express.logger());
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(public_directory), {maxAge: 86400000});

// add it right before app.router
app.use(profile.middleware(app, {print: true}));

app.use(app.router);
```
express-profile builds the latency object for the request file. Use 
```js
req.latency
```
to access it. req.latency is structured like the following:
```js
[ {"info":{"type":"Global middleware","middlewareIndex":0},"time":1319953963367} ]
```
and if you provide option debug: true, you will also see info property source, which is the source code of that specific middleware. Beware of debug: true and print: true together because you will get a lot of code into standard out!

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

- *debug*

```js
false
```

  Sometimes middlewareIndex is not enough to identify the slow culprit. Enable debug:true to get the source code of the slow middleware included. Access it from the controller like the following:

```js
var index = 3; // where 3 is the slowest middleware
console.log('Slow middleware code : ' + req.latency[x].info.source);
```

## TO-DOs

  - Aggregate latency across requests into the app object
  - Provide a page where page latency can be accessed
  - Add tests :)
  - Make a [GeckoBoard](http://geckoboard.com) widget