'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Rules Schema
 */
var ClientSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String
    },
    address: String,
    email: String,
    // This is to make myPAT courses available to an Org in future
    courses: [],
    enterpriseApiUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Client', ClientSchema, 'clients');



