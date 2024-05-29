const mongoose = require('mongoose');
const authController = require('../controllers/authController');
let connection = null;
const availableConnections = new Map();

const connect = (uri, database, app) => {
    console.log(uri);
    console.log(database);
    return new Promise((resolve, reject) => {
        connection = mongoose.createConnection(uri + database, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        connection.on('open', () => {
            if (app) {
                app.emit('dbReady');
            }
            availableConnections.set(connection.name, connection);
            resolve();
        });
        connection.on('error', (err) => {
            console.log(`Error connecting to database: ${err.message}`);
            reject(err);
        });
    });
};

const getConnection = () => {
    return new Promise((resolve, reject) => {
        if (connection) {
            resolve(connection);
        }
    });
};
const getAvailableConnections = () => {
    return new Promise((resolve) => {
        resolve(availableConnections);
    });
};
const useDb = (database) => {
    try {
        mongoose.connection.useDb(database);
        console.info(`Switched to database': ${database}`);
    } catch (err) {
        console.error(
            `Couldn't switch to database': ${database} because: ${err.message}`
        );
        return false;
    }
};
const generateNewDatabase = (uri, app) => {
    mongoose
        .connect(uri)
        .then(() => {
            console.log('generateNewDatabase');
            authController.controllers
                .populateFunction()
                .then(() => app.emit('dbReady'));
            return true;
        })
        .catch((err) => {
            console.error(`Couldn't connect to database': ${err.message}`);
            return false;
        });
};
const disconnect = () => {
    mongoose.connection
        .close()
        .then(() => {
            return true;
        })
        .catch((err) => {
            console.error(`Couldn't disconnect from database': ${err.message}`);
            return false;
        });
};

module.exports = {
    connect,
    disconnect,
    generateNewDatabase,
    useDb,
    getConnection,
    getAvailableConnections,
};
