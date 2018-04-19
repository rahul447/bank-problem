var bcrypt = require('bcrypt');
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

let ChapterSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    subject : {
        id :  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        name : String
    },
    subsubject: {
        id : { type: mongoose.Schema.Types.ObjectId, ref: 'subSubject' },
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
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    migrationObject:{}
});

ChapterSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Chapter', ChapterSchema);