const express = require('express');
const i18n = require('i18n');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');
const swaggerAutogen = require('swagger-autogen')();
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');
let databaseInfo = null;
const userSchema = require('./models/schemas/userSchema');
const AccessConfigSchema = require('./models/schemas/accessConfigSchema');
const processSchema = require('./models/schemas/processSchema');
const settingsSchema = require('./models/schemas/settingsSchema');
const roleSchema = require('./models/schemas/roleSchema');
const tokenSchema = require('./models/schemas/tokenSchema');
const questionSchema = require('./models/schemas/questionSchema');
const packSchema = require('./models/schemas/packSchema');
const testSchema = require('./models/schemas/testSchema');
const jobSchema = require('./models/schemas/jobSchema');
const evaluationSchema = require('./models/schemas/evaluationSchema');
const candidateSchema = require('./models/schemas/candidateSchema');
const customFieldsSchema = require('./models/schemas/customFieldsSchema');
const emailSchema = require('./models/schemas/emailSchema');
const notificationSchema = require('./models/schemas/notificationSchema');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const limiter = rateLimit({
    windowMs: 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

require('dotenv').config();

const app = express();

app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const corsOptions = {
    origin: function (origin, callback) {
        try {
            if (origin.endsWith('.Talenty.com')) {
                callback(null, true);
            } else {
                callback(false);
            }
        } catch (e) {
            callback(false);
        }
    },
};

app.use(cors());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser(process.env.SESSION_KEY)); //check
const fileUpload = require('express-fileupload');
app.use(
    session({
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 60 * 60 * 2 * 1000 }, // 1 hour
    })
);
app.use(fileUpload({ limits: { fileSize: 20000000 } })); //20MB
i18n.configure({
    locales: ['en', 'fr'],
    directory: __dirname + '/locales',
    defaultLocale: 'en',
    objectNotation: true,
});
app.use(i18n.init);

/**
 * Middleware for handling multitenancy and setting up database connections based on subdomains.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - Promise that resolves once the middleware processing is complete.
 */
app.use(async (req, res, next) => {
    try {
        const locale = req.headers['accept-language']?.split(',')[0] || 'en';
        i18n.setLocale(locale);
        req.language = locale;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        let subdomain =
            req.headers.origin?.split('/')[2]?.split('.')[0] || 'test';
        // Handle the case that we are running the app on localhost or when someone
        //uses the app without specifying a subdomain in that case we simply use the default demo subdomain
        if (
            subdomain === 'app' ||
            subdomain === 'bo' ||
            subdomain === 'localhost:3006' ||
            subdomain === 'localhost:3000' ||
            subdomain === 'localhost:3005'
        )
            subdomain = 'test'; /*'demo'*/

        let connection = await db.getConnection();

        //If the subdomain is different from the current connection than we need to connect to that subdomain database

        if (connection.name !== subdomain && process.env.PROD) {
            const availableConnections = await db.getAvailableConnections();
            // If we already connected to that database before then we simply use it instead of reconnecting
            if (availableConnections.has(subdomain)) {
                connection = availableConnections.get(subdomain);
            } else {
                // We are trying to get here the config for that subdomain
                if (connection.name !== 'admin') {
                    await db.connect(
                        process.env.MONGODB_URL,
                        'admin?authSource=admin'
                    );
                    connection = await db.getConnection();
                }
                const AccessConfig = connection.db.collection('access');

                let database = await AccessConfig.findOne({ subdomain });
                // If we can't find it we use a default demo database
                if (!database) {
                    database = await AccessConfig.findOne({
                        subdomain: 'test',
                    });
                }
                databaseInfo = database;
                console.log('---------', database);
                // Change the database if necessary
                if (database.databaseName !== connection.name) {
                    await db.connect(
                        process.env.MONGODB_URL,
                        `${database.databaseName}?authSource=admin`
                    );
                    connection = await db.getConnection();
                }
            }
        }

        // Set up models for various collections.
        const User = connection.model('user', userSchema);
        const Role = connection.model('role', roleSchema);
        const Access = connection.model('access', AccessConfigSchema);
        const Process = connection.model('process', processSchema);
        const Settings = connection.model('settings', settingsSchema);
        const Roles = connection.model('role', roleSchema);
        const Token = connection.model('token', tokenSchema);
        const Question = connection.model('question', questionSchema);
        const Pack = connection.model('pack', packSchema);
        const Test = connection.model('test', testSchema);
        const Job = connection.model('job', jobSchema);
        const Evaluation = connection.model('evaluation', evaluationSchema);
        const Candidate = connection.model('candidate', candidateSchema);
        const Email = connection.model('email', emailSchema);
        const Notification = connection.model(
            'notification',
            notificationSchema
        );
        const CustomFields = connection.model(
            'customFields',
            customFieldsSchema
        );
        const SearchTerm = connection.model('searchTerm', SearchTermSchema);
        // Attach models and connection information to the request object.
        req.Access = Access;
        req.DatabaseInfo = databaseInfo;
        req.User = User;
        req.Role = Role;
        req.Process = Process;
        req.Settings = Settings;
        req.Roles = Roles;
        req.Token = Token;
        req.Question = Question;
        req.Pack = Pack;
        req.Job = Job;
        req.Test = Test;
        req.Evaluation = Evaluation;
        req.Candidate = Candidate;
        req.CustomFields = CustomFields;
        req.Email = Email;
        req.Notification = Notification;
        req.SearchTerm = SearchTerm;
        req.connection = connection;
        next();
    } catch (e) {
        return res.status(500).send(`APP Error: ${e.message}`);
    }
});

const fileRouter = require('./routes/fileRoutes.js');
const authRouter = require('./routes/authRoutes.js');
const questionRouter = require('./routes/questionRoutes');
const testRouter = require('./routes/testRoutes');
const settingsRouter = require('./routes/settingsRoutes');
const evaluationRouter = require('./routes/evaluationRoutes');
const candidateRouter = require('./routes/candidateRoutes');
const packRouter = require('./routes/packRoutes');
const jobRoutes = require('./routes/jobRoutes');
const processRoutes = require('./routes/processRoutes');
const customFieldsRoutes = require('./routes/customFieldsRoutes');
const emailRoutes = require('./routes/emailRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const heartbeatRoutes = require('./routes/heartbeatRoutes');
const SearchTermSchema = require('./models/schemas/searchTermSchema');

app.use('/api/v1/files', fileRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/question', questionRouter);
app.use('/api/v1/pack', packRouter);
app.use('/api/v1/test', testRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/evaluation', evaluationRouter);
app.use('/api/v1/candidate', candidateRouter);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/process', processRoutes);
app.use('/api/v1/custom_fields', customFieldsRoutes);
app.use('/api/v1/heartbeat', heartbeatRoutes);
app.use('/api/v1/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));
module.exports = app;
