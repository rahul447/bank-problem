'use strict';

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
    // _id:{type:mongoose.Schema.Types.ObjectId},
    clientId:{type:mongoose.Schema.Types.ObjectId},
    userId:{type:mongoose.Schema.Types.ObjectId},
    ancestors: [],
    name: String,
    type: String,
    typeCode: String,
    courseId: { type: mongoose.Schema.Types.ObjectId },
    parent: {
        id: { type: mongoose.Schema.Types.ObjectId },
        Type: String
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

    }
});

module.exports = mongoose.model('CourseSyllabus', CourseSyllabusSchema, 'coursesyllabuses');
