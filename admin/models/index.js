const Languages = require('./languages');
const Requests = require('./requests');
const User = require('./user');
const Services = require('./services');
const { Xtrf, SmartProject } = require("./xtrf");
const { ParseHTML } = require('./parser');

const Models = {
    Languages,
    Requests,
    User,
    Services,
    Xtrf,
    SmartProject,
    ParseHTML
};

module.exports = Models;