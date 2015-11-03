'use strict';
var express = require('express');
var http = require('http');
//import cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//import passport = require('passport');
var app = express();
//app.use(favicon(__dirname + '/public/favicon.png'));
//app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(session({ secret: 'keyboard cat' }));
//app.use(passport.initialize());
//app.use(passport.session());
var routes_1 = require('./routes');
app.use('/', routes_1.default);
app.use(express.static(__dirname + '/public'));
//import mongoose from './mongoose';
var socket_1 = require('./socket');
var server = http.createServer(app);
socket_1.default(server)
    .then(function (io) { return server.listen(3000, 'localhost', function () { return console.log('http started!'); }); })
    .catch(function (err) { return console.error('some error....', err.message); });
//# sourceMappingURL=server.js.map