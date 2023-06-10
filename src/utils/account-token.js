const { USER_ACCOUNT } = process.env;

module.exports = (req) => {
    try {
        const getAccountFromToken = `${req.authInfo?.preferred_username.split('@')[0] ?? USER_ACCOUNT}`;

        return getAccountFromToken;
    } catch (err) {
        throw new ErrorResponse(500, `get account fail, ${err.message}`);
    }
};
