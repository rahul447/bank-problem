'use strict';

import values from "../../../config/values";

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
            type: String, //date picker, list picker, number, text, type(question, test, video, audio)
            enum: values.tagAssociationTypes
        },
        data: [String]			// null, [Strings], null, null, type(question, test, video, audio)
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