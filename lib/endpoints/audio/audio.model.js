'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');

var AudioSchema = new Schema({
    content: [{
        locale: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
            name: String
        },
        title: String,
        description: String,
        data: {
            noOfAudios: Number,
            audios: [{
                fileS3Location: String,
            }]
        }
    }],
    via: {
        type: String,
        enum: ['UPLOADAUDIO', 'ADDURL', 'EMBEDCODE']
    },
    status: String,
    tags: [{
        relation: {
            "name": String,          //tag name
            "id": { type: mongoose.Schema.Types.ObjectId, ref: "contentTag" }
        },
        type: String,     // date, list, number, text, used in xxxx(study material, question etc)
        values: []       // start end date values, array of selected list items, number, string, objectIds
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
AudioSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Audio', AudioSchema);