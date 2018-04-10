'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Concept Schema
 */

var ConceptSchema = new Schema({
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
    name:String,
    conceptCode: String,
    chapter:{
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
        name: String
    },
    subsubject : {
        id : { type: mongoose.Schema.Types.ObjectId, ref: 'subSubject' },
        name : String
    },
    migrationObject:{},
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

ConceptSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Concept', ConceptSchema);
