const config = {
    "mode": "docker_dev",
    'process.env.PORT': 3021,
    "database":{
        "userName":"cmsv2test1",
        "password":"cmsv2test",
        "port":27017,
        "host":"mongo.dev.mypat-internal.in",
        "databaseName":"myPat-v2Cmswthtest",
    },
    "elasticConnection":{
        "port":9200,
        "hostname":"es.dev.mypat-internal.in"
 
    }
 };
 module.exports = config;