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




ChapterSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
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
    migrationObject:{}
});

module.exports = mongoose.model('Chapter', ChapterSchema);