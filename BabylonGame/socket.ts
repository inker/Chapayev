import http = require('http');
import express = require('express');
import Server = require('socket.io');

export default (server: http.Server) => {
    const io = Server(server);
    io.on('connection', onConnection);
    return Promise.resolve(io);
};

const colors = ['white', 'black'];
const sockets = new Array<SocketIO.Socket>(2);

function onConnection(socket: SocketIO.Socket) {
    console.log('client connected');

    if (!sockets[0]) {
        sockets[0] = socket;
        socket.emit('color', 0);
    } else if (!sockets[1]) {
        sockets[1] = socket;
        socket.emit('color', 1);
    } else {
        throw new Error('not enough space');
    }
    console.log(sockets.map(s => !!s));
    socket.on('disconnect', () => {
        console.log('goodbye');
        if (sockets[0] === socket) {
            sockets[0] = null;
        } else if (sockets[1] === socket) {
            sockets[1] = null;
        } else {
            throw new Error('socket does not exist');
        }
        console.log(sockets.map(s => !!s));
    }).on('action', data => socket.broadcast.emit('action', data));
}