'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Rules Schema
 */
var StudyMaterialSchema = new Schema({
    content: [{
        locale: String,
        content: String,
        title: String,
    }],
    status: {
        type: String,
        default: "draft"
    },
    tags: [{
        name: String,
        type: String,
        values: [String]
    }],
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


module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema, 'studyMaterials');



