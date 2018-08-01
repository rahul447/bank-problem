const config = {
    "mode": "feature",
    "http": {
        "protocol": "http",
        "domain": "localhost",
        "port": 3023
    },
    "appName": "cmsv2-dataService-es6",
    "database": {
        "userName": "mypat2cmsstaging",
        "password": "mypat2cmsstaging",
        "port": 38190,
        "host": "localhost",
        "databaseName": "mypat-v2CmsWithTest",
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
    "elasticConnection":{
        "port":9200,
        "hostname":"localhost"

    },
    "awsDetailsBulkUploader": {
        accessKeyId: ' AKIAIOEAUJI6NIXBJT3Q',
        secretAccessKey: '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',
        region: 'us-west-2'
    },
    "testBulk": {
        "bucket": "mypat-cms-vid-content-dev",
        "folder": "testBulk"
    },

};
module.exports = config;
