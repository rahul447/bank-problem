const config = {
    "mode": "docker_dev",
    "database":{
        "userName":"cmsv2test1",
        "password":"cmsv2test",
        "port":27017,
        "host":"mongo.dev.mypat-internal.in",
        "databaseName":"myPat-v2Cmswthtest",
    },
    "http": {
        "protocol": "http",
        "domain": "127.0.0.1",
        "port": 3021
    },
    "appName": "cmsv2-dataService-es6",
    "elasticConnection":{
        "port":9200,
        "hostname":"es.dev.mypat-internal.in"
 
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