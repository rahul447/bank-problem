const environmentVariables = require("./environmentVariables");
const config = {
    "mode": "development",
    'process.env.PORT': 3021,
    "database":{
        "userName":"cmsv2test1",
        "password":"cmsv2test",
        "port":38018,
        "host":"35.165.232.18",
        "databaseName":"myPat-v2Cmswthtest",
    },
    "logger": {
        "name": "cmsv2-backend-es6",
        "streams": [
            {
                "level": environmentVariables.CMSV2_API_LOGGING_LEVEL,
                "stream": process.stdout
            },
            {
                "level": environmentVariables.CMSV2_API_LOGGING_LEVEL,
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
 