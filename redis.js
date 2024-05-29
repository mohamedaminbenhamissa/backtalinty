const redis = require('redis');
const client = redis.createClient();
let connected = false;

function createClient() {
    client
        .connect()
        .then(() => {
            connected = true;
            console.log('Redis connection established');
        })
        .catch((error) => {
            console.error(`Error connecting to Redis: ${error}`);
        });
}

function disconnect() {
    client.quit(() => {
        console.log('Disconnected from Redis');
    });
}

async function set(key, value, options) {
    return new Promise((resolve, reject) => {
        if (!isConnected) reject('Not Connected');
        client
            .set(key, value, options)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
async function get(key) {
    return new Promise((resolve, reject) => {
        client
            .get(key)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
const isConnected = () => {
    return connected;
};

module.exports = {
    createClient,
    isConnected,
    disconnect,
    set,
    get,
};
