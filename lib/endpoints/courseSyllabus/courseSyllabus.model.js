'use strict';

import values from "../../../config/values";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Chapter Schema
 */

var CourseSyllabusSchema = new Schema({
    ancestors: [],
    name: String,
    type: String,
    typeCode: String,
    courseId: { type: mongoose.Schema.Types.ObjectId },
    parent: {
        id: { type: mongoose.Schema.Types.ObjectId },
        type: String
    },
    masterIDs: [{ type: mongoose.Schema.Types.ObjectId }],
    associatedContent: [
        {
            contentType: String,
            displayName: String,
            contentId: { type: mongoose.Schema.Types.ObjectId },
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    migrationObject:{

    },
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
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
CourseSyllabusSchema.index({ "courseId": 1, "type": 1});
CourseSyllabusSchema.index({ "name": 1 });




CourseSyllabusSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CourseSyllabus', CourseSyllabusSchema, 'coursesyllabuses');
