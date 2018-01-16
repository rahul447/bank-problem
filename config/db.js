
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//Database Connection Url
uri = 'mongodb://' + config.database.userName + ":" + config.database.password + "@" + config.database.host + ":" + config.database.port + "/" + config.database.databaseName;
//Connection Establishment
console.log(uri)
mongoose.connect(uri);
//module.exports=db;
