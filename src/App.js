// use this because VDI
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const passport = require('passport');
const appRootPath = require('app-root-path');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const logger = require('./helpers/logger');
const Author = require('./middlewares/Author');
const Authen = require('./middlewares/Authen');
const { errorResponse } = require('./libs/response');
const errorHandler = require('./middlewares/error-handler');
const { SERVER_PORT, DB_DATABASE, DB_HOST, SOCKETIO_PORT } = process.env;


const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(appRootPath + '/public'));

// using passport to authen
app.use(passport.initialize());
// passport.use(Authen);

// using morgan & winston to logging data
app.use(morgan('dev', { stream: { write: (message) => logger.info(message) } }));

// verify request to server before access any route
// require('./middlewares/Authen.js');

app.use(
    //* config prefix api routes
    '/api/v1',
    //* authenticate login using passport
    // passport.authenticate('oauth-bearer', { session: false }),
    //* authorization after authen
    // Author,
    // import routers
    require('./routes')
);

// if route not exist
app.all('*', (req, res) => {
    return res.status(404).json(errorResponse(404, 'Page Not Found...'));
});

// handle all error are returned before
app.use(errorHandler);


app.listen(SERVER_PORT || 5000, async () => {
    try {
        console.log(`>>> Listening on port ${SERVER_PORT || 5000}`);

        await sequelize.authenticate();
        console.log(`>>> Connected to "${DB_DATABASE}" on "${DB_HOST}"!`);

        // await sequelize.sync({ force: true });

        await sequelize.sync();
        console.log(`>>> Synced data successful`);

        // await UserbadgeController.reAutoAwardBadgesForRule();
        // console.log('>>> Reschedule Jobs Successful');
    } catch (err) {
        console.error(err);
    }
});

module.exports = app;
