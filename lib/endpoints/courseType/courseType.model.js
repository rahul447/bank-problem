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
    migrationObject:{}
});

courseTypeSchema.index({ "subCategory.id": 1 });

courseTypeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('courseType', courseTypeSchema, 'coursetypes');