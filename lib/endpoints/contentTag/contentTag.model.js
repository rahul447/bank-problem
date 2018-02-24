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
        type: String,			//date picker, list picker, number, text, usedinXXX
        data: [String]			// null, [Strings], null, null, null
    },
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


module.exports = mongoose.model('ContentTag', ContentTagSchema, 'contentTags');