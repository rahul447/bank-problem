var bcrypt = require('bcrypt');
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Rules Schema
 */
var RulesSchema = new Schema({
    name: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }, 
    noOfSections: Number,
    sections: [
        {
            name: String,
            subSection: [
                {
                    isHidden: String,
                    name: String,
                    noOfQuestions: Number,
                    marks: Number,
                    negativeMarks: Number,
                    partialMarks: Number
                }
            ]
        }
    ]
});


module.exports = mongoose.model('Rules', RulesSchema);



