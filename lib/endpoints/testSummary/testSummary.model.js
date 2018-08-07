'use strict';

import values from "../../../config/values";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * TestsSummary Schema
 */

var TestsSummarySchema = new Schema({
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tests' },
    testName: String,
    testType: String,
    isOrgTest: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values,
        uppercase: true
    },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    concepts: [
        {
            chapterId: { type: mongoose.Schema.Types.ObjectId },
            name: String,
            id:String,
            questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
        }
    ],
    chapters: [
        {
            subSubjectId: { type: mongoose.Schema.Types.ObjectId },
            name: String,
            questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
            concepts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Concept' }],
            id: String
        }
    ],
    subjects: [
        {
            name: String,
            id:String,
            questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
        }
    ],
    subSubjects :[
        {
            subjectId: { type: mongoose.Schema.Types.ObjectId },
            name: String,
            id:String,
            questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
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
    aclMetaData: {
        createdBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        clientId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "Client" },
        allowedTo: [
            {
                user: {
                    id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
                    email: { type: String }
                },
                allPermissionAllowed: { type: Boolean },
                accessAllowed: [{ type: String, enum: values.validAccessTypes }]
            }
        ],
        subjects: [{ type: String }],
        centers: [{ type: String }]
    }

});

TestsSummarySchema.index({ testId: 1, courseId: 1 });

TestsSummarySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('TestsSummary', TestsSummarySchema,'testsummaries');