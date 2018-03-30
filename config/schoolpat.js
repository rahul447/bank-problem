const config = {
    "mode": "schoolpat",
    "http": {
        "protocol": "http",
        "domain": "35.165.232.18",
        "port": 3027
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

};
module.exports = config;
