const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

export function dbConnect(config) {
    //Database Connection Url
    /*let uri = 'mongodb://' + config.database.userName + ":" + config.database.password + "@" + config.database.host + ":" + config.database.port + "/" + config.database.databaseName;*/

    let uri = 'mongodb://' + config.database.host + ":" + config.database.port + "/" + config.database
        .databaseName;
    console.log("uri : ", uri);
    //Connection Establishment
    mongoose.connect(uri, {useMongoClient: true});
}