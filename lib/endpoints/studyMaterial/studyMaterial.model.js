'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
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
        relation: {
            "name": String,          //tag name
            "id": { type: mongoose.Schema.Types.ObjectId, ref: "contentTag" }
        },
        type: String,	//date picker, list picker, number, text, type(question, test, video, audio)
        values: []      // date value, array of list, number, string, objectIds
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
StudyMaterialSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema, 'studyMaterials');



