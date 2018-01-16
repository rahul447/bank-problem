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
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    name: String,
    subject: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        name: String
    },
    chapters: [
        {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
            name: String
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

module.exports = mongoose.model('Grade', GradeSchema);
