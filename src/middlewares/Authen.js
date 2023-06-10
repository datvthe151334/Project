// const { BearerStrategy } = require('passport-azure-ad');
// const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_METADATA_AUTHORITY, AZURE_METADATA_DISCOVERY, AZURE_METADATA_VERSION } = process.env;

// const bearerStrategy = new BearerStrategy(
//     {
//         identityMetadata: `https://${AZURE_METADATA_AUTHORITY}/${AZURE_TENANT_ID}/${AZURE_METADATA_VERSION}/${AZURE_METADATA_DISCOVERY}`,
//         issuer: `https://${AZURE_METADATA_AUTHORITY}/${AZURE_TENANT_ID}/${AZURE_METADATA_VERSION}`,
//         // @ts-ignore
//         clientID: AZURE_CLIENT_ID,
//         audience: AZURE_CLIENT_ID, // audience is this application
//         validateIssuer: true,
//         passReqToCallback: false,
//         // loggingLevel: 'info',
//         // loggingNoPII: false,
//         scope: ['access_as_user'],
//     },
//     (token, done) => {
//         // Send user info using the second argument
//         done(null, {}, token);
//     }
// );

// module.exports = bearerStrategy;
