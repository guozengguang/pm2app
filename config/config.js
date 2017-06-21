var _ = require('lodash'),
    ENV = _.trim(process.env.NODE_ENV);
console.log(
    ENV,
    ENV.length
);
module.exports = ENV == "production" ? require("./config_production.js") : require("./config_development.js") ;