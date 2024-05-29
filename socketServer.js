const {
    newConnectionHandler,
    disconnectionHandler,
    setSocketServerInstance,
    getSocketServerInstance,
    getUser,
} = require('./serverStore');
const { verifySocketToken } = require('./middlewares/authMiddleware');

const registerSocketServer = (server) => {
    const io = require('socket.io')(server, {
        cors: {
            origin: '*', // allow all origins, change this to a specific domain in production
            methods: ['GET', 'POST'],
        },
    });
    setSocketServerInstance(io);

    // Add middleware to authenticate incoming socket connections
    io.use((socket, next) => {
        verifySocketToken(socket, next);
    });

    io.on('connection', (socket) => {
        console.log('User connected: ' + socket.id);
        newConnectionHandler(socket, io);
        socket.on('disconnect', () => {
            console.log('User Disconnected: ' + socket.id);
            disconnectionHandler(socket);
        });
    });
};

const emitNotification = (receiver, notification) => {
    const io = getSocketServerInstance();
    const user = getUser(receiver);
    if (user) {
        // Loop through all the user's socketIds and emit the notification to each one
        user.socketIds.forEach((socketId) => {
            io.to(socketId).emit('new-notification', notification);
        });
    }
};

module.exports = {
    registerSocketServer,
    emitNotification,
};
