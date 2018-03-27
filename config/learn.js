const config = {
    "mode": "learn",
    "http": {
        "protocol": "http",
        "domain": "127.0.0.1",
        "port": 3025
    },
    "appName": "cmsv2-dataService-es6",
    "database": {
        "userName": "cmsmypat2",
        "password": "cmsmppat22017",
        "port": 38018,
        "host": "35.165.232.18",
        "databaseName": "myPat-v2Cms"
    },
    "logger": {
        "name": "cmsv2-backend-es6",
        "streams": [
            {
                "level": "debug",
                "stream": process.stdout
            },
            {
                "level": "debug",
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
    "authorization": {
        "authorize": false
    }
    
 };
 module.exports = config;
 