'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ContentTagSchema = new Schema({
    isCompulsory: Boolean,
    isVisible: Boolean,
    desc: String,
    name: String,
    content: {
        type: {
            type: String        //date picker, list picker, number, text, contentType
        },
        data: [String]			// null, [Strings], null, null, type(question, test, video, audio)
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
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

ContentTagSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});



module.exports = mongoose.model('ContentTag', ContentTagSchema, 'contentTags');