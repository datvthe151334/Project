const axios = require('axios').default;
const { JIRA_BASE_PREFIX_DOMAIN } = process.env;
const { cookieJira, base64StringJira } = require('./session-jira');

/**
 * @param {*} objectEndPoint include endPoint key contain URL endpoint Jira
 * @param {*} objectPayload include payload data to specify request
 * @returns data after fetching by Axios
 */
module.exports = async (objectEndPoint, objectPayload) => {
    try {
        const cookie = await cookieJira();
        const base64String = base64StringJira();

        const projectsJira = await axios.post(
            // endpoint key in objectEndPoint
            `${JIRA_BASE_PREFIX_DOMAIN}${objectEndPoint.endPoint}`,
            // data payload
            objectPayload,
            // config header
            {
                headers: {
                    Authorization: 'Basic ' + base64String,
                    cookie: cookie,
                },
            }
        );

        return projectsJira.data;
    } catch (err) {
        return err.message;
    }
};
