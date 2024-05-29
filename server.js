const http = require('http');
const db = require('./models/db');
const app = require('./app');
const Redis = require('./redis');
const socketServer = require('./socketServer');
require('dotenv').config();
const PORT = process.env.PORT || process.env.API_PORT;
const server = http.createServer(app);
// if (process.env.NEW_CLIENT) {
//     db.generateNewDatabase(process.env.MONGODB_URL, app);
// } else {
//     if (process.env.PROD) db.connect(process.env.MONGODB_URL, 'admin', app);
//     else db.connect(process.env.MONGODB_URL, 'demo', app);
// }
if (process.env.NEW_CLIENT) {
    db.generateNewDatabase(process.env.MONGODB_URL, app);
} else {
    db.connect(process.env.MONGODB_URL, 'test', app);
    
}
app.on('dbReady', function () {
    if (!server.listening) {
        server.listen(PORT, () => {
            Redis.createClient();
            socketServer.registerSocketServer(server);
            console.info(`> Is new user: ${process.env.NEW_CLIENT === true}`);
            console.info(`> Frontend is hosted @: ${process.env.BASE_URL}`);
            console.info(`> Database is hosted @: ${process.env.mongodb_url}`);
            console.info(`> Listening on port ${PORT}`);
        });
    }else{
        console.warn('dbReady was emitted, but the server is already listening. This event will be ignored.');
    }
});
