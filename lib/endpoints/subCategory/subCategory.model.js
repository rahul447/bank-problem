'use strict';

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
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
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
    } 
});

subCategorySchema.index({ updatedAt: -1 });
subCategorySchema.index({ "categoryId.id": 1 }, {sparse: true});

subCategorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('subCategory', subCategorySchema);