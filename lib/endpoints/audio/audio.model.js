'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Audio Schema
 */

var AudioSchema = new Schema({
    content: [{
        locale: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
            name: String
        },
        title: String,
        description: String
    }],
    via: {
        type: String,
        enum: ['UPLOADAUDIO', 'ADDURL', 'EMBEDCODE']
    },
    location: String,
    status: String,
    duration: String,
    tags: [{
        relation: {
            "name": String,          //tag name
            "id": { type: mongoose.Schema.Types.ObjectId, ref: "contentTag" }
        },
        type: String,       // date ,list ,number, text, usedin content(study material, question)
        values: []      // date value , array of list, number, string, objects , objectIds ,
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
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Audio', AudioSchema);



