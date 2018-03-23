const config = {
    "mode": "docker_production",
    'process.env.PORT': 3021,
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
 
    }
 };
 module.exports = config;