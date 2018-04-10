'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Subject Schema
 */
var SubjectSchema = new Schema({
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
    name: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    migrationObject:{}
});

SubjectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

    
module.exports = mongoose.model('Subject', SubjectSchema);