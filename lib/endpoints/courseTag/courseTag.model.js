'use strict';

import values from "../../../config/values";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CourseTagSchema = new Schema({
    isCompulsory: Boolean,
    isVisible: Boolean,
    desc: String,
    name: String,
    content: {
        type: {
            type: String
        },			//date picker, list picker, number, text, usedinXXX
        data: [String]			// null, [Strings], null, null, null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
    },
    aclMetaData: {
        createdBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        clientId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "Client" }
    }
});

CourseTagSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


module.exports = mongoose.model('CourseTag', CourseTagSchema, 'courseTags');