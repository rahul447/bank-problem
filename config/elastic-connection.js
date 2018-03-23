var elasticsearch = require('elasticsearch');
var config=require("./start.js");

var endPoint="http://"+config.elasticConnection.hostname+":"+config.elasticConnection.port

var client = new elasticsearch.Client({
    host: endPoint

});

module.exports = client;