const config = {
    "mode": "production",
    "appName": "cmsv2-dataService-es6",
    "database":{
        "userName":"cmsv2test2",
        "password":"cmsv2test",
        "port":27017,
        "host":"mongo.prod.mypat-internal.in",
        "databaseName":"myPat-v2Cmswthtest",
    },
    "elasticConnection":{
        "port":9200,
        "hostname":"es.prod.mypat-internal.in"
    },
    "http": {
        "protocol": "http",
        "domain": "cmsds2.prod.mypat-internal.in",
        "port": 3021
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
    "fiitjee-enterprise-id": "5aaca7a07c920065582c700e",
    "skipHook": true,
    "appRoot": __dirname.substring(0, __dirname.lastIndexOf("/"))
 };
 module.exports = config;