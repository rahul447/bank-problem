"use strict";

// eslint disable no-var

var environmentVariables = {
  "CMSV2_DATASERVICE_LOGGING_LEVEL": process.env.CMSV2_DATASERVICE_LOGGING_LEVEL || "debug",
  "NODE_ENV": process.env.NODE_ENV || "development"
};

module.exports = environmentVariables;

// eslint enable no-var
