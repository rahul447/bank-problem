const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

export function dbConnect(config) {
    
    //Database Connection Url
    let uri = 'mongodb://'+config.database.host+":"+ config.database.port + "/" + 
    config.database.databaseName;

    let options = {
        user: config.database.userName,
        pass: config.database.password,
        useMongoClient: true
    };

    //Connection Establishment
    mongoose.connect(uri, options);
    //mongoose.connect(uri, {useMongoClient: true});

}