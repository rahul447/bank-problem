const config = {
    "mode": "docker_staging",
    'process.env.PORT': 3021,
    "database":{
        "userName":"cmsv2test1",
        "password":"cmsv2test",
        "port":27017,
        "host":"mongo.staging.mypat-internal.in",
        "databaseName":"myPat-v2Cmswthtest",
    },
    "elasticConnection":{
        "port":9200,
         "hostname":"es.staging.mypat-internal.in"
 
    }
 };
 module.exports = config;