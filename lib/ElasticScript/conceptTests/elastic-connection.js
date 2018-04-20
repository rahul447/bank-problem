var elasticsearch = require('elasticsearch');
var config = require('../../../config/start.js')

var endpoint = "http://" + config.elasticConnection.hostname+":"+config.elasticConnection.port
var client = new elasticsearch.Client({
  host: endpoint,
  log: 'error'
});

module.exports = client;