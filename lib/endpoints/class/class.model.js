var bcrypt = require('bcrypt');
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Concept Schema
 */

var ClassSchema = new Schema({

    userId : {type:mongoose.Schema.Types.ObjectId,default:null, ref: "User"},
    name: String,
    status: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    migrationObject:{

    }
});

ClassSchema.index({ "status": 1 });

ClassSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Class', ClassSchema, 'classes');