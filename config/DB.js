const { DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_HOST, DB_PORT, DB_DIALECT } = process.env;

module.exports = {
    development: {
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        host: DB_HOST,
        port: DB_PORT,
        dialect: DB_DIALECT,
        logging: false,
        pool: {
            max: 30,
            min: 0,
            acquire: 60000,
            idle: 10000
        }
    },
};
