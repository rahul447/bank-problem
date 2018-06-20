'use strict';

import values from "../../../config/values";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Category Schema
 */

var CategorySchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    name: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
    },
});

CategorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Category', CategorySchema);