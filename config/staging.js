const config = {
    "mode": "staging",
    "http": {
        "protocol": "http",
        "domain": "35.165.232.18",
        "port": 3023
    },
    "appName": "cmsv2-dataService-es6",
    "database": {
        "userName": "mypat2cmsstaging",
        "password": "mypat2cmsstaging",
        "port": 38018,
        "host": "35.165.232.18",
        "databaseName": "myPat-v2Cms-Staging",
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
    "encryptKey": "supersecretkey",
    "fiitjee-enterprise-id": "5b4319f6fb4624635ed0c70d",
    "skipHook": true
};
module.exports = config;
