'use strict';

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
    ]

});

module.exports = mongoose.model('TestsSummary', TestsSummarySchema,'testsummaries');