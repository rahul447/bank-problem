'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Video Schema
 */
var VideoSchema = new Schema({
    content: [{
        /*locale: {
            id: { type: mongoose.Schema.Types.ObjectId, ref:  }
        },*/
        title: String,
        description: String
    }],
    via: {
        type: String,
        enum: ['UPLOADVIDEO', 'ADDURL', 'EMBEDCODE']
    },
    status: String,
    duration: String,
    tags: [{
        name: String,
        type: String,
        values: [String]
    }],
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Video', VideoSchema);



