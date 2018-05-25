var bcrypt = require('bcrypt');
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Grade Schema
 */
var GradeSchema = new Schema({
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
    subjects: [
        {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
            name: String,
            chapters: [
                {
                    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
                    name: String,
                    subsubject: {
                        id : { type: mongoose.Schema.Types.ObjectId, ref: 'subSubject' },
                        name: String
                    }
                }
            ]
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
    migrationObject : {
    }
});

/*GradeSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
GradeSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
GradeSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});*/

GradeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Grade', GradeSchema);
