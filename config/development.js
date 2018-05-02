const config = {
    "mode": "development",
    "http": {
        "protocol": "http",
        "domain": "127.0.0.1",
        "port": 3021
    },
    "appName": "cmsv2-dataService-es6",
    "database": {
        "userName": "",
        "password": "",
        "port": 27017,
        "host": "127.0.0.1",
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
    "authorization": {
        "authorize": false
    },
    "elasticConnection":{
        "port":9200,
        "hostname":"localhost"

    }
    
 };
 module.exports = config;
 