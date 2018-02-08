const environmentVariables = require("./environmentVariables");
const config = {
    "mode": "staging",
    "http": {
        "protocol": "http",
        "domain": "127.0.0.1",
        "port": 3021
    },
    "appName": "cmsv2-dataService-es6",
    "database": {
        "userName": "mypat2cmsstaging",
        "password": "mypat2cmsstaging",
        "port": 38018,
        "host": "35.165.232.18",
        "databaseName": "myPat-v2Cms-Staging"
    },
    "logger": {
        "name": "cmsv2-backend-es6",
        "streams": [
            {
                "level": environmentVariables.CMSV2_DATASERVICE_LOGGING_LEVEL,
                "stream": process.stdout
            },
            {
                "level": environmentVariables.CMSV2_DATASERVICE_LOGGING_LEVEL,
                "path": "/var/log/cmsv2/cmsv2-dataService-es6-debug.log"
            },
            {
                "level": "info",
                "path": "/var/log/cmsv2/cmsv2-dataService-es6-info.log"
            }
        ]
    },
    "environmentVariableChecker": {
        "isEnabled": false
    },
    "urlPrefix": "",

};
module.exports = config;
