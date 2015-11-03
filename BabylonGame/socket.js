var Server = require('socket.io');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (server) {
    var io = Server(server);
    io.on('connection', onConnection);
    return Promise.resolve(io);
};
var colors = ['white', 'black'];
var sockets = new Array(2);
function onConnection(socket) {
    console.log('client connected');
    if (!sockets[0]) {
        sockets[0] = socket;
        socket.emit('color', 0);
    }
    else if (!sockets[1]) {
        sockets[1] = socket;
        socket.emit('color', 1);
    }
    else {
        throw new Error('not enough space');
    }
    console.log(sockets.map(function (s) { return !!s; }));
    socket.on('disconnect', function () {
        console.log('goodbye');
        if (sockets[0] === socket) {
            sockets[0] = null;
        }
        else if (sockets[1] === socket) {
            sockets[1] = null;
        }
        else {
            throw new Error('socket does not exist');
        }
        console.log(sockets.map(function (s) { return !!s; }));
    }).on('action', function (data) { return socket.broadcast.emit('action', data); });
}
//# sourceMappingURL=socket.js.map