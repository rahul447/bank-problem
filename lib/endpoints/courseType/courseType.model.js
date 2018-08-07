'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * courseType Schema
 */

var courseTypeSchema = new Schema({
    name: String,
    validClass: [{
        classId: { type: Schema.Types.ObjectId, ref: 'Class' },
        name: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    category: {
        id: { type: Schema.Types.ObjectId, ref: 'Category' },
        name: String
    },
    subCategory: {
        id: { type: Schema.Types.ObjectId, ref: 'subCategory' },
        name: String
    },
    migrationObject:{},
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

courseTypeSchema.index({ "subCategory.id": 1 });

courseTypeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('courseType', courseTypeSchema, 'coursetypes');