'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');

var FileSchema = new Schema({
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
        enum: ['UPLOADFILE', 'ADDURL', 'EMBEDCODE']
    },
    fileS3Location: String,
    status: String,
    tags: [{
        relation: {
            "name": String,          //tag name
            "id": { type: mongoose.Schema.Types.ObjectId, ref: "contentTag" }
        },
        type: String,	//date picker, list picker, number, text, type(question, test, video, audio)
        values: []      // date value, array of list, number, string, objectIds
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
FileSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('File', FileSchema);