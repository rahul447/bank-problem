'use strict';

import values from "../../../config/values";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId;
    Schema = mongoose.Schema;

/**
 * subCategory Schema
 */

var subCategorySchema = new Schema({
    categoryId: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        name: String
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

subCategorySchema.index({ updatedAt: -1 });
subCategorySchema.index({ "categoryId.id": 1 }, {sparse: true});

subCategorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('subCategory', subCategorySchema);