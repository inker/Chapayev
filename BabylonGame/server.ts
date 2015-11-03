'use strict';
import express = require('express');
import http = require('http');
//import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
//import session = require('express-session');
import favicon = require('serve-favicon');
//import passport = require('passport');

const app = express();


//app.use(favicon(__dirname + '/public/favicon.png'));
//app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(session({ secret: 'keyboard cat' }));
//app.use(passport.initialize());
//app.use(passport.session());

import routes from './routes';
app.use('/', routes);

app.use(express.static(__dirname + '/public'));

//import mongoose from './mongoose';
import socket from './socket';
const server = http.createServer(app);
socket(server)
    .then(io => server.listen(3000, 'localhost', () => console.log('http started!')))
    .catch(err => console.error('some error....', err.message));