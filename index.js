var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');

// Serve up public/ftp folder
var serve = serveStatic('public/', {'index': ['index.html']});

// Create server
var server = http.createServer(function onRequest(req, res) {
    serve(req, res, finalhandler(req, res))
});

// Listen
server.listen(process.env.PORT || 5000);

//console.log('Server running at http://127.0.0.1:8125/');
