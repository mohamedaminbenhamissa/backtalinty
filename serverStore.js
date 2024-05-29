const connectedUsers = new Map();
let io = null;

const setSocketServerInstance = (ioInstance) => {
    io = ioInstance;
};
const getSocketServerInstance = () => {
    return io;
};

const addUser = ({ socketId, userId }) => {
    const user = connectedUsers.get(userId);
    if (user) {
        // If the user already exists, push the new socketId to the array
        user.socketIds.push(socketId);
    } else {
        // If the user doesn't exist, create a new entry with an array containing the socketId
        connectedUsers.set(userId, { socketIds: [socketId] });
    }
};
const removeUser = (userId, socketId) => {
    const user = connectedUsers.get(userId);
    if (user) {
        if (socketId) {
            // Remove the specified socketId from the array
            user.socketIds = user.socketIds.filter((id) => id !== socketId);
        } else {
            // If no socketId is specified, remove all socketIds for the user
            user.socketIds = [];
        }
        // If the user has no socketIds left, remove the user from the Map
        if (user.socketIds.length === 0) {
            connectedUsers.delete(userId);
        }
    }
};
const getUser = (userId) => {
    return connectedUsers.get(userId.valueOf());
};
const getOnlineUsers = () => {
    let result = [];
    connectedUsers.forEach((value, key) => {
        result.push(key);
    });
    return result;
};
const newConnectionHandler = async (socket, io) => {
    const userDetails = socket.user;
    addUser({
        socketId: socket.id,
        userId: userDetails.userId,
    });
};
const disconnectionHandler = async (socket, io) => {
    const userDetails = socket.user;
    removeUser(userDetails.userId, socket.id);
};

module.exports = {
    connectedUsers,
    newConnectionHandler,
    disconnectionHandler,
    setSocketServerInstance,
    getSocketServerInstance,
    getUser,
    getOnlineUsers,
};
