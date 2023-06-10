const axios = require('axios').default;
const asyncHandler = require('../utils/async-handler');
const { JIRA_BASE_PREFIX_DOMAIN, JIRA_ACCOUNT_USERNAME, JIRA_ACCOUNT_PASSWORD } = process.env;

module.exports = {
    cookieJira: asyncHandler(async () => {
        // get session value & loginInfo
        const getSessionFromJira = await axios.post(`${JIRA_BASE_PREFIX_DOMAIN}/auth/1/session`, {
            username: JIRA_ACCOUNT_USERNAME,
            password: JIRA_ACCOUNT_PASSWORD,
        });

        // create cookie from session name and value from Jira
        const cookieJira = `${getSessionFromJira.data.session.name}=${getSessionFromJira.data.session.value}`;

        return cookieJira;
    }),

    base64StringJira: () => {
        // convert username:password from string to base64 type
        const inputValue = `${JIRA_ACCOUNT_USERNAME}:${JIRA_ACCOUNT_PASSWORD}`;
        const base64String = Buffer.from(inputValue).toString('base64');

        return base64String;
    },
};
